import { appendExecutionLedgerRecord } from "./execution-ledger.js";

const QUEUE_PREFIX = "founder-os:ai-work-queue";
const MAX_ITEMS = 200;
const STATUSES = new Set(["ready", "active", "blocked", "needs-approval", "complete"]);
const PRIORITIES = new Set(["low", "medium", "high", "critical"]);
const SENSITIVE_KEY = /(authorization|cookie|token|secret|password|api[-_]?key|founder[-_]?key)/i;
const ROLE_CAPABILITIES = Object.freeze({
  art: new Set(["plan", "review-architecture", "prepare-handoff"]),
  codex: new Set(["implement", "test", "prepare-pull-request"]),
  gemini: new Set(["review-design", "report-findings", "prepare-handoff"]),
  gpose: new Set(["prepare-prompt", "update-documentation", "summarize"]),
  duey: new Set(["review-wellness-guidance", "validate-protocol-logic", "report-safety-boundaries"])
});

function runtimeStore(env) {
  return env.FOUNDER_OS_RUNTIME_STORE?.get && env.FOUNDER_OS_RUNTIME_STORE?.put
    ? env.FOUNDER_OS_RUNTIME_STORE
    : null;
}

function queueKey(workspaceId) {
  return `${QUEUE_PREFIX}:${encodeURIComponent(workspaceId)}`;
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !SENSITIVE_KEY.test(key))
    .map(([key, item]) => [key, sanitize(item)]));
}

function now() {
  return new Date().toISOString();
}

function revision(item) {
  return Number(item.revision || 0);
}

function requireExpectedRevision(item, expectedRevision) {
  if (!Number.isInteger(Number(expectedRevision)) || Number(expectedRevision) !== revision(item)) {
    const error = new Error("This queue item changed after it was loaded. Refresh before trying again.");
    error.status = 409;
    throw error;
  }
}

function requireOwner(item, actor) {
  if (actor.role === "founder") return;
  if (actor.id !== item.ownerRole) {
    const error = new Error("This AI role cannot change another role's assignment.");
    error.status = 403;
    throw error;
  }
}

function normalizeEvidence(value, actor) {
  const evidence = value && typeof value === "object" ? value : {};
  const summary = String(evidence.summary || "").trim();
  const reference = String(evidence.reference || "").trim();
  if (!summary || !reference) throw new Error("Evidence requires a summary and a verifiable reference.");
  return sanitize({
    evidenceId: String(evidence.evidenceId || `EVIDENCE-${crypto.randomUUID().toUpperCase()}`),
    summary,
    reference,
    submittedBy: actor.id,
    submittedAt: now()
  });
}

function normalizeNewItem(workspaceId, input, actor) {
  const title = String(input?.title || "").trim();
  const ownerRole = String(input?.ownerRole || "").trim().toLowerCase();
  const nextAction = String(input?.nextAction || "").trim();
  const requiredAction = String(input?.requiredAction || "").trim().toLowerCase();
  const priority = String(input?.priority || "medium").trim().toLowerCase();
  const approvalClass = String(input?.approvalClass || "routine").trim().toLowerCase();
  if (!title || !ownerRole || !requiredAction || !nextAction) throw new Error("Queue items require a title, owner role, required action, and next action.");
  if (!/^[a-z][a-z0-9-]{1,47}$/.test(ownerRole)) throw new Error("Queue owner roles must use a stable lowercase role ID.");
  if (!ROLE_CAPABILITIES[ownerRole]) throw new Error("The assigned AI role is not registered for governed queue work.");
  if (!ROLE_CAPABILITIES[ownerRole].has(requiredAction)) throw new Error("The assigned AI role does not have the required capability.");
  if (!PRIORITIES.has(priority)) throw new Error("Queue priority must be low, medium, high, or critical.");
  if (!["routine", "founder"].includes(approvalClass)) throw new Error("Approval class must be routine or founder.");
  const createdAt = now();
  return sanitize({
    queueVersion: "1.0.0",
    itemId: String(input.itemId || `AI-WORK-${crypto.randomUUID().toUpperCase()}`),
    workspaceId,
    packageId: input.packageId ? String(input.packageId) : null,
    title,
    description: String(input.description || "").trim(),
    ownerRole,
    requiredAction,
    priority,
    approvalClass,
    status: "ready",
    progress: 0,
    nextAction,
    evidence: [],
    blockedReason: null,
    createdAt,
    createdBy: actor.id,
    updatedAt: createdAt,
    updatedBy: actor.id,
    claimedAt: null,
    completedAt: null,
    revision: 1
  });
}

