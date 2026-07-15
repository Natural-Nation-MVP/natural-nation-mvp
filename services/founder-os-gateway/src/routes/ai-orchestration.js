import { authenticateFounder } from "../lib/auth.js";
import { dispatchTask, readOrchestrationState } from "../lib/ai-orchestration.js";
import { errorResponse, json } from "../lib/http.js";

function parseStateRoute(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/packages\/([^/]+)\/orchestration$/);
  return match ? { workspaceId: decodeURIComponent(match[1]), packageId: decodeURIComponent(match[2]) } : null;
}

function parseDispatchRoute(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/packages\/([^/]+)\/tasks\/([^/]+)\/dispatch$/);
  return match ? {
    workspaceId: decodeURIComponent(match[1]),
    packageId: decodeURIComponent(match[2]),
    taskId: decodeURIComponent(match[3])
  } : null;
}

async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

export async function handleAiOrchestration(request, env, pathname) {
  const stateRoute = parseStateRoute(pathname);
  const dispatchRoute = parseDispatchRoute(pathname);
  if (!stateRoute && !dispatchRoute) return null;

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

  if (request.method !== "POST") {
    return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to start AI work.");
  }

  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);

  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) {
    return errorResponse(request, 503, "CANONICAL_REPOSITORY_NOT_CONFIGURED", "The repository connection is not configured.");
  }

  const body = await readJson(request);
  try {
    const result = await dispatchTask({
      env,
      ...dispatchRoute,
      actor: auth.actor,
      dryRun: body.dryRun === true
    });
    return json(request, {
      ok: true,
      status: result.dryRun ? "dry-run-passed" : "queued",
      ...result
    });
  } catch (error) {
    const conflict = /already complete/i.test(error.message || "");
    return errorResponse(
      request,
      conflict ? 409 : 422,
      conflict ? "TASK_ALREADY_COMPLETE" : "AI_DISPATCH_BLOCKED",
      error.message || "The AI task could not be started."
    );
  }
}
