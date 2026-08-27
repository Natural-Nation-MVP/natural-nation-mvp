import test from "node:test";
import assert from "node:assert/strict";
import { buildUsageRecord, mergeUsageRecord, normalizeProviderUsage } from "../src/lib/usage-telemetry.js";

test("normalizes OpenAI and Google usage without estimating missing tokens", () => {
  assert.deepEqual(normalizeProviderUsage({ input_tokens:80, output_tokens:20, total_tokens:100, input_tokens_details:{ cached_tokens:25 } }), { input:80, output:20, total:100, cached:25 });
  assert.deepEqual(normalizeProviderUsage({ promptTokenCount:40, candidatesTokenCount:10, totalTokenCount:50, cachedContentTokenCount:5 }), { input:40, output:10, total:50, cached:5 });
  assert.deepEqual(normalizeProviderUsage(null), { input:0, output:0, total:0, cached:0 });
});

test("builds an exact workspace-scoped record including retry and fallback overhead", () => {
  const record = buildUsageRecord({
    state:{ workspaceId:"natural-nation", packageId:"NN-BUILD-001" },
    task:{ id:"AI-TASK-001", contextPack:{ compact:true, payloadFingerprint:"sha256:abc" } },
    result:{ dispatchId:"AI-DISPATCH-001", provider:"google", model:"gemini-2.5-flash", usage:{ totalTokenCount:50 } },
    delivery:{ fallbackUsed:true, attempts:[{ status:"failed" }, { status:"completed" }] },
    actor:{ id:"art" }
  });
  assert.equal(record.workspaceId, "natural-nation");
  assert.equal(record.usageId, "USAGE-AI-DISPATCH-001");
  assert.equal(record.tokens.total, 50);
  assert.equal(record.optimization.retryCount, 1);
  assert.equal(record.optimization.fallbackUsed, true);
  assert.equal(record.optimization.compactContext, true);
  assert.equal(record.cost.status, "unavailable");
});

test("upserts a dispatch record instead of duplicating it", () => {
  const base = { usageId:"USAGE-1", occurredAt:"2026-08-27T00:00:00.000Z" };
  const first = mergeUsageRecord({ records:[] }, base);
  const second = mergeUsageRecord(first, { ...base, provider:"openai" });
  assert.equal(second.records.length, 1);
  assert.equal(second.records[0].provider, "openai");
});
