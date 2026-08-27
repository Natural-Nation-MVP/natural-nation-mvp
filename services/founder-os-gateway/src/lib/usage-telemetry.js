const SCHEMA_VERSION = "1.0.0";

function nonNegativeInteger(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

export function normalizeProviderUsage(usage = {}) {
  usage = usage || {};
  const input = nonNegativeInteger(
    usage.input_tokens ??
    usage.inputTokens ??
    usage.promptTokenCount ??
    usage.prompt_token_count
  );
  const output = nonNegativeInteger(
    usage.output_tokens ??
    usage.outputTokens ??
    usage.candidatesTokenCount ??
    usage.candidates_token_count
  );
  const total = nonNegativeInteger(
    usage.total_tokens ??
    usage.totalTokens ??
    usage.totalTokenCount ??
    usage.total_token_count ??
    (input + output)
  );
  const cached = nonNegativeInteger(
    usage.input_tokens_details?.cached_tokens ??
    usage.inputTokensDetails?.cachedTokens ??
    usage.cachedContentTokenCount ??
    usage.cached_content_token_count
  );
  return { input, output, total, cached };
}

export function buildUsageRecord({ state, task, result, delivery, actor }) {
  const dispatchId = result?.dispatchId || task?.dispatchId || null;
  const attempts = Array.isArray(delivery?.attempts) ? delivery.attempts : [];
  const retryCount = attempts.filter((attempt) => attempt.status === "failed").length;
  return {
    schemaVersion: SCHEMA_VERSION,
    usageId: dispatchId ? `USAGE-${dispatchId}` : `USAGE-${crypto.randomUUID().toUpperCase()}`,
    workspaceId: state.workspaceId,
    packageId: state.packageId || null,
    taskId: task?.id || null,
    dispatchId,
    source: "ai-orchestration",
    roleId: actor?.id || task?.owner || null,
    provider: result?.provider || delivery?.executingProvider || delivery?.provider || "unknown",
    model: result?.model || attempts.find((attempt) => attempt.status === "completed")?.model || null,
    requests: Math.max(1, attempts.filter((attempt) => attempt.status !== "skipped").length),
    tokens: normalizeProviderUsage(result?.usage),
    cost: { amount: null, currency: "USD", status: "unavailable" },
    optimization: {
      compactContext: Boolean(task?.contextPack?.compact || result?.contextPack?.compact),
      payloadFingerprint: task?.contextPack?.payloadFingerprint || result?.contextPack?.payloadFingerprint || null,
      retryCount,
      fallbackUsed: Boolean(delivery?.fallbackUsed),
      duplicateSuppressed: false
    },
    occurredAt: new Date().toISOString()
  };
}

export function mergeUsageRecord(registry, record) {
  const records = Array.isArray(registry?.records) ? registry.records : [];
  return {
    schemaVersion: SCHEMA_VERSION,
    policyRef: "docs/founder-os/config/usage-optimization-policy.json",
    updatedAt: record.occurredAt,
    historicalCoverage: registry?.historicalCoverage || {
      status: "unmetered",
      message: "Historical activity before exact telemetry remains unmetered."
    },
    records: [...records.filter((item) => item.usageId !== record.usageId), record]
  };
}
