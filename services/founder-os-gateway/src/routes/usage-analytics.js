import { authenticateFounder } from "../lib/auth.js";
import { readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const USAGE_PATH = "docs/founder-os/registry/usage-records.json";
const EVIDENCE_PATH = "docs/founder-os/registry/evidence-records.json";
const ORCHESTRATION_PATH = "docs/founder-os/config/ai-orchestration-state.json";
const AGENT_REGISTRY_PATH = "docs/founder-os/config/ai-agent-registry.json";
const ACTIVE_STATUSES = new Set(["working", "dispatching", "running", "delivered"]);

function routeIdentity(pathname) {
  const protectedMatch = pathname.match(/^\/v1\/workspaces\/([^/]+)\/usage-analytics$/);
  if (protectedMatch) return { workspaceId: decodeURIComponent(protectedMatch[1]), public: false };
  if (pathname === "/v1/public/usage-analytics") return { workspaceId: null, public: true };
  return null;
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

function costByProvider(records, evidence) {
  const totals = new Map();
  for (const record of evidence) {
    const label = record.provider?.name || "Unrecorded";
    totals.set(label, (totals.get(label) || 0) + Number(record.cost?.amount || 0));
  }
  for (const record of records) {
    if (record.cost?.status !== "recorded") continue;
    const label = record.provider || "Unrecorded";
    totals.set(label, (totals.get(label) || 0) + Number(record.cost?.amount || 0));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }))
    .sort((left, right) => right.value - left.value);
}

function historyByDay(records, evidence) {
  const days = new Map();
  const day = (occurredAt) => String(occurredAt || "").slice(0, 10) || "Unknown";
  const get = (date) => days.get(date) || { date, requests: 0, tokens: 0, cachedTokens: 0, retries: 0, cost: 0, activities: 0 };
  for (const record of records) {
    const date = day(record.occurredAt);
    const bucket = get(date);
    bucket.requests += Number(record.requests || 0);
    bucket.tokens += Number(record.tokens?.total || 0);
    bucket.cachedTokens += Number(record.tokens?.cached || 0);
    bucket.retries += Number(record.optimization?.retryCount || 0);
    bucket.cost += Number(record.cost?.status === "recorded" ? record.cost.amount || 0 : 0);
    bucket.activities += 1;
    days.set(date, bucket);
  }
  for (const record of evidence) {
    const date = day(record.occurredAt);
    const bucket = get(date);
    bucket.cost += Number(record.cost?.amount || 0);
    bucket.activities += 1;
    days.set(date, bucket);
  }
  return [...days.values()].sort((left, right) => left.date.localeCompare(right.date))
    .map((bucket) => ({ ...bucket, cost: Number(bucket.cost.toFixed(2)) }));
}

