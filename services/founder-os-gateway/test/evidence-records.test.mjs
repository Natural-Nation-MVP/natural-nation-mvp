import test from "node:test";
import assert from "node:assert/strict";
import { handleEvidenceRecords, redactEvidence } from "../src/routes/evidence-records.js";

const registry = {
  records: [
    { evidenceId:"EV-0001", workspaceId:"natural-nation", occurredAt:"2026-08-24T17:00:00.000Z", payloadHash:"sha256:abc", repository:{ ref:"main", commit:"380559b" }, outcome:{ status:"verified" }, decision:{ status:"approved" }, cost:{ amount:1.25 }, technicalProof:{ token:"remove", check:"keep" } },
    { evidenceId:"EV-0002", workspaceId:"founder-os", occurredAt:"2026-08-24T18:00:00.000Z", outcome:{ status:"exception" }, decision:{ status:"pending" }, cost:{ amount:9 } }
  ]
};

function env() {
  return {
    FOUNDER_API_KEY:"founder-test",
    GITHUB_TOKEN:"token",
    GITHUB_OWNER:"Natural-Nation-MVP",
    GITHUB_REPOSITORY:"natural-nation-mvp",
    GITHUB_BRANCH:"main"
  };
}

const originalFetch = globalThis.fetch;

test.after(() => {
  globalThis.fetch = originalFetch;
});

function installRepositoryFetch() {
  globalThis.fetch = async () => new Response(JSON.stringify({
    type: "file",
    sha: "registry-sha",
    content: Buffer.from(JSON.stringify(registry), "utf8").toString("base64")
  }), { status: 200, headers: { "content-type": "application/json" } });
}

test("redacts secret-shaped fields recursively", () => {
  assert.deepEqual(redactEvidence({ token:"x", nested:{ apiKey:"y", safe:"ok" } }), { nested:{ safe:"ok" } });
});

test("rejects unauthenticated reads", async () => {
  const request = new Request("https://gateway.test/v1/workspaces/natural-nation/evidence");
  const response = await handleEvidenceRecords(request, env(), "/v1/workspaces/natural-nation/evidence");
  assert.equal(response.status, 401);
});

test("returns only workspace-scoped evidence and immutable references", async () => {
  installRepositoryFetch();
  const request = new Request("https://gateway.test/v1/workspaces/natural-nation/evidence", { headers:{ authorization:"Bearer founder-test" } });
  const response = await handleEvidenceRecords(request, env(), "/v1/workspaces/natural-nation/evidence");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.records.length, 1);
  assert.equal(body.records[0].workspaceId, "natural-nation");
  assert.equal(body.records[0].technicalProof.token, undefined);
  assert.equal(body.records[0].payloadHash, "sha256:abc");
  assert.deepEqual(body.records[0].repository, { ref:"main", commit:"380559b" });
  assert.equal(body.summary.verifiedRuns, 1);
  assert.equal(body.summary.recordedCost, 1.25);
});
