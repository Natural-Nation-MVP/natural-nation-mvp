import { authenticateFounder } from "../lib/auth.js";
import { commitFilesAtomically, readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const REGISTRY_PATH = "docs/founder-os/registry/workspaces.json";
const AUDIT_ROOT = "docs/founder-os/registry/lifecycle-audit";
const WORKSPACE_ZERO = "founder-os";
const PROTECTED_WORKSPACES = new Set(["founder-os", "natural-nation"]);
const ACTIONS = new Set(["archive", "restore", "delete", "purge-check", "purge"]);

function text(value, maximum = 1000) {
  return String(value || "").trim().slice(0, maximum);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function routeIdentity(pathname) {
  const match = pathname.match(/^\/v2\/workspaces\/([^/]+)\/lifecycle$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function requireFounderScope(request, body) {
  if (request.headers.get("x-founder-os-workspace") !== WORKSPACE_ZERO || body?.sourceWorkspaceId !== WORKSPACE_ZERO) {
    return { code: "WORKSPACE_LIFECYCLE_SCOPE_FORBIDDEN", message: "Workspace lifecycle actions are available only from Founder OS." };
  }
  return null;
}

function requireConfirmation(body, workspaceId, action) {
  const confirmation = body?.confirmation;
  if (confirmation?.approved !== true || confirmation?.effectAcknowledged !== true || confirmation?.workspaceId !== workspaceId) {
    return { code: "FOUNDER_CONFIRMATION_REQUIRED", message: "Explicit Founder confirmation bound to the immutable workspace ID is required." };
  }
  if (action === "purge" && confirmation?.permanentPurgeApproved !== true) {
    return { code: "PERMANENT_PURGE_CONFIRMATION_REQUIRED", message: "Permanent purge requires a separate explicit Founder approval." };
  }
  return null;
}

function lifecycleState(workspace) {
  return workspace.lifecycleStatus || workspace.status || "created";
}

function transition(workspace, action, now, reason) {
  const priorState = lifecycleState(workspace);
  const priorOperationalStatus = workspace.status || "foundation";
  const history = Array.isArray(workspace.lifecycleHistory) ? workspace.lifecycleHistory : [];
  let next = { ...workspace };

  if (action === "archive") {
    if (priorState === "archived") throw new Error("Workspace is already archived.");
    if (priorState === "soft-deleted") throw new Error("Restore the workspace before archiving it.");
    next = { ...next, status: "archived", lifecycleStatus: "archived", archivedAt: now };
  } else if (action === "restore") {
    if (!["archived", "soft-deleted"].includes(priorState)) throw new Error("Only archived or soft-deleted workspaces can be restored.");
    const restoredStatus = workspace.lifecycle?.previousOperationalStatus || "foundation";
    next = { ...next, status: restoredStatus, lifecycleStatus: "created", restoredAt: now };
    delete next.deletedAt;
    delete next.archivedAt;
  } else if (action === "delete") {
    if (priorState === "soft-deleted") throw new Error("Workspace is already soft-deleted.");
    next = { ...next, status: "deleted", lifecycleStatus: "soft-deleted", deletedAt: now };
  }

  const event = {
    action,
    actor: "founder",
    reason,
    priorState,
    resultingState: lifecycleState(next),
    occurredAt: now
  };
  next.lifecycle = {
    ...(workspace.lifecycle || {}),
    previousOperationalStatus: ["archived", "deleted"].includes(priorOperationalStatus)
      ? workspace.lifecycle?.previousOperationalStatus || "foundation"
      : priorOperationalStatus,
    lastAction: action,
    lastActionAt: now,
    lastActionBy: "founder",
    lastReason: reason
  };
  next.lifecycleHistory = [...history, event];
  next.updatedAt = now;
  return { next, event };
}

function purgeEligibility(workspace) {
  const state = lifecycleState(workspace);
  const eligible = state === "soft-deleted";
  return {
    eligible,
    workspaceId: workspace.workspaceId,
    state,
    blockers: eligible ? [] : [{ code: "WORKSPACE_NOT_SOFT_DELETED", message: "A workspace must be soft-deleted before permanent purge." }],
    repositoryRoot: workspace.repository?.root || null
  };
}

export async function handleWorkspaceLifecycle(request, env, pathname) {
  const workspaceId = routeIdentity(pathname);
  if (!workspaceId) return null;
  if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST for workspace lifecycle actions.", { allowedMethods: ["POST"] });

  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
  const body = await readJson(request);
  const action = text(body?.action, 40);
  if (!ACTIONS.has(action)) return errorResponse(request, 422, "INVALID_LIFECYCLE_ACTION", "Choose archive, restore, delete, purge-check, or purge.");
  const scopeBlocker = requireFounderScope(request, body);
  if (scopeBlocker) return errorResponse(request, 403, scopeBlocker.code, scopeBlocker.message);
  if (PROTECTED_WORKSPACES.has(workspaceId)) return errorResponse(request, 403, "PROTECTED_WORKSPACE", "This protected workspace cannot be archived, deleted, or purged.");

  const { content: registry } = await readRepositoryJson(env, REGISTRY_PATH);
  const workspaces = Array.isArray(registry.workspaces) ? registry.workspaces : [];
  const index = workspaces.findIndex((workspace) => workspace.workspaceId === workspaceId);
  if (index < 0) return errorResponse(request, 404, "WORKSPACE_NOT_FOUND", "No workspace exists for the supplied immutable workspace ID.");
  const workspace = workspaces[index];

  if (action === "purge-check") return json(request, { ok: true, action, ...purgeEligibility(workspace) });

  const confirmationBlocker = requireConfirmation(body, workspaceId, action);
  if (confirmationBlocker) return errorResponse(request, 422, confirmationBlocker.code, confirmationBlocker.message);
  const reason = text(body?.reason, 1000);
  if (reason.length < 5) return errorResponse(request, 422, "LIFECYCLE_REASON_REQUIRED", "Provide a short reason for the workspace lifecycle action.");

  const now = new Date().toISOString();
  if (action === "purge") {
    const eligibility = purgeEligibility(workspace);
    if (!eligibility.eligible) return json(request, { ok: false, action, ...eligibility }, 409);
    const event = { action, actor: "founder", reason, priorState: lifecycleState(workspace), resultingState: "purged", occurredAt: now };
    const nextRegistry = { ...registry, updatedAt: now, workspaces: workspaces.filter((item) => item.workspaceId !== workspaceId) };
    const tombstone = {
      schemaVersion: "1.0.0",
      workspaceId,
      workspaceKey: workspace.workspaceKey,
      displayName: workspace.displayName,
      repositoryRoot: workspace.repository?.root || null,
      purgedFromActiveRegistry: true,
      repositoryContentDisposition: "retained-as-audit-preservation",
      event
    };
    const commit = await commitFilesAtomically(env, {
      message: `chore(founder-os): purge workspace registry record ${workspaceId}`,
      files: [
        { path: REGISTRY_PATH, content: nextRegistry },
        { path: `${AUDIT_ROOT}/${workspaceId}-${Date.now()}.json`, content: tombstone }
      ]
    });
    return json(request, { ok: true, action, workspaceId, resultingState: "purged", repositoryContentDisposition: tombstone.repositoryContentDisposition, commit });
  }

  let result;
  try {
    result = transition(workspace, action, now, reason);
  } catch (error) {
    return errorResponse(request, 409, "INVALID_LIFECYCLE_TRANSITION", error.message);
  }
  const nextWorkspaces = [...workspaces];
  nextWorkspaces[index] = result.next;
  const nextRegistry = { ...registry, updatedAt: now, workspaces: nextWorkspaces };
  const audit = { schemaVersion: "1.0.0", workspaceId, workspaceKey: workspace.workspaceKey, event: result.event };
  const commit = await commitFilesAtomically(env, {
    message: `chore(founder-os): ${action} workspace ${workspaceId}`,
    files: [
      { path: REGISTRY_PATH, content: nextRegistry },
      { path: `${AUDIT_ROOT}/${workspaceId}-${Date.now()}.json`, content: audit }
    ]
  });
  return json(request, { ok: true, action, workspace: result.next, audit: result.event, commit });
}
