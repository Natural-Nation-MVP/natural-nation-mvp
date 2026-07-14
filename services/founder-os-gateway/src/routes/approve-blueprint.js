import {
  dryRunApprovalTransaction,
  executeApprovalTransaction
} from "../lib/approval-transaction.js";
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

function committedResponse(body, transaction, duplicate = false) {
  return {
    ok: true,
    transactionId: transaction.transactionId,
    status: "committed",
    duplicate,
    transaction,
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
      id: transaction.executionPackageId || "NN-BUILD-001",
      status: "ready",
      assignedTo: "Codex"
    },
    repository: transaction.repository
  };
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
    if (body.dryRun === true) {
      const result = await dryRunApprovalTransaction({
        env,
        body,
        actor: auth.actor
      });

      if (result.duplicate) {
        return json(request, {
          ...committedResponse(body, result.transaction, true),
          dryRun: true,
          writesPerformed: false,
          status: "already-committed"
        });
      }

      return json(request, {
        ok: true,
        status: "dry-run-passed",
        dryRun: true,
        writesPerformed: false,
        duplicate: false,
        transaction: result.transaction,
        verification: result.verification,
        plannedWrites: result.plannedWrites || []
      });
    }

    const result = await executeApprovalTransaction({
      env,
      body,
      actor: auth.actor
    });

    return json(request, committedResponse(body, result.transaction, result.duplicate));
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
