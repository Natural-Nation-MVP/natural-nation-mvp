import assert from "node:assert/strict";
import test from "node:test";
import { appendExecutionLedgerRecord, readExecutionLedger } from "../src/lib/execution-ledger.js";
import { handleExecutionLedger } from "../src/routes/execution-ledger.js";

function memoryStore() {
  const values = new Map();
  return {
    async get(key, type) {
      const value = values.get(key);
      return type === "json" && value ? JSON.parse(value) : value || null;
    },
    async put(key, value) {
      values.set(key, value);
    }
  };
}

function env() {
  return { FOUNDER_API_KEY: "founder-test", FOUNDER_OS_RUNTIME_STORE: memoryStore() };
}

test("persists lightweight execution history across reads", async () => {
  const bindings = env();
  const saved = await appendExecutionLedgerRecord(bindings, {
    recordId: "LEDGER-1",
    workspaceId: "natural-nation",
    packageId: "NN-BUILD-001",
    taskId: "AI-TASK-002",
    type: "governed-run",
    status: "completed",
    title: "Prepare implementation",
    actor: "codex",
    provider: "openai",
    cost: { amount: 0.12, currency: "USD" },
    outcome: { verificationStatus: "passed", token: "remove-me" },
    occurredAt: "2026-09-01T20:00:00.000Z"
  });
  assert.equal(saved.persisted, true);

  const reloaded = await readExecutionLedger(bindings, "natural-nation");
  assert.equal(reloaded.persisted, true);
  assert.equal(reloaded.records.length, 1);
  assert.equal(reloaded.records[0].cost.amount, 0.12);
  assert.equal(reloaded.records[0].outcome.token, undefined);
});

test("keeps execution history isolated by workspace", async () => {
  const bindings = env();
  await appendExecutionLedgerRecord(bindings, { workspaceId: "natural-nation", type: "governed-run", status: "completed" });
  await appendExecutionLedgerRecord(bindings, { workspaceId: "founder-os", type: "founder-decision", status: "approved" });
  const naturalNation = await readExecutionLedger(bindings, "natural-nation");
  const founderOs = await readExecutionLedger(bindings, "founder-os");
  assert.equal(naturalNation.records.length, 1);
  assert.equal(founderOs.records.length, 1);
  assert.equal(naturalNation.records[0].workspaceId, "natural-nation");
  assert.equal(founderOs.records[0].workspaceId, "founder-os");
});

test("returns a Founder-authenticated read-only ledger summary", async () => {
  const bindings = env();
  await appendExecutionLedgerRecord(bindings, {
    workspaceId: "natural-nation", type: "governed-run", status: "completed", cost: { amount: 0.25 }
  });
  const request = new Request("https://gateway.test/v1/workspaces/natural-nation/execution-ledger", {
    headers: { authorization: "Bearer founder-test" }
  });
  const response = await handleExecutionLedger(request, bindings, "/v1/workspaces/natural-nation/execution-ledger");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const body = await response.json();
  assert.equal(body.persisted, true);
  assert.equal(body.summary.runs, 1);
  assert.equal(body.summary.recordedCost, 0.25);
});

test("degrades safely when the runtime store is unavailable", async () => {
  const saved = await appendExecutionLedgerRecord({}, { workspaceId: "natural-nation", type: "governed-run", status: "completed" });
  assert.equal(saved.persisted, false);
  const ledger = await readExecutionLedger({}, "natural-nation");
  assert.deepEqual(ledger.records, []);
});
