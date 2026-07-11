import { executeApprovalTransaction } from "../lib/approval-transaction.js";
import { authenticateFounder } from "../lib/auth.js";
import { validateApprovalRequest } from "../lib/blueprint-validation.js";
import { errorResponse, json } from "../lib/http.js";

function parseRoute(pathname) {
  const match = pathname.match(/^\/v2\/workspaces\/([^/]+)\/blueprints\/([^/]+)\/approve$/);
  if (!match) return null;

  return {
    workspaceId: decodeURIComponent(match[1]),
    blueprintVersion: decodeURIComponent(match[2])
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function handleApproveBlueprint(request, env, pathname) {
  const routeParams = parseRoute(pathname);
  if (!routeParams) return null;

  if (request.method !== "POST") {
    return errorResponse(
      request,
      405,
      "METHOD_NOT_ALLOWED",
      "Use POST for Blueprint approval.",
      { allowedMethods: ["POST"] }
    );
  }

  const auth = authenticateFounder(request, env);
  if (!auth.ok) {
    return errorResponse(request, auth.status, auth.code, auth.message);
  }

  const body = await readJson(request);
  const blockers = validateApprovalRequest(body, routeParams);

  if (blockers.length > 0) {
    return json(
      request,
      {
        ok: false,
        status: "blocked",
        workspaceId: routeParams.workspaceId,
        blueprintVersion: routeParams.blueprintVersion,
        blockers
      },
      422
    );
  }

  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) {
    return json(
      request,
      {
        ok: false,
        status: "blocked",
        workspaceId: routeParams.workspaceId,
        blueprintVersion: routeParams.blueprintVersion,
        blockers: [
          {
            code: "CANONICAL_REPOSITORY_NOT_CONFIGURED",
            message: "Canonical GitHub write credentials are not configured on the Gateway."
          }
        ],
        validated: true,
        actor: auth.actor,
        clientRequestId: body.clientRequestId
      },
      503
    );
  }

  try {
    const result = await executeApprovalTransaction({
      env,
      body,
      actor: auth.actor
    });

    if (result.duplicate) {
      return json(request, {
        ok: true,
        status: "committed",
        duplicate: true,
        transaction: result.transaction
      });
    }

    return json(request, {
      ok: true,
      transactionId: result.transaction.transactionId,
      status: "committed",
      workspace: {
        id: body.workspaceId,
        stage: "Build Ready",
        nextAction: "Open Build Studio"
      },
      blueprint: {
        version: body.blueprintVersion,
        status: "Approved",
        locked: true
      },
      executionPackage: {
        id: "NN-BUILD-001",
        status: "ready",
        assignedTo: "Codex"
      },
      repository: result.transaction.repository
    });
  } catch (error) {
    console.error("Blueprint approval transaction failed", error);

    const conflict = /already approved|already.*locked/i.test(error.message || "");
    return errorResponse(
      request,
      conflict ? 409 : 502,
      conflict ? "BLUEPRINT_CONFLICT" : "CANONICAL_COMMIT_FAILED",
      error.message || "The canonical Blueprint approval transaction failed.",
      error.details
    );
  }
}
