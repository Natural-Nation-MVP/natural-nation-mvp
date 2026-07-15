import { commitFilesAtomically, readRepositoryJson } from "./github.js";
import { deliverToProvider } from "./ai-provider-adapters.js";

const STATE_PATH = "docs/founder-os/config/ai-orchestration-state.json";
const AGENT_PATH = "docs/founder-os/config/ai-agent-registry.json";

function taskPath(workspaceId, packageId, taskId) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.json`;
}

function resultPath(workspaceId, packageId, taskId) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.result.json`;
}

function validateScope(state, workspaceId, packageId, taskId) {
  if (state.workspaceId !== workspaceId || state.packageId !== packageId) {
    throw new Error("This task does not belong to the requested workspace and package.");
  }
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("The requested AI task does not exist.");
  if (task.workspaceId !== workspaceId || task.packageId !== packageId) {
    throw new Error("The task scope is invalid.");
  }
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
      providerStatus: "dispatching"
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
  const updatedState = queuedState(state, task, actor, dispatchId);
  const dispatchRecord = {
    dispatchVersion: "1.2.0",
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
      ? "The handoff was recorded and the provider accepted the task. Execution is not complete until a verified result is received."
      : "The handoff was recorded, but the provider did not accept the task. The task is blocked and has not started execution."
  };
}

export async function completeTask({ env, workspaceId, packageId, taskId, result, actor }) {
  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  const task = validateScope(state, workspaceId, packageId, taskId);
  if (task.status === "complete") throw new Error("This task is already complete.");
  if (task.status !== "working") throw new Error("Only a dispatched task with confirmed provider delivery can be completed.");
  if (task.providerStatus !== "delivered") throw new Error("The provider has not confirmed delivery for this task.");
  if (!task.dispatchId || result.dispatchId !== task.dispatchId) {
    throw new Error("The result dispatch ID does not match the active task dispatch.");
  }

  const now = new Date().toISOString();
  const nextTask = state.tasks.find((item) => item.owner === task.nextRole && item.status === "waiting");
  const completedState = {
    ...state,
    status: nextTask ? "ready" : "complete",
    currentOwner: nextTask?.owner || task.nextRole || "founder",
    nextOwner: nextTask?.nextRole || null,
    updatedAt: now,
    tasks: state.tasks.map((item) => {
      if (item.id === taskId) {
        return {
          ...item,
          status: "complete",
          providerStatus: "result-verified",
          completedAt: now,
          completedBy: actor.id,
          resultSummary: result.summary
        };
      }
      if (nextTask && item.id === nextTask.id) return { ...item, status: "ready" };
      return item;
    })
  };

  const resultRecord = {
    resultVersion: "1.1.0",
    workspaceId,
    packageId,
    taskId,
    dispatchId: result.dispatchId,
    receivedAt: now,
    receivedBy: actor.id,
    ...result
  };

  const repository = await commitFilesAtomically(env, {
    message: `orchestration: verify and complete ${taskId}`,
    files: [
      { path: STATE_PATH, content: completedState },
      { path: resultPath(workspaceId, packageId, taskId), content: resultRecord }
    ]
  });

  return { state: completedState, result: resultRecord, repository };
}

export async function readOrchestrationState({ env, workspaceId, packageId }) {
  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== workspaceId || state.packageId !== packageId) {
    throw new Error("No orchestration state exists for this workspace and package.");
  }
  return state;
}
