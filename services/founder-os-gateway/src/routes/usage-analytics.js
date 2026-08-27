import { authenticateFounder } from "../lib/auth.js";
import { readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const USAGE_PATH = "docs/founder-os/registry/usage-records.json";
const EVIDENCE_PATH = "docs/founder-os/registry/evidence-records.json";

function routeIdentity(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/usage-analytics$/);
  return match ? { workspaceId: decodeURIComponent(match[1]) } : null;
}

function group(records, key, value) {
  const totals = new Map();
  for (const record of records) {
    const label = key(record) || "Unrecorded";
    const current = totals.get(label) || { label, requests: 0, tokens: 0, cachedTokens: 0, retries: 0 };
    const next = value(record);
    current.requests += next.requests;
    current.tokens += next.tokens;
    current.cachedTokens += next.cachedTokens;
    current.retries += next.retries;
    totals.set(label, current);
  }
  return [...totals.values()].sort((left, right) => right.tokens - left.tokens || right.requests - left.requests);
}

export function summarizeUsage(records = [], evidence = []) {
  const value = (record) => ({
    requests: Number(record.requests || 0),
    tokens: Number(record.tokens?.total || 0),
    cachedTokens: Number(record.tokens?.cached || 0),
    retries: Number(record.optimization?.retryCount || 0)
  });
  const totals = records.reduce((summary, record) => {
    const next = value(record);
    summary.requests += next.requests;
    summary.tokens += next.tokens;
    summary.cachedTokens += next.cachedTokens;
    summary.retries += next.retries;
    summary.fallbacks += record.optimization?.fallbackUsed ? 1 : 0;
    return summary;
  }, { requests: 0, tokens: 0, cachedTokens: 0, retries: 0, fallbacks: 0 });
  const recordedCost = evidence.reduce((total, record) => total + Number(record.cost?.amount || 0), 0) +
    records.reduce((total, record) => total + Number(record.cost?.status === "recorded" ? record.cost.amount || 0 : 0), 0);
  const byProvider = group(records, (record) => record.provider, value);
  const highest = byProvider[0] || null;
  return {
    ...totals,
    recordedCost: Number(recordedCost.toFixed(2)),
    currency: "USD",
    cacheRate: totals.tokens ? Number(((totals.cachedTokens / totals.tokens) * 100).toFixed(1)) : 0,
    highestUsage: highest,
    byProvider,
    byModel: group(records, (record) => record.model, value),
    byRole: group(records, (record) => record.roleId, value),
    byWorkspace: group(records, (record) => record.workspaceId, value)
  };
}

export async function handleUsageAnalytics(request, env, pathname) {
  const route = routeIdentity(pathname);
  if (!route) return null;
  if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Usage analytics are read-only.");
  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);

  const [{ content: registry }, { content: evidenceRegistry }] = await Promise.all([
    readRepositoryJson(env, USAGE_PATH),
    readRepositoryJson(env, EVIDENCE_PATH)
  ]);
  const portfolio = route.workspaceId === "founder-os";
  const records = (Array.isArray(registry.records) ? registry.records : [])
    .filter((record) => portfolio || record.workspaceId === route.workspaceId);
  const evidence = (Array.isArray(evidenceRegistry.records) ? evidenceRegistry.records : [])
    .filter((record) => portfolio || record.workspaceId === route.workspaceId);

  return json(request, {
    ok: true,
    workspaceId: route.workspaceId,
    scope: portfolio ? "portfolio" : "workspace",
    readOnly: true,
    policyRef: registry.policyRef,
    historicalCoverage: registry.historicalCoverage,
    summary: summarizeUsage(records, evidence),
    records
  });
}