async function readState(env, workspaceId) {
  const store = runtimeStore(env);
  if (!store) return { queueVersion: "1.0.0", workspaceId, persisted: false, items: [] };
  const saved = await store.get(queueKey(workspaceId), "json");
  const items = Array.isArray(saved?.items) ? saved.items.filter((item) => item.workspaceId === workspaceId).map(sanitize) : [];
  return { queueVersion: "1.0.0", workspaceId, persisted: true, items };
}

async function saveState(env, workspaceId, items) {
  const store = runtimeStore(env);
  if (!store) return { persisted: false };
  const ordered = [...items]
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
    .slice(0, MAX_ITEMS);
  await store.put(queueKey(workspaceId), JSON.stringify({
    queueVersion: "1.0.0",
    workspaceId,
    updatedAt: now(),
    items: ordered
  }));
  return { persisted: true };
}

async function recordQueueEvent(env, item, actor, status, outcome = null) {
  return appendExecutionLedgerRecord(env, {
    workspaceId: item.workspaceId,
    packageId: item.packageId,
    taskId: item.itemId,
    type: "ai-work-queue",
    status,
    title: item.title,
    actor: actor.id,
    provider: item.ownerRole,
    outcome: sanitize(outcome || { progress: item.progress, evidenceCount: item.evidence.length }),
    references: { queueItemId: item.itemId }
  });
}

async function updateItem(env, workspaceId, itemId, actor, expectedRevision, updater, eventStatus) {
  const state = await readState(env, workspaceId);
  if (!state.persisted) throw new Error("The persistent runtime store is unavailable.");
  const current = state.items.find((item) => item.itemId === itemId);
  if (!current) {
    const error = new Error("The requested queue item does not exist in this workspace.");
    error.status = 404;
    throw error;
  }
  requireExpectedRevision(current, expectedRevision);
  const changed = sanitize({
    ...updater(structuredClone(current)),
    workspaceId,
    itemId: current.itemId,
    revision: revision(current) + 1,
    updatedAt: now(),
    updatedBy: actor.id
  });
  await saveState(env, workspaceId, state.items.map((item) => item.itemId === itemId ? changed : item));
  const ledger = await recordQueueEvent(env, changed, actor, eventStatus, {
    progress: changed.progress,
    evidenceCount: changed.evidence.length,
    approvalClass: changed.approvalClass
  });
  return { item: changed, persisted: true, ledger };
}

export async function listQueueItems(env, workspaceId, filters = {}) {
  const state = await readState(env, workspaceId);
  let items = state.items;
  if (filters.status && STATUSES.has(filters.status)) items = items.filter((item) => item.status === filters.status);
  if (filters.ownerRole) items = items.filter((item) => item.ownerRole === filters.ownerRole);
  return { ...state, items };
}

export async function createQueueItem(env, workspaceId, input, actor) {
  const state = await readState(env, workspaceId);
  if (!state.persisted) throw new Error("The persistent runtime store is unavailable.");
  const item = normalizeNewItem(workspaceId, input, actor);
  if (state.items.some((current) => current.itemId === item.itemId)) {
    const error = new Error("A queue item with this ID already exists.");
    error.status = 409;
    throw error;
  }
  await saveState(env, workspaceId, [item, ...state.items]);
  const ledger = await recordQueueEvent(env, item, actor, "assigned");
  return { item, persisted: true, ledger };
}

