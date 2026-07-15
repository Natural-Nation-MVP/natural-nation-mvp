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
  if (state.workspaceId !== workspaceId || state.packageId !== packageId) throw new Error("This task does not belong to the requested workspace and package.");
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("The requested AI task does not exist.");
  if (task.workspaceId !== workspaceId || task.packageId !== packageId) throw new Error("The task scope is invalid.");
  return task;
}

function nextState(state, task, actor) {
  const now = new Date().toISOString();
  return {
    ...state,
    status: "in-progress",
    currentOwner: task.owner,
    nextOwner: task.nextRole,
    updatedAt: now,
    tasks: state.tasks.map((item) => item.id === task.id ? { ...item, status: "working", startedAt: item.startedAt || now, startedBy: actor.id } : item)
  };
}

export async function dispatchTask({ env, workspaceId, packageId, taskId, actor, dryRun = false }) {
  const [{ content: state }, { content: registry }] = await Promise.all([readRepositoryJson(env, STATE_PATH), readRepositoryJson(env, AGENT_PATH)]);
  const task = validateScope(state, workspaceId, packageId, taskId);
  const agent = registry.agents.find((item) => item.id === task.owner);
  if (!agent) throw new Error("The assigned AI role is not registered.");
  if (task.status === "complete") throw new Error("This task is already complete.");

  const updatedState = nextState(state, task, actor);
  const dispatchRecord = {
    dispatchVersion: "1.1.0",
    dispatchId: `AI-DISPATCH-${crypto.randomUUID().toUpperCase()}`,
    workspaceId,
    packageId,
    taskId,
    agentId: agent.id,
    status: dryRun ? "validated" : "queued",
    requestedBy: actor.id,
    requestedAt: new Date().toISOString(),
    requiredInput: task.requiredInput,
    expectedOutput: task.expectedOutput,
    nextRole: task.nextRole,
    provider: agent.provider || "manual"
  };

  if (dryRun) return { dryRun: true, writesPerformed: false, dispatch: dispatchRecord, state: updatedState };

  const queuedRepository = await commitFilesAtomically(env, {
    message: `dispatch: ${taskId} to ${agent.name}`,
    files: [{ path: STATE_PATH, content: updatedState }, { path: taskPath(workspaceId, packageId, taskId), content: dispatchRecord }]
  });

  const delivery = await deliverToProvider({ env, agent, dispatch: dispatchRecord });
  const deliveredRecord = { ...dispatchRecord, status: delivery.status, delivery };
  const deliveryState = {
    ...updatedState,
    updatedAt: new Date().toISOString(),
    tasks: updatedState.tasks.map((item) => item.id === taskId ? { ...item, providerStatus: delivery.status } : item)
  };
  const deliveryRepository = await commitFilesAtomically(env, {
    message: `orchestration: record ${taskId} provider delivery`,
    files: [{ path: STATE_PATH, content: deliveryState }, { path: taskPath(workspaceId, packageId, taskId), content: deliveredRecord }]
  });

  return { dryRun: false, writesPerformed: true, dispatch: deliveredRecord, state: deliveryState, repository: deliveryRepository, queuedRepository };
}

export async function completeTask({ env, workspaceId, packageId, taskId, result, actor }) {
  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  const task = validateScope(state, workspaceId, packageId, taskId);
  if (task.status === "complete") throw new Error("This task is already complete.");
  const now = new Date().toISOString();
  const nextTask = state.tasks.find((item) => item.owner === task.nextRole && item.status === "waiting");
  const completedState = {
    ...state,
    status: nextTask ? "in-progress" : "complete",
    currentOwner: nextTask?.owner || task.nextRole || "founder",
    nextOwner: nextTask?.nextRole || null,
    updatedAt: now,
    tasks: state.tasks.map((item) => {
      if (item.id === taskId) return { ...item, status: "complete", completedAt: now, completedBy: actor.id, resultSummary: result.summary || "Completed" };
      if (nextTask && item.id === nextTask.id) return { ...item, status: "ready" };
      return item;
    })
  };
  const resultRecord = { resultVersion: "1.0.0", workspaceId, packageId, taskId, receivedAt: now, receivedBy: actor.id, ...result };
  const repository = await commitFilesAtomically(env, {
    message: `orchestration: complete ${taskId}`,
    files: [{ path: STATE_PATH, content: completedState }, { path: resultPath(workspaceId, packageId, taskId), content: resultRecord }]
  });
  return { state: completedState, result: resultRecord, repository };
}

export async function readOrchestrationState({ env, workspaceId, packageId }) {
  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== workspaceId || state.packageId !== packageId) throw new Error("No orchestration state exists for this workspace and package.");
  return state;
}
