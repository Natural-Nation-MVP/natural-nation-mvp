import { authenticateFounder } from "../lib/auth.js";
import { readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const REGISTRY_PATH = "docs/founder-os/registry/evidence-records.json";
const SENSITIVE_KEY = /(authorization|cookie|token|secret|password|api[-_]?key|founder[-_]?key)/i;

function routeIdentity(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/evidence(?:\/([^/]+))?$/);
  return match ? {
    workspaceId: decodeURIComponent(match[1]),
    evidenceId: match[2] ? decodeURIComponent(match[2]) : null
  } : null;
}

export function redactEvidence(value) {
  if (Array.isArray(value)) return value.map(redactEvidence);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !SENSITIVE_KEY.test(key))
    .map(([key, item]) => [key, redactEvidence(item)]));
}

function summarize(records) {
  return {
    verifiedRuns: records.filter((record) => record.outcome?.status === "verified").length,
    needsReview: records.filter((record) => record.outcome?.status === "needs-review" || record.decision?.status === "pending").length,
    exceptions: records.filter((record) => record.outcome?.status === "exception" || record.outcome?.status === "failed").length,
    recordedCost: Number(records.reduce((total, record) => total + Number(record.cost?.amount || 0), 0).toFixed(2)),
    currency: "USD"
  };
}

export async function handleEvidenceRecords(request, env, pathname) {
  const route = routeIdentity(pathname);
  if (!route) return null;
  if (request.method !== "GET") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Evidence records are read-only.");

  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);

  const { content: registry } = await readRepositoryJson(env, REGISTRY_PATH);
  const scoped = (Array.isArray(registry.records) ? registry.records : [])
    .filter((record) => record.workspaceId === route.workspaceId)
    .map(redactEvidence)
    .sort((left, right) => String(right.occurredAt).localeCompare(String(left.occurredAt)));

  if (route.evidenceId) {
    const record = scoped.find((item) => item.evidenceId === route.evidenceId);
    return record
      ? json(request, { ok: true, workspaceId: route.workspaceId, record })
      : errorResponse(request, 404, "EVIDENCE_NOT_FOUND", "No evidence record exists for this workspace and ID.");
  }

  const status = new URL(request.url).searchParams.get("status");
  const records = status ? scoped.filter((record) => record.outcome?.status === status) : scoped;
  return json(request, {
    ok: true,
    workspaceId: route.workspaceId,
    readOnly: true,
    summary: summarize(records),
    records
  });
}
