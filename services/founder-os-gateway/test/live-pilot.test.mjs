import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

const ORIGIN = "https://natural-nation-mvp.github.io";
const BASE = "https://founder-os-gateway.example";
const ENV = {
  FOUNDER_API_KEY: "test-founder-key-never-used-in-production",
  GITHUB_TOKEN: "configured",
  GITHUB_OWNER: "Natural-Nation-MVP",
  GITHUB_REPOSITORY: "natural-nation-mvp",
  GITHUB_BRANCH: "main"
};

function request(path, options = {}) {
  return new Request(`${BASE}${path}`, {
    ...options,
    headers: {
      origin: ORIGIN,
      "content-type": "application/json",
      "x-founder-os-workspace": "workspace-natural-nation",
      ...options.headers
    }
  });
}

test("CORS permits the non-secret workspace context header", async () => {
  const response = await worker.fetch(request("/api/founder-os/health", { method: "OPTIONS" }), ENV, {});
  assert.equal(response.status, 204);
  assert.match(response.headers.get("access-control-allow-headers"), /x-founder-os-workspace/);
});

test("workspace registry exposes Natural Nation as Workspace #1", async () => {
  const response = await worker.fetch(request("/api/founder-os/workspaces"), ENV, {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.workspaces[0].id, "workspace-natural-nation");
  assert.equal(body.workspaces[0].number, 1);
});

test("cross-workspace reads are denied", async () => {
  const response = await worker.fetch(
    request("/api/founder-os/workspaces/workspace-contractor-estimator"),
    ENV,
    {}
  );
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error.code, "WORKSPACE_ACCESS_DENIED");
});

test("pilot creates a signed exact approval binding", async () => {
  const pilotResponse = await worker.fetch(
    request("/api/founder-os/pilot/run", {
      method: "POST",
      body: JSON.stringify({ workflow: "natural-nation-founder-review", requestedAt: "2026-07-17T21:00:00.000Z" })
    }),
    ENV,
    {}
  );
  assert.equal(pilotResponse.status, 200);
  const pilot = await pilotResponse.json();
  assert.ok(pilot.approval.id.includes("."));
  assert.match(pilot.approval.hash, /^sha256:/);
  assert.equal(pilot.productionMutationPerformed, false);

  const mismatchResponse = await worker.fetch(
    request(`/api/founder-os/approvals/${encodeURIComponent(pilot.approval.id)}/approve`, {
      method: "POST",
      body: JSON.stringify({ payloadHash: "sha256:changed" })
    }),
    ENV,
    {}
  );
  assert.equal(mismatchResponse.status, 409);

  const approvalResponse = await worker.fetch(
    request(`/api/founder-os/approvals/${encodeURIComponent(pilot.approval.id)}/approve`, {
      method: "POST",
      body: JSON.stringify({ payloadHash: pilot.approval.hash })
    }),
    ENV,
    {}
  );
  assert.equal(approvalResponse.status, 200);
  const approval = await approvalResponse.json();
  assert.equal(approval.ok, true);
  assert.equal(approval.productionMutationPerformed, false);
});

test("unknown pilot routes fail with structured JSON", async () => {
  const response = await worker.fetch(request("/api/founder-os/missing"), ENV, {});
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, "PILOT_ROUTE_NOT_FOUND");
});
