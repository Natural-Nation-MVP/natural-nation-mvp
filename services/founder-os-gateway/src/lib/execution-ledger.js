const LEDGER_PREFIX = "founder-os:execution-ledger";
const MAX_RECORDS = 500;
const SENSITIVE_KEY = /(authorization|cookie|token|secret|password|api[-_]?key|founder[-_]?key)/i;

function runtimeStore(env) {
  return env.FOUNDER_OS_RUNTIME_STORE?.get && env.FOUNDER_OS_RUNTIME_STORE?.put
    ? env.FOUNDER_OS_RUNTIME_STORE
    : null;
}

function ledgerKey(workspaceId) {
  return `${LEDGER_PREFIX}:${encodeURIComponent(workspaceId)}`;
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !SENSITIVE_KEY.test(key))
    .map(([key, item]) => [key, sanitize(item)]));
}

function normalizeRecord(record) {
  const workspaceId = String(record?.workspaceId || "").trim();
  const type = String(record?.type || "").trim();
  const status = String(record?.status || "").trim();
  if (!workspaceId || !type || !status) {
    throw new Error("Execution ledger records require workspaceId, type, and status.");
  }
  return sanitize({
    ledgerVersion: "1.0.0",
    recordId: String(record.recordId || `LEDGER-${crypto.randomUUID().toUpperCase()}`),
    workspaceId,
    packageId: record.packageId ? String(record.packageId) : null,
    taskId: record.taskId ? String(record.taskId) : null,
    type,
    status,
    title: String(record.title || type),
    actor: record.actor ? String(record.actor) : null,
    provider: record.provider ? String(record.provider) : null,
    cost: record.cost && Number.isFinite(Number(record.cost.amount))
      ? { amount: Number(record.cost.amount), currency: String(record.cost.currency || "USD") }
      : null,
    outcome: record.outcome || null,
    references: record.references || null,
    occurredAt: String(record.occurredAt || new Date().toISOString())
  });
}

export async function readExecutionLedger(env, workspaceId) {
  const store = runtimeStore(env);
  if (!store) return { persisted: false, workspaceId, records: [] };
  const saved = await store.get(ledgerKey(workspaceId), "json");
  const records = Array.isArray(saved?.records) ? saved.records : [];
  return { persisted: true, workspaceId, records: records.map(sanitize) };
}

export async function appendExecutionLedgerRecord(env, record) {
  const normalized = normalizeRecord(record);
  const current = await readExecutionLedger(env, normalized.workspaceId);
  if (!current.persisted) return { persisted: false, record: normalized };
  const records = [normalized, ...current.records.filter((item) => item.recordId !== normalized.recordId)]
    .sort((left, right) => String(right.occurredAt).localeCompare(String(left.occurredAt)))
    .slice(0, MAX_RECORDS);
  await runtimeStore(env).put(ledgerKey(normalized.workspaceId), JSON.stringify({
    ledgerVersion: "1.0.0",
    workspaceId: normalized.workspaceId,
    updatedAt: new Date().toISOString(),
    records
  }));
  return { persisted: true, record: normalized };
}

export function executionLedgerAvailable(env) {
  return Boolean(runtimeStore(env));
}
