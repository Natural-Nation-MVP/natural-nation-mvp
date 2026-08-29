import { readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";
import { providerReadiness } from "../lib/ai-provider-adapters.js";
import { activeUsage, detectUsageAlerts, summarizeUsage } from "./usage-analytics.js";

const PATHS = {
  management: "docs/founder-os/config/workspace-registry.json",
  canonical: "docs/founder-os/registry/workspaces.json",
  orchestration: "docs/founder-os/config/ai-orchestration-state.json",
  evidence: "docs/founder-os/registry/evidence-records.json",
  usage: "docs/founder-os/registry/usage-records.json",
  agents: "docs/founder-os/config/ai-agent-registry.json"
};
const COMPLETE = new Set(["complete", "completed", "founder-approved", "rejected"]);

function safeWorkspacePortfolio(management, canonical) {
  const workspaces = new Map();
  for (const item of management.workspaces || []) {
    workspaces.set(item.id, {
      workspaceId: item.id, name: item.name, status: item.status || "unknown",
      health: item.health || "Not reported", currentMilestone: item.stage || "Not reported",
      progress: Number(item.progress || 0), nextAction: item.nextAction || "Review workspace status"
    });
  }
  for (const item of canonical.workspaces || []) {
    const current = workspaces.get(item.workspaceId) || {};
    workspaces.set(item.workspaceId, {
      workspaceId: item.workspaceId, name: current.name || item.displayName || item.workspaceId,
      status: current.status || item.status || item.lifecycleStatus || "unknown",
      health: current.health || item.health?.summary || item.health?.state || "Not reported",
      currentMilestone: current.currentMilestone || item.roadmap?.[0] || item.lifecycleStatus || item.status || "Not reported",
      progress: current.progress || 0, nextAction: current.nextAction || item.roadmap?.[0] || "Review workspace status"
    });
  }
  return [...workspaces.values()];
}

function pendingApprovals(orchestration) {
  return (orchestration.tasks || []).filter((task) =>
    task.owner === "founder" && !COMPLETE.has(String(task.status || "").toLowerCase())
  ).map((task) => ({
    workspaceId: task.workspaceId, packageId: task.packageId, taskId: task.id,
    title: task.title, status: task.status || "pending", requestedAt: task.startedAt || orchestration.updatedAt || null
  }));
}

function blockingRisks(orchestration) {
  return (orchestration.tasks || []).filter((task) =>
    String(task.status || "").toLowerCase() === "blocked" || Boolean(task.blockedReason)
  ).map((task) => ({
    workspaceId: task.workspaceId, taskId: task.id, title: task.title,
    reason: task.blockedReason || "Task is blocked", status: task.status || "blocked"
  }));
}

function evidenceSummary(records) {
  const sorted = [...records].sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
  const status = (record) => String(record.outcome?.status || "needs-review").toLowerCase();
  return {
    verified: records.filter((record) => status(record) === "verified").length,
    needsReview: records.filter((record) => !["verified", "exception"].includes(status(record))).length,
    exceptions: records.filter((record) => status(record) === "exception").length,
    latestAt: sorted[0]?.occurredAt || null,
    recent: sorted.slice(0, 5).map((record) => ({
      evidenceId: record.evidenceId, workspaceId: record.workspaceId, eventType: record.eventType,
      title: record.title, summary: record.summary, status: record.outcome?.status || "needs-review",
      occurredAt: record.occurredAt, repositoryRef: record.repository?.ref || null,
      commit: record.repository?.commit || null
    }))
  };
}

function historyForAlerts(records) {
  const days = new Map();
  for (const record of records) {
    const date = String(record.occurredAt || "").slice(0, 10) || "Unknown";
    const day = days.get(date) || { date, requests: 0, tokens: 0 };
    day.requests += Number(record.requests || 0);
    day.tokens += Number(record.tokens?.total || 0);
    days.set(date, day);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildCommandCenter({ management, canonical, orchestration, evidenceRegistry, usageRegistry, agentRegistry, readiness, now = new Date() }) {
  const evidenceRecords = Array.isArray(evidenceRegistry.records) ? evidenceRegistry.records : [];
  const usageRecords = Array.isArray(usageRegistry.records) ? usageRegistry.records : [];
  const workspaces = safeWorkspacePortfolio(management, canonical);
  const activeWork = activeUsage(orchestration, "founder-os", now, agentRegistry);
  const approvals = pendingApprovals(orchestration);
  const risks = blockingRisks(orchestration);
  const usage = summarizeUsage(usageRecords, evidenceRecords);
  const alerts = detectUsageAlerts(usage, historyForAlerts(usageRecords), activeWork);
  const providers = [
    { id: "openai", name: "OpenAI", ready: Boolean(readiness.openai) },
    { id: "google", name: "Google AI", ready: Boolean(readiness.google) }
  ];
  const evidence = evidenceSummary(evidenceRecords);
  const latest = evidence.recent[0] || null;
  return {
    ok: true, readOnly: true, live: true, scope: "portfolio", generatedAt: now.toISOString(), refreshAfterSeconds: 30,
    summary: {
      workspaces: workspaces.length, activeWork: activeWork.length, pendingApprovals: approvals.length,
      blockingRisks: risks.length + alerts.length, providersReady: providers.filter((item) => item.ready).length,
      providersTotal: providers.length, verifiedEvidence: evidence.verified, recordedCost: usage.recordedCost,
      currency: usage.currency
    },
    workspaces, activeWork, approvals, risks, providers,
    repository: latest ? { status: "synchronized", latestCommit: latest.commit, latestRef: latest.repositoryRef, updatedAt: latest.occurredAt } : { status: "unrecorded", latestCommit: null, latestRef: null, updatedAt: null },
    evidence, usage: { requests: usage.requests, tokens: usage.tokens, retries: usage.retries, cacheRate: usage.cacheRate, recordedCost: usage.recordedCost, currency: usage.currency, alerts }
  };
}

export async function handleCommandCenter(request, env, pathname) {
  if (pathname !== "/v1/public/command-center") return null;
  if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "The Founder Command Center is read-only.");
  const sources = await Promise.all(Object.values(PATHS).map((path) => readRepositoryJson(env, path)));
  const [management, canonical, orchestration, evidenceRegistry, usageRegistry, agentRegistry] = sources.map(({ content }) => content);
  const body = buildCommandCenter({ management, canonical, orchestration, evidenceRegistry, usageRegistry, agentRegistry, readiness: providerReadiness(env) });
  return json(request, body, 200, { "cache-control": "no-store" });
}