export function claimQueueItem(env, workspaceId, itemId, actor, expectedRevision) {
  return updateItem(env, workspaceId, itemId, actor, expectedRevision, (item) => {
    requireOwner(item, actor);
    if (item.status !== "ready") throw new Error("Only ready work can be claimed.");
    return { ...item, status: "active", claimedAt: now(), claimedBy: actor.id };
  }, "claimed");
}

export function reportQueueProgress(env, workspaceId, itemId, actor, expectedRevision, input) {
  return updateItem(env, workspaceId, itemId, actor, expectedRevision, (item) => {
    requireOwner(item, actor);
    if (!["active", "blocked"].includes(item.status)) throw new Error("Only active or blocked work can report progress.");
    const progress = Number(input.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 99) throw new Error("Progress must be between 0 and 99 until completion.");
    const blockedReason = String(input.blockedReason || "").trim() || null;
    return {
      ...item,
      status: blockedReason ? "blocked" : "active",
      progress: Math.round(progress),
      nextAction: String(input.nextAction || item.nextAction).trim(),
      blockedReason
    };
  }, "progress-reported");
}

export function submitQueueEvidence(env, workspaceId, itemId, actor, expectedRevision, input) {
  return updateItem(env, workspaceId, itemId, actor, expectedRevision, (item) => {
    requireOwner(item, actor);
    if (item.status === "complete") throw new Error("Completed work cannot accept new evidence.");
    return { ...item, evidence: [...item.evidence, normalizeEvidence(input, actor)] };
  }, "evidence-submitted");
}

export function requestQueueApproval(env, workspaceId, itemId, actor, expectedRevision) {
  return updateItem(env, workspaceId, itemId, actor, expectedRevision, (item) => {
    requireOwner(item, actor);
    if (item.approvalClass !== "founder") throw new Error("Routine work does not require a Founder approval request.");
    if (item.evidence.length === 0) throw new Error("Founder approval cannot be requested without evidence.");
    return { ...item, status: "needs-approval", progress: Math.max(item.progress, 99), nextAction: "Founder decision required" };
  }, "approval-requested");
}

export function completeRoutineQueueItem(env, workspaceId, itemId, actor, expectedRevision) {
  return updateItem(env, workspaceId, itemId, actor, expectedRevision, (item) => {
    requireOwner(item, actor);
    if (item.approvalClass === "founder") throw new Error("Protected work requires a Founder decision.");
    if (item.evidence.length === 0) throw new Error("Routine work cannot complete without evidence.");
    return { ...item, status: "complete", progress: 100, nextAction: "Complete", completedAt: now(), completedBy: actor.id };
  }, "completed");
}

export function decideQueueItem(env, workspaceId, itemId, actor, expectedRevision, input) {
  return updateItem(env, workspaceId, itemId, actor, expectedRevision, (item) => {
    if (actor.role !== "founder") {
      const error = new Error("Only the Founder can decide protected queue work.");
      error.status = 403;
      throw error;
    }
    if (item.status !== "needs-approval") throw new Error("This queue item is not awaiting Founder approval.");
    const decision = String(input.decision || "").trim().toLowerCase();
    const note = String(input.note || "").trim();
    if (!["approve", "request_changes"].includes(decision)) throw new Error("Decision must be approve or request_changes.");
    return decision === "approve"
      ? { ...item, status: "complete", progress: 100, nextAction: "Complete", completedAt: now(), completedBy: actor.id, founderDecision: { decision, note, decidedAt: now(), decidedBy: actor.id } }
      : { ...item, status: "active", progress: Math.min(item.progress, 95), nextAction: note || "Apply Founder-requested changes", founderDecision: { decision, note, decidedAt: now(), decidedBy: actor.id } };
  }, "founder-decision");
}
