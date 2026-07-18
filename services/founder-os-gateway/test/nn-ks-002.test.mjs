import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

const BASE = "https://founder-os-gateway.example";

function request(path, options = {}) {
  return new Request(`${BASE}${path}`, {
    ...options,
    headers: {
      origin: "https://natural-nation-mvp.github.io",
      "content-type": "application/json",
      "x-founder-os-workspace": "workspace-natural-nation",
      ...options.headers
    }
  });
}

test("NN-KS-002 live workflow discovers, persists, isolates, and exact-approves", async () => {
  const memory = new Map();
  const store = {
    async get(key, type) {
      const value = memory.get(key);
      if (!value) return null;
      return type === "json" ? JSON.parse(value) : value;
    },
    async put(key, value) {
      memory.set(key, value);
    }
  };
  const env = {
    FOUNDER_API_KEY: "test-founder-key",
    GITHUB_TOKEN: "test-github-token",
    GITHUB_OWNER: "Natural-Nation-MVP",
    GITHUB_REPOSITORY: "natural-nation-mvp",
    GITHUB_BRANCH: "main",
    FOUNDER_OS_RUNTIME_STORE: store
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const value = String(url);
    if (value.endsWith("/repos/Natural-Nation-MVP/natural-nation-mvp")) {
      return new Response(JSON.stringify({ full_name: "Natural-Nation-MVP/natural-nation-mvp", default_branch: "main" }), { status: 200 });
    }
    if (value.includes("/git/trees/main?recursive=1")) {
      return new Response(JSON.stringify({
        truncated: false,
        tree: [
          { type: "blob", path: "docs/knowledge/README.md" },
          { type: "blob", path: "backend/src/protocol/service.ts" },
          { type: "blob", path: "docs/prompts/duey.md" },
          { type: "blob", path: "README.md" }
        ]
      }), { status: 200 });
    }
    return originalFetch(url, init);
  };

  try {
    const crossWorkspace = await worker.fetch(request("/api/founder-os/workflows/nn-ks-002", {
      headers: { "x-founder-os-workspace": "workspace-contractor-estimator" }
    }), env, {});
    assert.equal(crossWorkspace.status, 403);

    const startResponse = await worker.fetch(request("/api/founder-os/workflows/nn-ks-002/start", {
      method: "POST",
      body: JSON.stringify({ projectId: "NN-KS-002" })
    }), env, {});
    assert.equal(startResponse.status, 200);
    const started = await startResponse.json();
    assert.equal(started.workflow.status, "waiting-approval");
    assert.equal(started.workflow.stageIndex, 2);
    assert.equal(started.workflow.artifact.discovery.totalFiles, 4);
    assert.equal(started.workflow.artifact.discovery.relevantFileCount, 3);
    assert.match(started.workflow.artifact.hash, /^sha256:/);
    assert.ok(started.workflow.approvals[0].id.includes("."));
    assert.equal(started.productionMutationPerformed, false);

    const reloadResponse = await worker.fetch(request("/api/founder-os/workflows/nn-ks-002"), env, {});
    const reloaded = await reloadResponse.json();
    assert.equal(reloaded.workflow.artifact.hash, started.workflow.artifact.hash);
    assert.equal(reloaded.persisted, true);

    const approval = reloaded.workflow.approvals[0];
    const mismatchResponse = await worker.fetch(request("/api/founder-os/workflows/nn-ks-002/approve", {
      method: "POST",
      body: JSON.stringify({ approvalToken: approval.id, payloadHash: "sha256:changed" })
    }), env, {});
    assert.equal(mismatchResponse.status, 409);

    const approvalResponse = await worker.fetch(request("/api/founder-os/workflows/nn-ks-002/approve", {
      method: "POST",
      body: JSON.stringify({ approvalToken: approval.id, payloadHash: approval.hash })
    }), env, {});
    assert.equal(approvalResponse.status, 200);
    const approved = await approvalResponse.json();
    assert.equal(approved.workflow.status, "implementation-ready");
    assert.equal(approved.workflow.stageIndex, 4);
    assert.equal(approved.workflow.approval.artifactHash, approval.hash);
    assert.equal(approved.productionMutationPerformed, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
