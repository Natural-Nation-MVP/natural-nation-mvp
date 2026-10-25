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

  const naturalNation = await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test");
  const founderOs = await call(env, "/v1/workspaces/founder-os/ai-work-queue", "founder-test");
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

test("rejects unauthenticated and wrong-token queue reads", async () => {
  const env = bindings();
  await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test", {
    itemId: "WORK-READ-1",
    title: "Review protocol safety",
    ownerRole: "duey",
    requiredAction: "review-wellness-guidance",
    nextAction: "Complete safety review"
  });

  const noToken = await call(env, "/v1/workspaces/natural-nation/ai-work-queue");
  assert.equal(noToken.response.status, 401);
  assert.deepEqual(noToken.body.items, undefined);

  const wrongToken = await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "not-the-founder-key");
  assert.equal(wrongToken.response.status, 403);

  const agentWithoutRole = await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "agent-test");
  assert.equal(agentWithoutRole.response.status, 403);

  const agentWithRole = await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "agent-test", undefined, "duey");
  assert.equal(agentWithRole.response.status, 200);
  assert.deepEqual(agentWithRole.body.items.map((item) => item.itemId), ["WORK-READ-1"]);

  const founderRead = await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test");
  assert.equal(founderRead.response.status, 200);
  assert.deepEqual(founderRead.body.items.map((item) => item.itemId), ["WORK-READ-1"]);
});

async function createAndClaim(env, itemId, extra = {}) {
  await call(env, "/v1/workspaces/natural-nation/ai-work-queue", "founder-test", {
    itemId,
    title: extra.title || "Test work",
    ownerRole: "gpose",
    requiredAction: "update-documentation",
    nextAction: "Submit verified evidence",
    approvalClass: "founder",
    ...extra
  });
  const claimed = await call(env, `/v1/workspaces/natural-nation/ai-work-queue/${itemId}/claim`, "agent-test", {
    expectedRevision: 1
  }, "gpose");
  assert.equal(claimed.response.status, 200);
  const evidence = await call(env, `/v1/workspaces/natural-nation/ai-work-queue/${itemId}/evidence`, "agent-test", {
    expectedRevision: 2,
    summary: "Work done, no provider call made.",
    reference: "docs/example.md"
  }, "gpose");
  assert.equal(evidence.body.item.revision, 3);
}

test("temporary lift completes non-token founder work only when the lift is active", async () => {
  const env = bindings();
  env.FOUNDER_APPROVAL_LIFT_NON_TOKEN = "true";
  await createAndClaim(env, "WORK-LIFT-1", { costImpact: "none" });
  const completed = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-LIFT-1/complete-non-token", "agent-test", {
    expectedRevision: 3
  }, "gpose");
  assert.equal(completed.response.status, 200);
  assert.equal(completed.body.item.status, "complete");
  assert.equal(completed.body.item.approvalLift.lifted, true);
});

test("temporary lift never completes token-consuming founder work", async () => {
  const env = bindings();
  env.FOUNDER_APPROVAL_LIFT_NON_TOKEN = "true";
  await createAndClaim(env, "WORK-LIFT-2", { costImpact: "token-consuming" });
  const blocked = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-LIFT-2/complete-non-token", "agent-test", {
    expectedRevision: 3
  }, "gpose");
  assert.equal(blocked.response.status, 422);
  assert.match(blocked.body.error.message, /Founder decision/i);
});

test("temporary lift is inactive without the flag, and expired lifts do not apply", async () => {
  const noFlag = bindings();
  await createAndClaim(noFlag, "WORK-LIFT-3", { costImpact: "none" });
  const noFlagResult = await call(noFlag, "/v1/workspaces/natural-nation/ai-work-queue/WORK-LIFT-3/complete-non-token", "agent-test", {
    expectedRevision: 3
  }, "gpose");
  assert.equal(noFlagResult.response.status, 422);

  const expired = bindings();
  expired.FOUNDER_APPROVAL_LIFT_NON_TOKEN = "true";
  expired.FOUNDER_APPROVAL_LIFT_NON_TOKEN_UNTIL = "2020-01-01T00:00:00Z";
  await createAndClaim(expired, "WORK-LIFT-4", { costImpact: "none" });
  const expiredResult = await call(expired, "/v1/workspaces/natural-nation/ai-work-queue/WORK-LIFT-4/complete-non-token", "agent-test", {
    expectedRevision: 3
  }, "gpose");
  assert.equal(expiredResult.response.status, 422);
});

test("non-token lift defaults undeclared work to token-consuming", async () => {
  const env = bindings();
  env.FOUNDER_APPROVAL_LIFT_NON_TOKEN = "true";
  await createAndClaim(env, "WORK-LIFT-5", {});
  const blocked = await call(env, "/v1/workspaces/natural-nation/ai-work-queue/WORK-LIFT-5/complete-non-token", "agent-test", {
    expectedRevision: 3
  }, "gpose");
  assert.equal(blocked.response.status, 422);
});
