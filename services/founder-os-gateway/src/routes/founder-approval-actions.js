import { authenticateFounder } from "../lib/auth.js";
import { commitFilesAtomically, readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const STATE_PATH = "docs/founder-os/config/ai-orchestration-state.json";
const ALLOWED_ACTIONS = new Set(["defer", "reject", "note"]);

function parseApprovalActionRoute(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/packages\/([^/]+)\/tasks\/([^/]+)\/approval-action$/);
  return match ? {
    workspaceId: decodeURIComponent(match[1]),
    packageId: decodeURIComponent(match[2]),
    taskId: decodeURIComponent(match[3])
  } : null;
}

function resultRecordPath({ workspaceId, packageId, taskId }) {
  return `docs/orchestration/${workspaceId}/${packageId}/${taskId}.approval.json`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function requireNote(action, note) {
  if (["defer", "reject", "note"].includes(action) && !note) {
    throw new Error(`A Founder note is required to ${action.replace("_", " ")} this approval.`);
  }
}

async function recordApprovalAction(env, route, actor, body) {
  const action = String(body.action || "").trim().toLowerCase();
  const note = String(body.note || "").trim();
  if (!ALLOWED_ACTIONS.has(action)) throw new Error("Approval action must be defer, reject, or note.");
  requireNote(action, note);

  const { content: state } = await readRepositoryJson(env, STATE_PATH);
  if (state.workspaceId !== route.workspaceId || state.packageId !== route.packageId) {
    throw new Error("No orchestration state exists for this workspace and package.");
  }

  const task = state.tasks.find((item) => item.id === route.taskId);
  if (!task || task.owner !== "founder") throw new Error("The requested task is not a Founder approval task.");
  if (action !== "note" && !["ready", "blocked", "waiting"].includes(task.status)) {
    throw new Error("This approval is no longer available for a state-changing decision.");
  }

  const now = new Date().toISOString();
  const historyEntry = { action, note, recordedAt: now, recordedBy: actor.id };
  const updatedTask = {
    ...task,
    updatedAt: now,
    founderNotes: [...(Array.isArray(task.founderNotes) ? task.founderNotes : []), historyEntry]
  };

  let nextState = {
    ...state,
    updatedAt: now,
    tasks: state.tasks.map((item) => item.id === route.taskId ? updatedTask : item)
  };

  if (action === "defer") {
    nextState = {
      ...nextState,
      status: "blocked",
      currentOwner: "founder",
      founderApprovalRequired: true,
      tasks: nextState.tasks.map((item) => item.id === route.taskId ? {
        ...item,
        status: "blocked",
        providerStatus: "founder-deferred",
        blockedReason: note
      } : item)
    };
  }

  if (action === "reject") {
    const decisionRecord = {
      resultVersion: "2.2.0",
      workspaceId: route.workspaceId,
      packageId: route.packageId,
      taskId: route.taskId,
      decision: "reject",
      note,
      decidedAt: now,
      decidedBy: actor.id,
      pullRequestUrl: body.pullRequestUrl || null,
      source: "founder-approval-inbox"
    };
    nextState = {
      ...nextState,
      status: "rejected",
      currentOwner: "founder",
      nextOwner: null,
      founderApprovalRequired: false,
      finalDecision: decisionRecord,
      tasks: nextState.tasks.map((item) => item.id === route.taskId ? {
        ...item,
        status: "complete",
        providerStatus: "founder-rejected",
        blockedReason: note,
        completedAt: now,
        completedBy: actor.id,
        resultSummary: note
      } : item)
    };
  }

  const record = {
    version: "1.0.0",
    ...historyEntry,
    workspaceId: route.workspaceId,
    packageId: route.packageId,
    taskId: route.taskId,
    pullRequestUrl: body.pullRequestUrl || null
  };

  const repository = await commitFilesAtomically(env, {
    message: `founder: ${action.replace("_", " ")} ${route.taskId}`,
    files: [
      { path: STATE_PATH, content: nextState },
      { path: resultRecordPath(route), content: record }
    ]
  });

  return { state: nextState, action: record, repository };
}

export async function handleFounderApprovalActions(request, env, pathname) {
  const route = parseApprovalActionRoute(pathname);
  if (!route) return null;
  if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to record a Founder approval action.");

  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);

  const body = await readJson(request);
  try {
    const recorded = await recordApprovalAction(env, route, auth.actor, body);
    return json(request, { ok: true, status: body.action === "note" ? "note-recorded" : `founder-${body.action}`, ...recorded });
  } catch (error) {
    return errorResponse(request, 409, "FOUNDER_APPROVAL_ACTION_REJECTED", error.message || "The Founder approval action could not be recorded.");
  }
}