function activityMix(records, evidence) {
  const totals = new Map();
  for (const record of records) {
    const label = record.source || "provider-call";
    totals.set(label, (totals.get(label) || 0) + 1);
  }
  for (const record of evidence) {
    const label = record.eventType || "evidence";
    totals.set(label, (totals.get(label) || 0) + 1);
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value);
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

export function activeUsage(state, workspaceId, now = new Date(), agentRegistry = {}) {
  if (!state || !Array.isArray(state.tasks)) return [];
  const portfolio = workspaceId === "founder-os";
  const roles = [...(Array.isArray(agentRegistry.agents) ? agentRegistry.agents : []), ...(Array.isArray(state.teamPlan?.roles) ? state.teamPlan.roles : [])];
  const providerFor = (roleId) => roles.find((role) => role.id === roleId)?.provider || "unrecorded";
  return state.tasks.filter((task) => {
    const active = ACTIVE_STATUSES.has(String(task.status || "").toLowerCase()) || ACTIVE_STATUSES.has(String(task.providerStatus || "").toLowerCase());
    return active && (portfolio || task.workspaceId === workspaceId);
  }).map((task) => {
    const started = Date.parse(task.startedAt || "");
    return {
      workspaceId: task.workspaceId,
      packageId: task.packageId,
      taskId: task.id,
      title: task.title,
      role: task.owner,
      provider: task.executionProviderOverride || providerFor(task.owner),
      status: task.providerStatus || task.status,
      startedAt: task.startedAt || null,
      elapsedSeconds: Number.isFinite(started) ? Math.max(0, Math.round((now.getTime() - started) / 1000)) : null,
      telemetryStatus: "records-on-completion"
    };
  });
}

export function detectUsageAlerts(summary, history, active) {
  const alerts = [];
  const retryRate = summary.requests ? summary.retries / summary.requests : 0;
  if (summary.requests >= 3 && retryRate > 0.1) alerts.push({ severity: "high", code: "RETRY_RATE", title: "Retry rate is high", message: `${Math.round(retryRate * 100)}% of requests required another provider attempt.`, recommendedAction: "Inspect provider failures and validation errors before the next run." });
  if (summary.tokens >= 1000 && summary.requests >= 3 && summary.cacheRate < 10) alerts.push({ severity: "medium", code: "LOW_CACHE_REUSE", title: "Stable context is being resent", message: `Only ${summary.cacheRate}% of measured tokens were reused from cache.`, recommendedAction: "Review repeated stable inputs for caching eligibility." });
  if (summary.fallbacks > 0) alerts.push({ severity: "medium", code: "PROVIDER_FALLBACK", title: "Provider fallback used", message: `${summary.fallbacks} recorded run${summary.fallbacks === 1 ? "" : "s"} required a fallback provider.`, recommendedAction: "Check provider availability and the original failure reason." });
  const highest = summary.highestUsage;
  if (highest && summary.tokens >= 1000 && highest.tokens / summary.tokens >= 0.6) alerts.push({ severity: "medium", code: "PROVIDER_CONCENTRATION", title: "One provider dominates usage", message: `${highest.label} accounts for ${Math.round((highest.tokens / summary.tokens) * 100)}% of measured tokens.`, recommendedAction: "Confirm this provider is the lowest-cost capable route for the assigned work." });
  for (const task of active) {
    if (task.elapsedSeconds != null && task.elapsedSeconds > 900) alerts.push({ severity: "high", code: "LONG_RUNNING_TASK", title: "Active work may be stuck", message: `${task.title || task.taskId} has been active for more than 15 minutes.`, recommendedAction: "Inspect the task handoff and provider status before retrying." });
  }
  const measured = history.filter((item) => item.tokens > 0 || item.requests > 0);
  if (measured.length > 1) {
    const previous = measured[measured.length - 2];
    const latest = measured[measured.length - 1];
    const tokenSpike = previous.tokens > 0 && latest.tokens >= previous.tokens * 2 && latest.tokens - previous.tokens >= 1000;
    const requestSpike = previous.requests > 0 && latest.requests >= previous.requests * 2 && latest.requests - previous.requests >= 5;
    if (tokenSpike || requestSpike) alerts.push({ severity: "high", code: "USAGE_SPIKE", title: "Usage spiked in the latest period", message: "Latest measured activity is more than twice the previous recorded day.", recommendedAction: "Open the recent history and identify the provider, role, or retries behind the increase." });
  }
  return alerts;
}

async function readAnalyticsSource(env) {
  const [{ content: registry }, { content: evidenceRegistry }, { content: orchestration }, { content: agentRegistry }] = await Promise.all([
    readRepositoryJson(env, USAGE_PATH), readRepositoryJson(env, EVIDENCE_PATH), readRepositoryJson(env, ORCHESTRATION_PATH), readRepositoryJson(env, AGENT_REGISTRY_PATH)
  ]);
  return { registry, evidenceRegistry, orchestration, agentRegistry };
}

export async function handleUsageAnalytics(request, env, pathname) {
  const route = routeIdentity(pathname);
  if (!route) return null;
  if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Usage analytics are read-only.");
  if (!route.public) {
    const auth = authenticateFounder(request, env);
    if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
  }

  const url = new URL(request.url);
  const workspaceId = route.public ? String(url.searchParams.get("workspaceId") || "founder-os") : route.workspaceId;
  const { registry, evidenceRegistry, orchestration, agentRegistry } = await readAnalyticsSource(env);
  const portfolio = workspaceId === "founder-os";
  const records = (Array.isArray(registry.records) ? registry.records : []).filter((record) => portfolio || record.workspaceId === workspaceId);
  const evidence = (Array.isArray(evidenceRegistry.records) ? evidenceRegistry.records : []).filter((record) => portfolio || record.workspaceId === workspaceId);
  const summary = summarizeUsage(records, evidence);
  const history = historyByDay(records, evidence);
  const active = activeUsage(orchestration, workspaceId, new Date(), agentRegistry);
  const body = {
    ok: true, workspaceId, scope: portfolio ? "portfolio" : "workspace", readOnly: true, live: true,
    generatedAt: new Date().toISOString(), refreshAfterSeconds: 30, policyRef: registry.policyRef,
    historicalCoverage: registry.historicalCoverage, summary, active,
    alerts: detectUsageAlerts(summary, history, active), history,
    activityMix: activityMix(records, evidence), costByProvider: costByProvider(records, evidence)
  };
  if (!route.public) body.records = records;
  return json(request, body, 200, route.public ? { "cache-control": "no-store" } : {});
}
