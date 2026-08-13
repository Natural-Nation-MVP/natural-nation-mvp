import { authenticateAgentCallback, authenticateFounder } from "../lib/auth.js";
import { commitFilesAtomically, readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const REGISTRY_PATH = "docs/founder-os/registry/knowledge-records.json";
const AUDIT_ROOT = "docs/founder-os/registry/knowledge-audit";
const AI_ACTIONS = new Set(["create-draft", "edit-draft", "propose-link"]);
const FOUNDER_ACTIONS = new Set(["create-draft", "edit-draft", "link", "approve", "lock", "supersede"]);
const PROTECTED_ACTIONS = new Set(["approve", "lock", "supersede"]);
const LINK_TYPES = new Set(["workspace", "objective", "package", "approval", "task", "decision", "replacement"]);

function clean(value, maximum = 4000) {
  return String(value || "").trim().slice(0, maximum);
}

function routeIdentity(pathname) {
  const match = pathname.match(/^\/v1\/workspaces\/([^/]+)\/knowledge-records(?:\/([^/]+))?$/);
  return match ? {
    workspaceId: decodeURIComponent(match[1]),
    recordId: match[2] ? decodeURIComponent(match[2]) : null
  } : null;
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function authenticateWriter(request, env, action) {
  const founder = authenticateFounder(request, env);
  if (founder.ok) return founder;
  if (PROTECTED_ACTIONS.has(action)) return founder;
  const agent = authenticateAgentCallback(request, env);
  if (agent.ok && AI_ACTIONS.has(action)) return agent;
  return founder.status !== 401 ? founder : agent;
}

function recordState(record) {
  if (record.lockedAt) return "locked";
  if (record.approvalRequired) return "approval-required";
  return record.status || "draft";
}

function validateLink(link) {
  if (!link || !LINK_TYPES.has(clean(link.type, 40)) || !clean(link.targetId, 200)) {
    throw new Error("Links require an allowed type and a target ID.");
  }
  return { type: clean(link.type, 40), targetId: clean(link.targetId, 200), label: clean(link.label, 200) || null };
}

function nextId(records) {
  const maximum = records.reduce((value, record) => {
    const match = String(record.recordId || "").match(/^KR-(\d+)$/);
    return Math.max(value, match ? Number(match[1]) : 0);
  }, 0);
  return `KR-${String(maximum + 1).padStart(4, "0")}`;
}

function immutableSnapshot(record) {
  return {
    version: record.version,
    title: record.title,
    summary: record.summary,
    content: record.content,
    links: record.links,
    proposedLinks: record.proposedLinks || [],
    status: record.status,
    approvalRequired: Boolean(record.approvalRequired),
    recordedAt: record.updatedAt,
    recordedBy: record.updatedBy
  };
}

function applyAction(records, route, action, body, actor, now) {
  if (action === "create-draft") {
    if (route.recordId) throw new Error("Create a draft at the workspace records route.");
    const title = clean(body.title, 200);
    if (!title) throw new Error("A record title is required.");
    const record = {
      schemaVersion: "1.0.0",
      recordId: nextId(records),
      workspaceId: route.workspaceId,
      title,
      summary: clean(body.summary, 1000),
      content: clean(body.content, 20000),
      version: 1,
      status: "draft",
      approvalRequired: true,
      links: [],
      proposedLinks: Array.isArray(body.links) ? body.links.map(validateLink) : [],
      history: [],
      createdAt: now,
      createdBy: actor.id,
      updatedAt: now,
      updatedBy: actor.id
    };
    return { records: [...records, record], record, prior: null };
  }

  const index = records.findIndex((record) => record.recordId === route.recordId && record.workspaceId === route.workspaceId);
  if (index < 0) throw new Error("No knowledge record exists for this workspace and record ID.");
  const prior = records[index];
  if (prior.lockedAt && action !== "supersede") throw new Error("Locked records cannot be edited or relinked; supersede the record instead.");

  let record = { ...prior };
  if (action === "edit-draft") {
    if (prior.status !== "draft") throw new Error("Only draft records can be edited.");
    record = {
      ...record,
      title: clean(body.title, 200) || prior.title,
      summary: body.summary === undefined ? prior.summary : clean(body.summary, 1000),
      content: body.content === undefined ? prior.content : clean(body.content, 20000),
      approvalRequired: true,
      version: prior.version + 1
    };
  } else if (action === "link") {
    const link = validateLink(body.link);
    const duplicate = (prior.links || []).some((item) => item.type === link.type && item.targetId === link.targetId);
    if (duplicate) throw new Error("This record already has that link.");
    record = { ...record, links: [...(prior.links || []), link], version: prior.version + 1 };
  } else if (action === "propose-link") {
    const link = validateLink(body.link);
    const duplicate = [...(prior.links || []), ...(prior.proposedLinks || [])]
      .some((item) => item.type === link.type && item.targetId === link.targetId);
    if (duplicate) throw new Error("This record already has that link or proposal.");
    record = {
      ...record,
      proposedLinks: [...(prior.proposedLinks || []), link],
      approvalRequired: true,
      version: prior.version + 1
    };
  } else if (action === "approve") {
    if (prior.status === "superseded") throw new Error("Superseded records cannot be approved.");
    record = {
      ...record,
      status: "current",
      links: [...(prior.links || []), ...(prior.proposedLinks || [])],
      proposedLinks: [],
      approvalRequired: false,
      approvedAt: now,
      approvedBy: actor.id,
      version: prior.version + 1
    };
  } else if (action === "lock") {
    if (prior.status !== "current") throw new Error("Approve a record before locking it.");
    record = { ...record, lockedAt: now, lockedBy: actor.id, version: prior.version + 1 };
  } else if (action === "supersede") {
    const replacementId = clean(body.replacementRecordId, 80);
    if (!replacementId || replacementId === prior.recordId) throw new Error("Supersede requires a different replacement record ID.");
    const replacement = records.find((item) => item.recordId === replacementId && item.workspaceId === route.workspaceId);
    if (!replacement) throw new Error("The replacement record does not exist in this workspace.");
    record = { ...record, status: "superseded", supersededAt: now, supersededBy: actor.id, replacementRecordId: replacementId, version: prior.version + 1 };
  } else {
    throw new Error("Unsupported knowledge record action.");
  }

  record.updatedAt = now;
  record.updatedBy = actor.id;
  record.history = [...(prior.history || []), immutableSnapshot(prior)];
  const next = [...records];
  next[index] = record;
  return { records: next, record, prior };
}

export async function handleKnowledgeRecords(request, env, pathname) {
  const route = routeIdentity(pathname);
  if (!route) return null;

  const { content: registry } = await readRepositoryJson(env, REGISTRY_PATH);
  const records = Array.isArray(registry.records) ? registry.records : [];

  if (request.method === "GET") {
    const scoped = records.filter((record) => record.workspaceId === route.workspaceId);
    if (route.recordId) {
      const record = scoped.find((item) => item.recordId === route.recordId);
      return record ? json(request, { ok: true, record: { ...record, state: recordState(record) } }) : errorResponse(request, 404, "KNOWLEDGE_RECORD_NOT_FOUND", "No knowledge record exists for this workspace and record ID.");
    }
    return json(request, { ok: true, workspaceId: route.workspaceId, records: scoped.map((record) => ({ ...record, state: recordState(record) })) });
  }

  if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use GET to read or POST to change knowledge records.");
  const body = await readJson(request);
  const action = clean(body?.action, 40);
  if (![...AI_ACTIONS, ...FOUNDER_ACTIONS].includes(action)) return errorResponse(request, 422, "INVALID_KNOWLEDGE_ACTION", "Choose a supported knowledge record action.");

  const auth = authenticateWriter(request, env, action);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
  if (auth.actor.role !== "founder" && !AI_ACTIONS.has(action)) return errorResponse(request, 403, "FOUNDER_AUTHORITY_REQUIRED", "This knowledge action requires Founder authority.");

  const now = new Date().toISOString();
  let result;
  try {
    result = applyAction(records, route, action, body || {}, auth.actor, now);
  } catch (error) {
    return errorResponse(request, 409, "KNOWLEDGE_ACTION_REJECTED", error.message);
  }

  const audit = {
    schemaVersion: "1.0.0",
    action,
    workspaceId: route.workspaceId,
    recordId: result.record.recordId,
    version: result.record.version,
    resultingState: recordState(result.record),
    actor: auth.actor.id,
    actorRole: auth.actor.role,
    occurredAt: now,
    priorVersion: result.prior?.version || null
  };
  const nextRegistry = { ...registry, updatedAt: now, records: result.records };
  const repository = await commitFilesAtomically(env, {
    message: `knowledge: ${action} ${result.record.recordId}`,
    files: [
      { path: REGISTRY_PATH, content: nextRegistry },
      { path: `${AUDIT_ROOT}/${route.workspaceId}-${result.record.recordId}-v${result.record.version}.json`, content: audit }
    ]
  });
  return json(request, { ok: true, action, record: { ...result.record, state: recordState(result.record) }, audit, repository });
}
