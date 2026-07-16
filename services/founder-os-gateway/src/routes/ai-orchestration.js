import { authenticateAgentCallback, authenticateFounder } from "../lib/auth.js";
import { completeTask, dispatchTask, readOrchestrationState } from "../lib/ai-orchestration.js";
import { providerReadiness } from "../lib/ai-provider-adapters.js";
import { commitFilesAtomically, readRepositoryJson } from "../lib/github.js";
import { executeRepositoryPlan } from "../lib/repository-execution.js";
import { errorResponse, json } from "../lib/http.js";

const STATE_PATH = "docs/founder-os/config/ai-orchestration-state.json";

function parseStateRoute(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/packages\/([^/]+)\/orchestration$/);
  return match ? { workspaceId: decodeURIComponent(match[1]), packageId: decodeURIComponent(match[2]) } : null;
}

function parseTaskRoute(pathname, action) {
  const match = pathname.match(new RegExp(`^/v1/workspaces/([^/]+)/packages/([^/]+)/tasks/([^/]+)/${action}$`));
  return match ? {
    workspaceId: decodeURIComponent(match[1]),
    packageId: decodeURIComponent(match[2]),
    taskId: decodeURIComponent(match[3])
  } : null;
}

function taskRecordPath({ workspaceId, packageId, taskId }) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.json`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function validateCompletionEvidence(task, result) {
  const summary = String(result?.summary || "");
  if (!summary.trim()) throw new Error("The provider result is empty and cannot be verified.");
  if (/simulated|pretend|hypothetical/i.test(summary)) {
    throw new Error("The provider returned simulated work instead of verifiable repository changes.");
  }
  if (/pull request/i.test(task.expectedOutput || "")) {
    const pullRequestUrl = result.pullRequestUrl || result.repositoryEvidence?.pullRequestUrl;
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/i.test(String(pullRequestUrl || ""))) {
      throw new Error("Implementation completion requires a real GitHub pull request URL.");
    }
  }
}

async function recoverSynchronousResult(env, route, actor) {
  const [{ content: state }, { content: record }] = await Promise.all([
    readRepositoryJson(env, STATE_PATH),
    readRepositoryJson(env, taskRecordPath(route))
  ]);
  const task = state.tasks.find((item) => item.id === route.taskId);
  const result = record?.delivery?.completedResult;
  if (!task || task.status !== "working" || task.providerStatus !== "delivered") {
    throw new Error("This task is not waiting for synchronous result recovery.");
  }
  if (!record?.delivery?.synchronous || !result) {
    throw new Error("No synchronous provider result is available to recover.");
  }
  validateCompletionEvidence(task, result);
  return completeTask({ env, ...route, result, actor });
}

async function resetTask(env, route, actor, reason) {
  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== route.workspaceId || state.packageId !== route.packageId) {
    throw new Error("No orchestration state exists for this workspace and package.");
  }
  const current = state.tasks.find((item) => item.id === route.taskId);
  if (!current) throw new Error("The requested AI task does not exist.");
  if (current.status === "complete") throw new Error("Completed tasks cannot be reset through the retry endpoint.");

  const now = new Date().toISOString();
  const resetState = {
    ...state,
    status: "ready",
    currentOwner: current.owner,
    nextOwner: current.nextRole || null,
    founderApprovalRequired: false,
    updatedAt: now,
    tasks: state.tasks.map((task) => task.id === route.taskId ? {
      ...task,
      status: "ready",
      providerStatus: "ready",
      blockedReason: null,
      startedAt: null,
      startedBy: null,
      dispatchId: null,
      verificationFailedAt: null,
      resetAt: now,
      resetBy: actor.id,
      retryContext: {
        ...(task.retryContext || {}),
        previousOutcome: task.providerStatus || task.status,
        reason: reason || task.blockedReason || "Founder-authorized retry",
        requiredCorrection: "Retry using the task's deterministic provider contract and canonical evidence."
      }
    } : task)
  };

  const repository = await commitFilesAtomically(env, {
    message: `orchestration: reset ${route.taskId} for verified retry`,
    files: [{ path: STATE_PATH, content: resetState }]
  });
  return { state: resetState, repository };
}

export async function handleAiOrchestration(request, env, pathname) {
  if (pathname === "/v1/ai/providers") {
    if (request.method !== "GET") {
      return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use GET to check AI provider readiness.");
    }
    return json(request, { ok: true, providers: providerReadiness(env) });
  }

  const stateRoute = parseStateRoute(pathname);
  const dispatchRoute = parseTaskRoute(pathname, "dispatch");
  const resultRoute = parseTaskRoute(pathname, "result");
  const recoverRoute = parseTaskRoute(pathname, "recover");
  const resetRoute = parseTaskRoute(pathname, "reset");
  const repositoryExecutionRoute = parseTaskRoute(pathname, "repository-execution");
  if (!stateRoute && !dispatchRoute && !resultRoute && !recoverRoute && !resetRoute && !repositoryExecutionRoute) return null;

  if (stateRoute) {
    if (request.method !== "GET") {
      return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use GET to read AI work status.");
    }
    try {
      const state = await readOrchestrationState({ env, ...stateRoute });
      return json(request, { ok: true, state });
    } catch (error) {
      return errorResponse(request, 404, "ORCHESTRATION_NOT_FOUND", error.message);
    }
  }

  if (resetRoute) {
    if (request.method !== "POST") {
      return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to reset a blocked AI task.");
    }
    const auth = authenticateFounder(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    const body = await readJson(request);
    try {
      const reset = await resetTask(env, resetRoute, auth.actor, body.reason);
      return json(request, { ok: true, status: "ready", retryAllowed: true, ...reset });
    } catch (error) {
      return errorResponse(request, 409, "AI_RESET_REJECTED", error.message || "The task could not be reset.");
    }
  }

  if (resultRoute) {
    if (request.method !== "POST") {
      return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to return AI work results.");
    }
    const auth = authenticateAgentCallback(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    const body = await readJson(request);
    if (!body.summary || !body.dispatchId) {
      return errorResponse(request, 422, "RESULT_INVALID", "The AI result must include a summary and dispatchId.");
    }
    try {
      const state = await readOrchestrationState({ env, workspaceId: resultRoute.workspaceId, packageId: resultRoute.packageId });
      const task = state.tasks.find((item) => item.id === resultRoute.taskId);
      validateCompletionEvidence(task, body);
      const completed = await completeTask({ env, ...resultRoute, result: body, actor: auth.actor });
      return json(request, { ok: true, status: "completed", ...completed });
    } catch (error) {
      return errorResponse(request, 422, "RESULT_REJECTED", error.message || "The AI result could not be recorded.", { retryAllowed: true });
    }
  }

  if (recoverRoute) {
    if (request.method !== "POST") {
      return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to recover a synchronous AI result.");
    }
    const auth = authenticateFounder(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    try {
      const completed = await recoverSynchronousResult(env, recoverRoute, auth.actor);
      return json(request, { ok: true, status: "completed", ...completed });
    } catch (error) {
      return errorResponse(request, 422, "RESULT_VERIFICATION_FAILED", error.message || "The synchronous result could not be verified.", { retryAllowed: true });
    }
  }

  if (repositoryExecutionRoute) {
    if (request.method !== "POST") {
      return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to execute approved repository work.");
    }
    const auth = authenticateFounder(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) {
      return errorResponse(request, 503, "CANONICAL_REPOSITORY_NOT_CONFIGURED", "The repository connection is not configured.");
    }
    const body = await readJson(request);
    try {
      const execution = await executeRepositoryPlan({ env, ...repositoryExecutionRoute, plan: body.plan, actor: auth.actor });
      return json(request, { ok: true, status: "pull-request-created", execution });
    } catch (error) {
      const conflict = error.status === 409 || error.status === 422;
      return errorResponse(request, conflict ? 409 : 422, conflict ? "REPOSITORY_EXECUTION_CONFLICT" : "REPOSITORY_EXECUTION_REJECTED", error.message || "The approved repository work could not be executed.");
    }
  }

  if (request.method !== "POST") {
    return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to dispatch AI work.");
  }

  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) {
    return errorResponse(request, 503, "CANONICAL_REPOSITORY_NOT_CONFIGURED", "The repository connection is not configured.");
  }

  const body = await readJson(request);
  try {
    const result = await dispatchTask({ env, ...dispatchRoute, actor: auth.actor, dryRun: body.dryRun === true });
    return json(request, { ok: true, status: result.dryRun ? "dry-run-passed" : result.dispatch.status, ...result });
  } catch (error) {
    if (body.dryRun !== true) {
      try {
        const recovered = await recoverSynchronousResult(env, dispatchRoute, auth.actor);
        return json(request, { ok: true, status: "completed", recovered: true, ...recovered });
      } catch (recoveryError) {
        if (/simulated|pull request URL|verifiable repository|valid .* JSON|unapproved path/i.test(recoveryError.message || "")) {
          return errorResponse(request, 422, "RESULT_VERIFICATION_FAILED", recoveryError.message, { retryAllowed: true });
        }
      }
    }
    const conflict = /already|not ready|blocked|current orchestration role/i.test(error.message || "");
    return errorResponse(request, conflict ? 409 : 422, conflict ? "AI_DISPATCH_CONFLICT" : "AI_DISPATCH_BLOCKED", error.message || "The AI task could not be dispatched.");
  }
}
