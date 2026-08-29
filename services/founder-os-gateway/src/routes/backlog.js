import { readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const BACKLOG_PATH = "docs/founder-os/registry/natural-nation-backlog.json";

function summarize(items) {
  const count = (status) => items.filter((item) => item.status === status).length;
  return {
    total: items.length,
    ready: count("ready"),
    inProgress: count("in-progress"),
    needsReconciliation: count("needs-reconciliation"),
    founderDecisions: count("awaiting-founder"),
    planned: count("planned"),
    blocked: count("blocked")
  };
}

export function buildBacklog(registry) {
  const items = [...(registry.items || [])].sort((left, right) => left.order - right.order).map((item) => ({
    backlogId: item.backlogId, issueNumber: item.issueNumber, issueUrl: item.issueUrl,
    title: item.title, status: item.status, ownerRole: item.ownerRole,
    supportingRoles: item.supportingRoles || [], approvalClass: item.approvalClass,
    release: item.release, nextAction: item.nextAction, evidenceRefs: item.evidenceRefs
  }));
  return {
    ok: true, readOnly: true, live: true, workspaceId: registry.workspaceId,
    workspaceNumber: registry.workspaceNumber, generatedAt: new Date().toISOString(),
    updatedAt: registry.updatedAt, releaseTarget: registry.releaseTarget,
    sourceBlueprint: registry.sourceBlueprint, sourcePackage: registry.sourcePackage,
    summary: summarize(items), items
  };
}

export async function handleBacklog(request, env, pathname) {
  if (pathname !== "/v1/public/workspaces/natural-nation/backlog") return null;
  if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "The Natural Nation backlog is read-only.");
  const { content } = await readRepositoryJson(env, BACKLOG_PATH);
  if (content.workspaceId !== "natural-nation" || Number(content.workspaceNumber) !== 1) {
    return errorResponse(request, 409, "BACKLOG_SCOPE_INVALID", "The backlog registry is not scoped to Natural Nation Workspace #1.");
  }
  return json(request, buildBacklog(content), 200, { "cache-control": "no-store" });
}
