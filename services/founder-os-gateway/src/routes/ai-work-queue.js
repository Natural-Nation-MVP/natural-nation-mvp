import { authenticateAgentCallback, authenticateFounder } from "../lib/auth.js";
import {
  claimQueueItem,
  completeRoutineQueueItem,
  createQueueItem,
  decideQueueItem,
  listQueueItems,
  reportQueueProgress,
  requestQueueApproval,
  submitQueueEvidence
} from "../lib/ai-work-queue.js";
import { errorResponse, json } from "../lib/http.js";

function parseQueueRoute(pathname) {
  const root = pathname.match(/^\/v1\/workspaces\/([^/]+)\/ai-work-queue$/);
  if (root) return { workspaceId: decodeURIComponent(root[1]), itemId: null, action: null };
  const item = pathname.match(/^\/v1\/workspaces\/([^/]+)\/ai-work-queue\/([^/]+)\/(claim|progress|evidence|request-approval|complete|decision)$/);
  return item ? {
    workspaceId: decodeURIComponent(item[1]),
    itemId: decodeURIComponent(item[2]),
    action: item[3]
  } : null;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function authenticateQueueActor(request, env, { founderOnly = false } = {}) {
  const founder = authenticateFounder(request, env);
  if (founder.ok) return founder;
  if (founderOnly) return founder;

  const callback = authenticateAgentCallback(request, env);
  if (!callback.ok) return callback;
  const roleId = String(request.headers.get("x-founder-os-agent") || "").trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{1,47}$/.test(roleId) || roleId === "founder") {
    return {
      ok: false,
      status: 403,
      code: "AI_QUEUE_ROLE_REQUIRED",
      message: "A valid workspace AI role is required for queue updates."
    };
  }
  return {
    ok: true,
    actor: {
      ...callback.actor,
      id: roleId,
      role: "workspace-agent",
      permissions: [...callback.actor.permissions, "ai-queue:update"]
    }
  };
}

function summary(items) {
  return {
    active: items.filter((item) => item.status === "active").length,
    ready: items.filter((item) => item.status === "ready").length,
    needsApproval: items.filter((item) => item.status === "needs-approval").length,
    blocked: items.filter((item) => item.status === "blocked").length,
    complete: items.filter((item) => item.status === "complete").length
  };
}

function failure(request, error) {
  const status = Number(error?.status) || (/unavailable/i.test(error?.message || "") ? 503 : 422);
  const code = status === 409 ? "AI_QUEUE_CONFLICT"
    : status === 403 ? "AI_QUEUE_FORBIDDEN"
      : status === 404 ? "AI_QUEUE_ITEM_NOT_FOUND"
        : status === 503 ? "AI_QUEUE_STORE_UNAVAILABLE"
          : "AI_QUEUE_ACTION_REJECTED";
  return errorResponse(request, status, code, error?.message || "The queue action was rejected.");
}

export async function handleAiWorkQueue(request, env, pathname) {
  const route = parseQueueRoute(pathname);
  if (!route) return null;

  if (!route.itemId && request.method === "GET") {
    const url = new URL(request.url);
    const queue = await listQueueItems(env, route.workspaceId, {
      status: String(url.searchParams.get("status") || "").trim(),
      ownerRole: String(url.searchParams.get("ownerRole") || "").trim().toLowerCase()
    });
    return json(request, {
      ok: true,
      readOnly: true,
      workspaceId: route.workspaceId,
      persisted: queue.persisted,
      summary: summary(queue.items),
      items: queue.items
    }, 200, { "cache-control": "no-store" });
  }

  if (!route.itemId && request.method === "POST") {
    const auth = authenticateQueueActor(request, env, { founderOnly: true });
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
    try {
      const result = await createQueueItem(env, route.workspaceId, await readJson(request), auth.actor);
      return json(request, { ok: true, status: "assigned", ...result }, 201);
    } catch (error) {
      return failure(request, error);
    }
  }

  if (request.method !== "POST") {
    return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Queue item actions use POST.");
  }

  const founderOnly = route.action === "decision";
  const auth = authenticateQueueActor(request, env, { founderOnly });
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
  const body = await readJson(request);
  const expectedRevision = Number(body.expectedRevision);

  try {
    const actions = {
      claim: () => claimQueueItem(env, route.workspaceId, route.itemId, auth.actor, expectedRevision),
      progress: () => reportQueueProgress(env, route.workspaceId, route.itemId, auth.actor, expectedRevision, body),
      evidence: () => submitQueueEvidence(env, route.workspaceId, route.itemId, auth.actor, expectedRevision, body),
      "request-approval": () => requestQueueApproval(env, route.workspaceId, route.itemId, auth.actor, expectedRevision),
      complete: () => completeRoutineQueueItem(env, route.workspaceId, route.itemId, auth.actor, expectedRevision),
      decision: () => decideQueueItem(env, route.workspaceId, route.itemId, auth.actor, expectedRevision, body)
    };
    const result = await actions[route.action]();
    return json(request, { ok: true, status: result.item.status, ...result });
  } catch (error) {
    return failure(request, error);
  }
}
