import {
  commitFilesAtomically,
  readPullRequestReviewEvidence,
  readRepositoryJson
} from "./github.js";
import { deliverToProvider } from "./ai-provider-adapters.js";
import { executeCodexRepositoryResult } from "./codex-repository-bridge.js";
import { structuredLog } from "./structured-log.js";
import { verifyTaskResult } from "./result-verification.js";

const STATE_PATH = "docs/founder-os/config/ai-orchestration-state.json";
const AGENT_PATH = "docs/founder-os/config/ai-agent-registry.json";
const CANONICAL_STATE_URL = "https://natural-nation-mvp.github.io/natural-nation-mvp/founder-os/config/ai-orchestration-state.json";

function taskPath(workspaceId, packageId, taskId) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.json`;
}

function resultPath(workspaceId, packageId, taskId) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.result.json`;
}

function routingContext({ workspaceId, packageId, taskId, dispatchId = null, assignedRole = null }) {
  return { workspaceId, packageId, taskId, dispatchId, assignedRole };
}

function validateScope(state, workspaceId, packageId, taskId) {
  if (state.workspaceId !== workspaceId || state.packageId !== packageId) {
    throw new Error("This task does not belong to the requested workspace and package.");
  }
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("The requested AI task does not exist.");
  if (task.workspaceId !== workspaceId || task.packageId !== packageId) throw new Error("The task scope is invalid.");
  return task;
}

function validateDispatchEligibility(state, task) {
  if (task.status === "complete") throw new Error("This task is already complete.");
  if (task.status === "working") throw new Error("This task has already been dispatched.");
  if (task.status === "blocked") throw new Error("This task is blocked and must be reset after the blocking condition is resolved.");
  if (task.status !== "ready") throw new Error("This task is not ready to be dispatched.");
  if (state.currentOwner !== task.owner) throw new Error("This task is not owned by the current orchestration role.");
  if (task.startedAt || task.dispatchId) throw new Error("This task already has a dispatch record.");
}

function queuedState(state, task, actor, dispatchId) {
  const now = new Date().toISOString();
  return {
    ...state,
    status: "dispatching",
    currentOwner: task.owner,
    nextOwner: task.nextRole,
    updatedAt: now,
    tasks: state.tasks.map((item) => item.id === task.id ? {
      ...item,
      status: "working",
      startedAt: now,
      startedBy: actor.id,
      dispatchId,
      providerStatus: "dispatching",
      blockedReason: null
    } : item)
  };
}

function deliveredState(state, taskId, delivery) {
  const successful = delivery.delivered === true;
  return {
    ...state,
    status: successful ? "in-progress" : "blocked",
    updatedAt: new Date().toISOString(),
    tasks: state.tasks.map((item) => item.id === taskId ? {
      ...item,
      status: successful ? "working" : "blocked",
      providerStatus: delivery.status,
      blockedReason: successful ? null : delivery.message
    } : item)
  };
}

function verificationFailedState(state, taskId, reason) {
  const now = new Date().toISOString();
  return {
    ...state,
    status: "blocked",
    updatedAt: now,
    tasks: state.tasks.map((item) => item.id === taskId ? {
      ...item,
      status: "blocked",
      providerStatus: "verification-failed",
      blockedReason: reason,
      verificationFailedAt: now
    } : item)
  };
}

function completedState(state, task, result, actor) {
  const now = new Date().toISOString();
  const nextTask = state.tasks.find((item) => item.owner === task.nextRole && item.status === "waiting");
  return {
    ...state,
    status: nextTask ? "ready" : "complete",
    currentOwner: nextTask?.owner || task.nextRole || "founder",
    nextOwner: nextTask?.nextRole || null,
    updatedAt: now,
    tasks: state.tasks.map((item) => {
      if (item.id === task.id) {
        return {
          ...item,
          status: "complete",
          providerStatus: "result-verified",
          blockedReason: null,
          completedAt: now,
          completedBy: actor.id,
          resultSummary: result.summary
        };
      }
      if (nextTask && item.id === nextTask.id) return { ...item, status: "ready" };
      return item;
    })
  };
}

function resultRecord(state, task, result, actor, verificationStatus, verificationReason = null) {
  return {
    resultVersion: "1.5.0",
    workspaceId: state.workspaceId,
    packageId: state.packageId,
    taskId: task.id,
    dispatchId: result.dispatchId,
    receivedAt: new Date().toISOString(),
    receivedBy: actor.id,
    verificationStatus,
    ...(verificationReason ? { verificationReason } : {}),
    ...result
  };
}

