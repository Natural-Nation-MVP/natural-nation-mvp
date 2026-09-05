import assert from "node:assert/strict";
import test from "node:test";
import { handleAiWorkQueue } from "../src/routes/ai-work-queue.js";

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

function bindings() {
  return {
    FOUNDER_API_KEY: "founder-test",
    AI_CALLBACK_TOKEN: "agent-test",
    FOUNDER_OS_RUNTIME_STORE: memoryStore()
  };
}

function request(path, token, body, role) {
  return new Request(`https://gateway.test${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(role ? { "x-founder-os-agent": role } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

async function call(env, path, token, body, role) {
  const response = await handleAiWorkQueue(request(path, token, body, role), env, path);
  return { response, body: await response.json() };
}

test("keeps queue records isolated by workspace", async () => {
  const env = bindings();
  await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test", {
    itemId: "WORK-NN-1",
    title: "Review protocol safety",
    ownerRole: "duey",
    requiredAction: "review-wellness-guidance",
    nextAction: "Complete safety review",
    approvalClass: "founder"
  });
  await call(env, "/v1/workspaces/founder-os/ai-work-queue", "founder-test", {
    itemId: "WORK-FOS-1",
    title: "Review platform contract",
    ownerRole: "art",
    requiredAction: "plan",
    nextAction: "Report architecture findings"
  });

  const naturalNation = await call(env, "/v1/workspaces/natural-nation/ai-work-queue");
  const founderOs = await call(env, "/v1/workspaces/founder-os/ai-work-queue");
  assert.deepEqual(naturalNation.body.items.map((item) => item.itemId), ["WORK-NN-1"]);
  assert.deepEqual(founderOs.body.items.map((item) => item.itemId), ["WORK-FOS-1"]);
  assert.equal(naturalNation.body.summary.ready, 1);
});

test("rejects assignments outside a role capability", async () => {
  const env = bindings();
  const result = await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test", {
    itemId: "WORK-CAPABILITY-1",
    title: "Implement protected runtime code",
    ownerRole: "gpose",
    requiredAction: "implement",
    nextAction: "Change the gateway"
  });
  assert.equal(result.response.status, 422);
  assert.match(result.body.error.message, /required capability/i);
});

test("allows only the assigned role to claim ready work and rejects a duplicate claim", async () => {
  const env = bindings();
  const created = await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test", {
    itemId: "WORK-CLAIM-1",
    title: "Review protocol safety",
    ownerRole: "duey",
    requiredAction: "review-wellness-guidance",
    nextAction: "Complete safety review"
  });
  assert.equal(created.response.status, 201);

  const wrongRole = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-CLAIM-1/claim", "agent-test", {
    expectedRevision: 1
  }, "art");
  assert.equal(wrongRole.response.status, 403);

  const claimed = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-CLAIM-1/claim", "agent-test", {
    expectedRevision: 1
  }, "duey");
  assert.equal(claimed.response.status, 200);
  assert.equal(claimed.body.item.status, "active");
  assert.equal(claimed.body.item.revision, 2);

  const duplicate = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-CLAIM-1/claim", "agent-test", {
    expectedRevision: 1
  }, "duey");
  assert.equal(duplicate.response.status, 409);
});

test("requires evidence before protected work can request Founder approval", async () => {
  const env = bindings();
  await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test", {
    itemId: "WORK-APPROVAL-1",
    title: "Prepare release evidence",
    ownerRole: "gpose",
    requiredAction: "update-documentation",
    nextAction: "Submit verified evidence",
    approvalClass: "founder"
  });
  await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-APPROVAL-1/claim", "agent-test", {
    expectedRevision: 1
  }, "gpose");

  const missingEvidence = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-APPROVAL-1/request-approval", "agent-test", {
    expectedRevision: 2
  }, "gpose");
  assert.equal(missingEvidence.response.status, 422);

  const evidence = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-APPROVAL-1/evidence", "agent-test", {
    expectedRevision: 2,
    summary: "All required checks passed.",
    reference: "https://github.com/Natural-Nation-MVP/natural-nation-mvp/actions"
  }, "gpose");
  assert.equal(evidence.body.item.evidence.length, 1);
  assert.equal(evidence.body.item.revision, 3);

  const requested = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-APPROVAL-1/request-approval", "agent-test", {
    expectedRevision: 3
  }, "gpose");
  assert.equal(requested.body.item.status, "needs-approval");

  const approved = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-APPROVAL-1/decision", "founder-test", {
    expectedRevision: 4,
    decision: "approve",
    note: "Verified and approved."
  });
  assert.equal(approved.body.item.status, "complete");
  assert.equal(approved.body.item.progress, 100);
});

test("routine work completes only after evidence is submitted", async () => {
  const env = bindings();
  await call(env, "/v1/workspaces/founder-os/ai-work-queue", "founder-test", {
    itemId: "WORK-ROUTINE-1",
    title: "Update documentation",
    ownerRole: "gpose",
    requiredAction: "update-documentation",
    nextAction: "Record the updated file"
  });
  await call(env, "/v1/workspaces/founder-os/ai-work-queue/WORK-ROUTINE-1/claim", "agent-test", {
    expectedRevision: 1
  }, "gpose");

  const blocked = await call(env, "/v1/workspaces/founder-os/ai-work-queue/WORK-ROUTINE-1/complete", "agent-test", {
    expectedRevision: 2
  }, "gpose");
  assert.equal(blocked.response.status, 422);

  await call(env, "/v1/workspaces/founder-os/ai-work-queue/WORK-ROUTINE-1/evidence", "agent-test", {
    expectedRevision: 2,
    summary: "Documentation updated.",
    reference: "docs/releases/example.md"
  }, "gpose");
  const completed = await call(env, "/v1/workspaces/founder-os/ai-work-queue/WORK-ROUTINE-1/complete", "agent-test", {
    expectedRevision: 3
  }, "gpose");
  assert.equal(completed.body.item.status, "complete");
});
