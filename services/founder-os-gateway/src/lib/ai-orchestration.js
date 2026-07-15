import { commitFilesAtomically, readRepositoryJson } from "./github.js";

const STATE_PATH = "docs/founder-os/config/ai-orchestration-state.json";
const AGENT_PATH = "docs/founder-os/config/ai-agent-registry.json";

function taskPath(workspaceId, packageId, taskId) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.json`;
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

function nextState(state, task, actor) {
  const now = new Date().toISOString();
  return {
    ...state,
    status: "in-progress",
    currentOwner: task.owner,
    nextOwner: task.nextRole,
    updatedAt: now,
    tasks: state.tasks.map((item) => item.id === task.id ? {
      ...item,
      status: "working",
      startedAt: item.startedAt || now,
      startedBy: actor.id
    } : item)
  };
}

export async function dispatchTask({ env, workspaceId, packageId, taskId, actor, dryRun = false }) {
  const [{ content: state }, { content: registry }] = await Promise.all([
    readRepositoryJson(env, STATE_PATH),
    readRepositoryJson(env, AGENT_PATH)
  ]);

  const task = validateScope(state, workspaceId, packageId, taskId);
  const agent = registry.agents.find((item) => item.id === task.owner);
  if (!agent) throw new Error("The assigned AI role is not registered.");
  if (task.status === "complete") throw new Error("This task is already complete.");

  const updatedState = nextState(state, task, actor);
  const dispatchRecord = {
    dispatchVersion: "1.0.0",
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
    provider: agent.provider || "not-configured"
  };

  if (dryRun) {
    return { dryRun: true, writesPerformed: false, dispatch: dispatchRecord, state: updatedState };
  }

  const repository = await commitFilesAtomically(env, {
    message: `dispatch: ${taskId} to ${agent.name}`,
    files: [
      { path: STATE_PATH, content: updatedState },
      { path: taskPath(workspaceId, packageId, taskId), content: dispatchRecord }
    ]
  });

  return { dryRun: false, writesPerformed: true, dispatch: dispatchRecord, state: updatedState, repository };
}

export async function readOrchestrationState({ env, workspaceId, packageId }) {
  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== workspaceId || state.packageId !== packageId) {
    throw new Error("No orchestration state exists for this workspace and package.");
  }
  return state;
}
