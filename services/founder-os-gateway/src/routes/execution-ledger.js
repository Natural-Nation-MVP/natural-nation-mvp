import { authenticateFounder } from "../lib/auth.js";
import { readExecutionLedger } from "../lib/execution-ledger.js";
import { errorResponse, json } from "../lib/http.js";

function routeIdentity(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/execution-ledger$/);
  return match ? { workspaceId: decodeURIComponent(match[1]) } : null;
}

function summarize(records) {
  return {
    total: records.length,
    runs: records.filter((record) => record.type === "governed-run").length,
    approvals: records.filter((record) => record.type === "founder-decision").length,
    repositoryActions: records.filter((record) => record.type === "repository-action").length,
    recordedCost: Number(records.reduce((total, record) => total + Number(record.cost?.amount || 0), 0).toFixed(2)),
    currency: "USD"
  };
}

export async function handleExecutionLedger(request, env, pathname) {
  const route = routeIdentity(pathname);
  if (!route) return null;
  if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "The execution ledger is read-only.");
  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);

  const ledger = await readExecutionLedger(env, route.workspaceId);
  const url = new URL(request.url);
  const type = String(url.searchParams.get("type") || "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 500);
  const scoped = ledger.records.filter((record) => record.workspaceId === route.workspaceId);
  const records = (type ? scoped.filter((record) => record.type === type) : scoped).slice(0, limit);
  return json(request, {
    ok: true,
    readOnly: true,
    persisted: ledger.persisted,
    workspaceId: route.workspaceId,
    summary: summarize(records),
    records
  }, 200, { "cache-control": "no-store" });
}
