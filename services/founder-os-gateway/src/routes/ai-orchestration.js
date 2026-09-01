import { authenticateAgentCallback, authenticateFounder } from "../lib/auth.js";
import { completeTask, dispatchTask, readOrchestrationState } from "../lib/ai-orchestration.js";
import { providerReadiness } from "../lib/ai-provider-adapters.js";
import { commitFilesAtomically, readRepositoryJson } from "../lib/github.js";
import { classifyRepositoryPlan, executeRepositoryPlan } from "../lib/repository-execution.js";
import { errorResponse, json } from "../lib/http.js";

const STATE_PATH = "docs/founder-os/config/ai-orchestration-state.json";

function parseStateRoute(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/packages\/([^/]+)\/orchestration$/);
  return match ? { workspaceId: decodeURIComponent(match[1]), packageId: decodeURIComponent(match[2]) } : null;
}

function parseTeamPlanRoute(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/packages\/([^/]+)\/team-plan$/);
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

function resultRecordPath({ workspaceId, packageId, taskId }) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.result.json`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function authenticateRepositoryPreparation(request, env, classification) {
  let auth = authenticateFounder(request, env);
  if (!auth.ok && !classification.founderRequired) auth = authenticateAgentCallback(request, env);
  if (auth.ok && auth.actor.role !== "founder" && !auth.actor.permissions.includes("repository:prepare")) {
    return { ok: false, status: 403, code: "REPOSITORY_PREPARATION_FORBIDDEN", message: "This AI credential cannot prepare repository work." };
  }
  if (!auth.ok && classification.founderRequired) {
    return {
      ok: false,
      status: 403,
      code: "FOUNDER_APPROVAL_REQUIRED",
      message: "This repository plan affects a consequential or sensitive area and requires Founder approval."
    };
  }
  return auth;
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
    founderApprovalRequired: current.owner === "founder",
    updatedAt: now,
    tasks: state.tasks.map((task) => task.id === route.taskId ? {
      ...task,
      status: "ready",
      providerStatus: task.owner === "founder" ? "manual-review-required" : "ready",
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

const CONTROL_ACTIONS = new Set(["handoff", "reassign", "provider_switch", "submit_review"]);
const TEMPLATE_ROLE_IDS = new Set(["art", "codex", "gemini", "gpose", "duey", "founder"]);
const PROVIDER_IDS = new Set(["openai", "google"]);

function normalizePlannedRole(value) {
  const role = value && typeof value === "object" ? value : {};
  const id = String(role.id || "").trim().toLowerCase();
  const name = String(role.name || role.title || "").trim();
  const purpose = String(role.purpose || role.reason || "").trim();
  const provider = String(role.provider || "").trim().toLowerCase();
  const capabilities = Array.isArray(role.capabilities) ? role.capabilities.map((item) => String(item).trim()).filter(Boolean) : [];
  if (!/^[a-z][a-z0-9-]{1,47}$/.test(id)) throw new Error("Each AI-created role needs a stable lowercase role ID.");
  if (!name || !purpose || capabilities.length === 0) throw new Error(`Role ${id} requires a name, purpose, and capabilities.`);
  if (!PROVIDER_IDS.has(provider)) throw new Error(`Role ${id} uses an unsupported provider.`);
  return {
    id, name, role: String(role.role || role.title || name).trim(), purpose, provider,
    capabilities, allowedActions: capabilities,
    requiresFounderApprovalFor: Array.isArray(role.requiresFounderApprovalFor)
      ? role.requiresFounderApprovalFor.map((item) => String(item).trim()).filter(Boolean)
      : [],
    templateId: TEMPLATE_ROLE_IDS.has(String(role.templateId || "").trim().toLowerCase())
      ? String(role.templateId).trim().toLowerCase()
      : null,
    createdBy: "ai-team-composer"
  };
}

async function recordAiTeamPlan(env, route, actor, body) {
  const roles = Array.isArray(body.roles) ? body.roles.map(normalizePlannedRole) : [];
  const rationale = String(body.rationale || "").trim();
  if (roles.length === 0 || roles.length > 12) throw new Error("The AI team plan must contain between 1 and 12 roles.");
  if (new Set(roles.map((role) => role.id)).size !== roles.length) throw new Error("AI-created role IDs must be unique.");
  if (!rationale) throw new Error("The AI team plan must explain why these roles are needed.");

  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== route.workspaceId || state.packageId !== route.packageId) {
    throw new Error("No orchestration state exists for this workspace and package.");
  }
  if (body.expectedUpdatedAt && body.expectedUpdatedAt !== state.updatedAt) {
    throw new Error("Canonical work changed after team analysis began. Recompose the team from current state.");
  }
  const now = new Date().toISOString();
  const founderRole = {
    id: "founder", name: "Founder", role: "Protected Approval",
    purpose: "Retains final authority over protected and consequential decisions.",
    provider: "manual", capabilities: ["approve", "reject", "request-changes"],
    allowedActions: ["approve", "reject", "request-changes"],
    requiresFounderApprovalFor: [], createdBy: "governance"
  };
  const teamPlan = {
    version: "1.0.0", generatedBy: actor.id || "ai-team-composer", generatedAt: now,
    rationale, objective: String(body.objective || "").trim() || null,
    roles: [...roles, founderRole],
    status: "active", founderOverrideAvailable: true
  };
  const nextState = { ...state, teamPlan, updatedAt: now };
  const repository = await commitFilesAtomically(env, {
    message: `orchestration: compose AI team for ${route.packageId}`,
    files: [
      { path: STATE_PATH, content: nextState },
      { path: `docs/orchestration/${route.workspaceId}/${route.packageId}/team-plan.json`, content: teamPlan }
    ]
  });
  return { state: nextState, teamPlan, repository };
}

async function controlAiTask(env, route, actor, body) {
  const action = String(body.action || "").trim().toLowerCase();
  const note = String(body.note || "").trim();
  const targetRole = String(body.targetRole || "").trim().toLowerCase();
  const provider = String(body.provider || "").trim().toLowerCase();
  if (!CONTROL_ACTIONS.has(action)) throw new Error("Unsupported AI Team control.");
  if (!note) throw new Error("A Founder note is required for AI Team controls.");

  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== route.workspaceId || state.packageId !== route.packageId) {
    throw new Error("No orchestration state exists for this workspace and package.");
  }
  if (body.expectedUpdatedAt && body.expectedUpdatedAt !== state.updatedAt) {
    throw new Error("Canonical work changed after this screen loaded. Refresh before applying a control.");
  }
  const task = state.tasks.find((item) => item.id === route.taskId);
  if (!task) throw new Error("The requested AI task does not exist.");
  if (["complete", "completed", "founder-approved", "rejected"].includes(task.status)) {
    throw new Error("Completed work cannot be changed through AI Team controls.");
  }
  if (action === "provider_switch" && (task.owner === "founder" || !PROVIDER_IDS.has(provider))) {
    throw new Error("Provider switching requires an active AI-owned task and a supported provider.");
  }
  const availableRoleIds = new Set([
    ...TEMPLATE_ROLE_IDS,
    ...(Array.isArray(state.teamPlan?.roles) ? state.teamPlan.roles.map((role) => role.id) : [])
  ]);
  if (["handoff", "reassign"].includes(action) && (!availableRoleIds.has(targetRole) || targetRole === "founder")) {
    throw new Error("Select an active workspace-scoped AI role for this override.");
  }

  const now = new Date().toISOString();
  let nextOwner = task.owner;
  let nextStatus = task.status;
  let nextProviderStatus = task.providerStatus;
  const controlledTask = {
    ...task,
    updatedAt: now,
    founderControls: [...(Array.isArray(task.founderControls) ? task.founderControls : []), {
      action, note, targetRole: targetRole || null, provider: provider || null,
      recordedAt: now, recordedBy: actor.id
    }]
  };

  if (action === "handoff" || action === "reassign") {
    nextOwner = targetRole;
    nextStatus = "ready";
    nextProviderStatus = "ready";
    controlledTask.owner = targetRole;
    controlledTask.status = nextStatus;
    controlledTask.providerStatus = nextProviderStatus;
    controlledTask.nextRole = task.nextRole === targetRole ? null : task.nextRole;
    controlledTask.executionProviderOverride = null;
  }
  if (action === "provider_switch") {
    nextStatus = "ready";
    nextProviderStatus = "ready";
    controlledTask.status = nextStatus;
    controlledTask.providerStatus = nextProviderStatus;
    controlledTask.executionProviderOverride = provider;
    controlledTask.providerOverrideScope = "single-request";
  }
  if (action === "submit_review") {
    nextOwner = "founder";
    nextStatus = "ready";
    nextProviderStatus = "manual-review-required";
    controlledTask.owner = "founder";
    controlledTask.status = nextStatus;
    controlledTask.providerStatus = nextProviderStatus;
    controlledTask.nextRole = null;
    controlledTask.executionProviderOverride = null;
  }

  const nextState = {
    ...state,
    status: nextStatus,
    currentOwner: nextOwner,
    nextOwner: controlledTask.nextRole || null,
    founderApprovalRequired: nextOwner === "founder",
    updatedAt: now,
    tasks: state.tasks.map((item) => item.id === route.taskId ? controlledTask : item)
  };
  const controlRecord = {
    version: "1.0.0", workspaceId: route.workspaceId, packageId: route.packageId,
    taskId: route.taskId, action, note, targetRole: targetRole || null,
    provider: provider || null, recordedAt: now, recordedBy: actor.id
  };
  const repository = await commitFilesAtomically(env, {
    message: `founder: ${action.replace("_", " ")} ${route.taskId}`,
    files: [
      { path: STATE_PATH, content: nextState },
      { path: `docs/orchestration/${route.workspaceId}/${route.packageId}/${route.taskId}.control.json`, content: controlRecord }
    ]
  });
  return { state: nextState, control: controlRecord, repository };
}

async function recordFounderDecision(env, route, actor, body) {
  const decision = String(body.decision || "").trim();
  if (!["approve", "request_changes"].includes(decision)) {
    throw new Error("Founder decision must be approve or request_changes.");
  }

  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== route.workspaceId || state.packageId !== route.packageId) {
    throw new Error("No orchestration state exists for this workspace and package.");
  }
  const task = state.tasks.find((item) => item.id === route.taskId);
  if (!task || task.owner !== "founder") throw new Error("The requested task is not a Founder decision task.");
  if (!['ready', 'blocked'].includes(task.status) || task.providerStatus !== "manual-review-required") {
    throw new Error("This Founder decision is not currently awaiting manual review.");
  }

  const now = new Date().toISOString();
  const note = String(body.note || "").trim();
  const decisionRecord = {
    resultVersion: "2.1.0",
    workspaceId: route.workspaceId,
    packageId: route.packageId,
    taskId: route.taskId,
    decision,
    note,
    decidedAt: now,
    decidedBy: actor.id,
    pullRequestUrl: body.pullRequestUrl || null,
    sourceReviewTask: "AI-TASK-004"
  };

  let nextState;
  if (decision === "approve") {
    nextState = {
      ...state,
      status: "complete",
      currentOwner: "founder",
      nextOwner: null,
      founderApprovalRequired: false,
      updatedAt: now,
      finalDecision: decisionRecord,
      tasks: state.tasks.map((item) => item.id === task.id ? {
        ...item,
        status: "complete",
        providerStatus: "founder-approved",
        blockedReason: null,
        completedAt: now,
        completedBy: actor.id,
        resultSummary: note || "Founder approved the implementation slice."
      } : item)
    };
  } else {
    nextState = {
      ...state,
      status: "ready",
      currentOwner: "codex",
      nextOwner: "gemini",
      founderApprovalRequired: false,
      updatedAt: now,
      finalDecision: decisionRecord,
      cycle: Number(state.cycle || 1) + 1,
      tasks: state.tasks.map((item) => {
        if (item.id === "AI-TASK-002") return {
          ...item,
          status: "ready",
          providerStatus: "ready",
          blockedReason: null,
          startedAt: null,
          startedBy: null,
          dispatchId: null,
          completedAt: null,
          completedBy: null,
          resultSummary: null,
          requiredInput: `${item.requiredInput} FOUNDER CORRECTION REQUEST: ${note || 'Apply the verified Gemini and GPose changes before returning for review.'}`,
          retryContext: {
            ...(item.retryContext || {}),
            previousOutcome: "founder-requested-changes",
            reason: note || "Founder requested the verified corrections.",
            requiredCorrection: "Implement the requested corrections on the existing implementation pull request or a successor pull request with fresh validation evidence."
          }
        };
        if (["AI-TASK-003", "AI-TASK-004", "AI-TASK-005"].includes(item.id)) return {
          ...item,
          status: "waiting",
          providerStatus: item.owner === "founder" ? "manual-review-required" : null,
          blockedReason: null,
          startedAt: null,
          startedBy: null,
          dispatchId: null,
          completedAt: null,
          completedBy: null,
          resultSummary: null
        };
        return item;
      })
    };
  }

  const repository = await commitFilesAtomically(env, {
    message: decision === "approve"
      ? `founder: approve ${route.packageId} implementation slice`
      : `founder: request changes for ${route.packageId}`,
    files: [
      { path: STATE_PATH, content: nextState },
      { path: resultRecordPath(route), content: decisionRecord }
    ]
  });

  return { state: nextState, decision: decisionRecord, repository };
}

export async function handleAiOrchestration(request, env, pathname) {
  if (pathname === "/v1/ai/providers") {
    if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use GET to check AI provider readiness.");
    return json(request, { ok: true, providers: providerReadiness(env) });
  }

  const stateRoute = parseStateRoute(pathname);
  const teamPlanRoute = parseTeamPlanRoute(pathname);
  const dispatchRoute = parseTaskRoute(pathname, "dispatch");
  const resultRoute = parseTaskRoute(pathname, "result");
  const recoverRoute = parseTaskRoute(pathname, "recover");
  const resetRoute = parseTaskRoute(pathname, "reset");
  const decisionRoute = parseTaskRoute(pathname, "decision");
  const controlRoute = parseTaskRoute(pathname, "control");
  const repositoryExecutionRoute = parseTaskRoute(pathname, "repository-execution");
  if (!stateRoute && !teamPlanRoute && !dispatchRoute && !resultRoute && !recoverRoute && !resetRoute && !decisionRoute && !controlRoute && !repositoryExecutionRoute) return null;

  if (stateRoute) {
    if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use GET to read AI work status.");
    try {
      const state = await readOrchestrationState({ env, ...stateRoute });
      return json(request, { ok: true, state });
    } catch (error) {
      return errorResponse(request, 404, "ORCHESTRATION_NOT_FOUND", error.message);
    }
  }

  if (controlRoute) {
    if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to apply an AI Team control.");
    const auth = authenticateFounder(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    const body = await readJson(request);
    try {
      const controlled = await controlAiTask(env, controlRoute, auth.actor, body);
      return json(request, { ok: true, status: `control-${body.action}-recorded`, ...controlled });
    } catch (error) {
      return errorResponse(request, 409, "AI_TEAM_CONTROL_REJECTED", error.message || "The AI Team control could not be recorded.");
    }
  }

  if (teamPlanRoute) {
    if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to publish an AI-composed team plan.");
    const auth = authenticateAgentCallback(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    const body = await readJson(request);
    try {
      const planned = await recordAiTeamPlan(env, teamPlanRoute, auth.actor, body);
      return json(request, { ok: true, status: "ai-team-composed", ...planned });
    } catch (error) {
      return errorResponse(request, 409, "AI_TEAM_PLAN_REJECTED", error.message || "The AI team plan could not be recorded.");
    }
  }

  if (decisionRoute) {
    if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to record a Founder decision.");
    const auth = authenticateFounder(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    const body = await readJson(request);
    try {
      const recorded = await recordFounderDecision(env, decisionRoute, auth.actor, body);
      return json(request, { ok: true, status: body.decision === "approve" ? "founder-approved" : "changes-requested", ...recorded });
    } catch (error) {
      return errorResponse(request, 409, "FOUNDER_DECISION_REJECTED", error.message || "The Founder decision could not be recorded.");
    }
  }

  if (resetRoute) {
    if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to reset a blocked AI task.");
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
    if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to return AI work results.");
    const auth = authenticateAgentCallback(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    const body = await readJson(request);
    if (!body.summary || !body.dispatchId) return errorResponse(request, 422, "RESULT_INVALID", "The AI result must include a summary and dispatchId.");
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
    if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to recover a synchronous AI result.");
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
    if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to execute approved repository work.");
    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) return errorResponse(request, 503, "CANONICAL_REPOSITORY_NOT_CONFIGURED", "The repository connection is not configured.");
    const body = await readJson(request);
    let classification;
    try {
      classification = classifyRepositoryPlan({ ...repositoryExecutionRoute, plan: body.plan });
    } catch (error) {
      return errorResponse(request, 422, "REPOSITORY_PLAN_INVALID", error.message || "The repository plan could not be classified.");
    }
    const auth = authenticateRepositoryPreparation(request, env, classification);
    if (!auth.ok) {
      return errorResponse(request, auth.status, auth.code, auth.message);
    }
    try {
      const execution = await executeRepositoryPlan({ env, ...repositoryExecutionRoute, plan: body.plan, actor: auth.actor });
      return json(request, { ok: true, status: "pull-request-created", execution });
    } catch (error) {
      const conflict = error.status === 409 || error.status === 422;
      return errorResponse(request, conflict ? 409 : 422, conflict ? "REPOSITORY_EXECUTION_CONFLICT" : "REPOSITORY_EXECUTION_REJECTED", error.message || "The approved repository work could not be executed.");
    }
  }

  if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to dispatch AI work.");
  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) return errorResponse(request, 503, "CANONICAL_REPOSITORY_NOT_CONFIGURED", "The repository connection is not configured.");

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