async function enrichDispatchWithEvidence(env, task, dispatchRecord) {
  if (task.id !== "AI-TASK-003") return dispatchRecord;
  const source = `${task.requiredInput || ""} ${task.expectedOutput || ""}`;
  const pullNumber = Number(source.match(/PR\s*#(\d+)/i)?.[1]);
  const paths = [...new Set(source.match(/app\/frontend\/[A-Za-z0-9_./-]+/g) || [])];
  if (!pullNumber || paths.length === 0) throw new Error("Gemini review requires a current pull request number and explicit evidence paths.");
  const evidence = await readPullRequestReviewEvidence(env, pullNumber, paths);
  return {
    ...dispatchRecord,
    requiredInput: {
      instructions: task.requiredInput,
      pullRequestEvidence: evidence
    },
    evidenceContract: {
      pullRequestNumber: pullNumber,
      allowedPaths: paths,
      headSha: evidence.pullRequest.headSha
    }
  };
}

async function recordSynchronousOutcome({ env, state, task, dispatchRecord, delivery, result, actor }) {
  const deliveredRecord = {
    ...dispatchRecord,
    status: delivery.status,
    delivery,
    executionConfirmed: delivery.delivered === true
  };
  const verification = verifyTaskResult(task, result);
  if (!verification.ok) {
    const failedState = verificationFailedState(state, task.id, verification.reason);
    const failedResult = resultRecord(state, task, result, actor, "failed", verification.reason);
    const repository = await commitFilesAtomically(env, {
      message: `orchestration: reject unverifiable result for ${task.id}`,
      files: [
        { path: STATE_PATH, content: failedState },
        { path: taskPath(state.workspaceId, state.packageId, task.id), content: { ...deliveredRecord, status: "verification-failed", executionConfirmed: false } },
        { path: resultPath(state.workspaceId, state.packageId, task.id), content: failedResult }
      ]
    });
    return {
      state: failedState,
      result: failedResult,
      repository,
      verificationFailed: true,
      dispatch: { ...deliveredRecord, status: "verification-failed", executionConfirmed: false }
    };
  }

  const passedState = completedState(state, task, result, actor);
  const passedResult = resultRecord(state, task, result, actor, "passed");
  const repository = await commitFilesAtomically(env, {
    message: `orchestration: verify and complete ${task.id}`,
    files: [
      { path: STATE_PATH, content: passedState },
      { path: taskPath(state.workspaceId, state.packageId, task.id), content: { ...deliveredRecord, status: "completed", executionConfirmed: true } },
      { path: resultPath(state.workspaceId, state.packageId, task.id), content: passedResult }
    ]
  });
  return {
    state: passedState,
    result: passedResult,
    repository,
    verificationFailed: false,
    dispatch: { ...deliveredRecord, status: "completed", executionConfirmed: true }
  };
}

export async function dispatchTask({ env, workspaceId, packageId, taskId, actor, dryRun = false }) {
  const [{ content: state }, { content: registry }] = await Promise.all([
    readRepositoryJson(env, STATE_PATH),
    readRepositoryJson(env, AGENT_PATH)
  ]);
  const task = validateScope(state, workspaceId, packageId, taskId);
  validateDispatchEligibility(state, task);
  const agent = registry.agents.find((item) => item.id === task.owner);
  if (!agent) throw new Error("The assigned AI role is not registered.");

  const dispatchId = `AI-DISPATCH-${crypto.randomUUID().toUpperCase()}`;
  const context = routingContext({ workspaceId, packageId, taskId, dispatchId, assignedRole: agent.id });
  const updatedState = queuedState(state, task, actor, dispatchId);
  let dispatchRecord = {
    dispatchVersion: "1.6.0",
    dispatchId,
    workspaceId,
    packageId,
    taskId,
    agentId: agent.id,
    status: dryRun ? "validated" : "dispatching",
    requestedBy: actor.id,
    requestedAt: new Date().toISOString(),
    requiredInput: task.requiredInput,
    expectedOutput: task.expectedOutput,
    nextRole: task.nextRole,
    provider: agent.provider || "manual"
  };
  dispatchRecord = await enrichDispatchWithEvidence(env, task, dispatchRecord);

  structuredLog(dryRun ? "dispatch.validated" : "dispatch.started", {
    ...context,
    requestedBy: actor.id,
    preferredProvider: dispatchRecord.provider,
    dryRun
  });
  if (dryRun) {
    return {
      dryRun: true,
      writesPerformed: false,
      dispatch: dispatchRecord,
      state,
      message: "Dispatch validation passed. No task was started and no repository state was changed."
    };
  }

  const queuedRepository = await commitFilesAtomically(env, {
    message: `dispatch: record ${taskId} handoff to ${agent.name}`,
    files: [
      { path: STATE_PATH, content: updatedState },
      { path: taskPath(workspaceId, packageId, taskId), content: dispatchRecord }
    ]
  });

  const delivery = await deliverToProvider({ env, agent, dispatch: dispatchRecord });
  for (const attempt of delivery.attempts || []) {
    structuredLog("provider.attempt", {
      ...context,
      preferredProvider: delivery.preferredProvider,
      executingProvider: attempt.provider,
      temporaryRoleAssumption: attempt.temporaryRoleAssumption,
      status: attempt.status,
      model: attempt.model || null,
      errorCategory: attempt.errorCategory || null,
      errorCode: attempt.errorCode || null,
      httpStatus: attempt.httpStatus || null
    });
  }

  if (delivery.synchronous === true && delivery.completedResult) {
    let completedResult = delivery.completedResult;
    try {
      completedResult = await executeCodexRepositoryResult({ env, workspaceId, packageId, taskId, result: completedResult, actor });
    } catch (error) {
      const failure = await recordSynchronousOutcome({
        env,
        state: deliveredState(updatedState, taskId, delivery),
        task: { ...task, status: "working", providerStatus: "delivered", dispatchId },
        dispatchRecord,
        delivery,
        result: completedResult,
        actor: { id: agent.id || `${delivery.provider}-direct` }
      });
      return {
        dryRun: false,
        writesPerformed: true,
        dispatch: failure.dispatch,
        state: failure.state,
        result: failure.result,
        repository: failure.repository,
        queuedRepository,
        message: `The provider returned a result, but protected repository execution rejected it: ${error.message}`
      };
    }

    const outcome = await recordSynchronousOutcome({
      env,
      state: deliveredState(updatedState, taskId, delivery),
      task: { ...task, status: "working", providerStatus: "delivered", dispatchId },
      dispatchRecord,
      delivery,
      result: completedResult,
      actor: { id: agent.id || `${delivery.provider}-direct` }
    });
    return {
      dryRun: false,
      writesPerformed: true,
      dispatch: outcome.dispatch,
      state: outcome.state,
      result: outcome.result,
      repository: outcome.repository,
      queuedRepository,
      message: outcome.verificationFailed
        ? `The provider returned a result, but verification rejected it: ${outcome.result.verificationReason}`
        : taskId === "AI-TASK-002"
          ? "Codex produced a repository plan, the protected adapter created a real GitHub pull request, and the evidence was recorded."
          : "The AI task was dispatched, completed, verified, and recorded in one canonical completion transaction."
    };
  }

  const finalState = deliveredState(updatedState, taskId, delivery);
  const deliveredRecord = {
    ...dispatchRecord,
    status: delivery.status,
    delivery,
    executionConfirmed: delivery.delivered === true
  };
  const deliveryRepository = await commitFilesAtomically(env, {
    message: `orchestration: record ${taskId} provider delivery status`,
    files: [
      { path: STATE_PATH, content: finalState },
      { path: taskPath(workspaceId, packageId, taskId), content: deliveredRecord }
    ]
  });
  return {
    dryRun: false,
    writesPerformed: true,
    dispatch: deliveredRecord,
    state: finalState,
    repository: deliveryRepository,
    queuedRepository,
    message: delivery.delivered
      ? "The handoff was recorded and the provider accepted the asynchronous task."
      : "The handoff was recorded, but the provider did not accept the task. The task is blocked and has not started execution."
  };
}

export async function completeTask({ env, workspaceId, packageId, taskId, result, actor }) {
  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  const task = validateScope(state, workspaceId, packageId, taskId);
  if (task.status === "complete") throw new Error("This task is already complete.");
  if (task.status !== "working") throw new Error("Only a dispatched task with confirmed provider delivery can be completed.");
  if (task.providerStatus !== "delivered") throw new Error("The provider has not confirmed delivery for this task.");
  if (!task.dispatchId || result.dispatchId !== task.dispatchId) throw new Error("The result dispatch ID does not match the active task dispatch.");

  const outcome = await recordSynchronousOutcome({
    env,
    state,
    task,
    dispatchRecord: {
      dispatchId: task.dispatchId,
      workspaceId,
      packageId,
      taskId,
      agentId: task.owner,
      status: "delivered"
    },
    delivery: { delivered: true, status: "delivered", completedResult: result },
    result,
    actor
  });
  return {
    state: outcome.state,
    result: outcome.result,
    repository: outcome.repository,
    verificationFailed: outcome.verificationFailed
  };
}

async function readCanonicalStateAsset() {
  const response = await fetch(`${CANONICAL_STATE_URL}?gateway=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Canonical state asset returned ${response.status}.`);
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) throw new Error("Canonical state asset did not return JSON.");
  return response.json();
}

export async function readOrchestrationState({ env, workspaceId, packageId }) {
  let state;
  let source = "github-api";
  try {
    ({ content: state } = await readRepositoryJson(env, STATE_PATH));
  } catch (error) {
    state = await readCanonicalStateAsset();
    source = "github-pages-fallback";
    structuredLog("orchestration.state_fallback", {
      workspaceId,
      packageId,
      source,
      repositoryError: error instanceof Error ? error.message : "Unknown repository read error"
    });
  }
  if (state.workspaceId !== workspaceId || state.packageId !== packageId) throw new Error("No orchestration state exists for this workspace and package.");
  return { ...state, stateSource: source };
}
