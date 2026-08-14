import test from "node:test";
import assert from "node:assert/strict";
import { handleKnowledgeRecords } from "../src/routes/knowledge-records.js";

const REGISTRY = {
  schemaVersion: "1.0.0",
  records: [{
    schemaVersion: "1.0.0", recordId: "KR-0001", workspaceId: "natural-nation",
    title: "Product Overview", summary: "Current truth", content: "v1", version: 1,
    status: "draft", approvalRequired: false, links: [], history: [],
    createdAt: "2026-08-13T00:00:00.000Z", createdBy: "ai-provider",
    updatedAt: "2026-08-13T00:00:00.000Z", updatedBy: "ai-provider"
  }]
};

function encode(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`).toString("base64"); }
function env() {
  return {
    FOUNDER_API_KEY: "founder-secret", AI_CALLBACK_TOKEN: "ai-secret", GITHUB_TOKEN: "github-token",
    GITHUB_OWNER: "Natural-Nation-MVP", GITHUB_REPOSITORY: "natural-nation-mvp", GITHUB_BRANCH: "main"
  };
}
function request(path, body, token = "founder-secret", method = "POST") {
  return new Request(`https://gateway.test${path}`, {
    method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body)
  });
}
function mockGithub(registry = structuredClone(REGISTRY)) {
  const writes = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method || "GET";
    if (path.includes("/contents/docs/founder-os/registry/knowledge-records.json") && method === "GET") return Response.json({ type: "file", content: encode(registry), sha: "registry-sha" });
    if (path.includes("/git/ref/heads/") || path.includes("/git/refs/heads/")) return Response.json({ object: { sha: method === "GET" ? "parent-sha" : "commit-sha" } });
    if (path.includes("/git/commits/parent-sha")) return Response.json({ tree: { sha: "parent-tree" } });
    if (path.endsWith("/git/blobs")) { const body = JSON.parse(options.body); writes.push(body.content); return Response.json({ sha: `blob-${writes.length}` }); }
    if (path.endsWith("/git/trees")) return Response.json({ sha: "tree-sha" });
    if (path.endsWith("/git/commits")) return Response.json({ sha: "commit-sha", html_url: "https://github.test/commit/commit-sha" });
    throw new Error(`Unhandled GitHub mock request: ${method} ${path}`);
  };
  return { writes, restore() { globalThis.fetch = original; } };
}

test("lists only records in the requested workspace", async () => {
  const mock = mockGithub({ ...REGISTRY, records: [...REGISTRY.records, { ...REGISTRY.records[0], recordId: "KR-0002", workspaceId: "founder-os" }] });
  try {
    const response = await handleKnowledgeRecords(request("/v1/workspaces/natural-nation/knowledge-records", null, "founder-secret", "GET"), env(), "/v1/workspaces/natural-nation/knowledge-records");
    const payload = await response.json();
    assert.equal(payload.records.length, 1);
    assert.equal(payload.records[0].workspaceId, "natural-nation");
    assert.equal(mock.writes.length, 0);
  } finally { mock.restore(); }
});

test("allows AI to create a draft and writes registry plus audit", async () => {
  const mock = mockGithub();
  try {
    const response = await handleKnowledgeRecords(request("/v1/workspaces/natural-nation/knowledge-records", { action: "create-draft", title: "Launch record" }, "ai-secret"), env(), "/v1/workspaces/natural-nation/knowledge-records");
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.record.status, "draft");
    assert.equal(payload.record.state, "approval-required");
    assert.equal(payload.record.approvalRequired, true);
    assert.equal(payload.record.createdBy, "ai-provider");
    assert.equal(mock.writes.length, 2);
  } finally { mock.restore(); }
});

test("blocks AI from protected approval actions with zero writes", async () => {
  const mock = mockGithub();
  try {
    const response = await handleKnowledgeRecords(request("/v1/workspaces/natural-nation/knowledge-records/KR-0001", { action: "approve" }, "ai-secret"), env(), "/v1/workspaces/natural-nation/knowledge-records/KR-0001");
    assert.equal(response.status, 403);
    assert.equal(mock.writes.length, 0);
  } finally { mock.restore(); }
});

test("requires approval before locking and performs zero writes", async () => {
  const mock = mockGithub();
  try {
    const response = await handleKnowledgeRecords(request("/v1/workspaces/natural-nation/knowledge-records/KR-0001", { action: "lock" }), env(), "/v1/workspaces/natural-nation/knowledge-records/KR-0001");
    const payload = await response.json();
    assert.equal(response.status, 409);
    assert.equal(payload.error.code, "KNOWLEDGE_ACTION_REJECTED");
    assert.equal(mock.writes.length, 0);
  } finally { mock.restore(); }
});

test("supersede rejects cross-workspace replacement with zero writes", async () => {
  const registry = structuredClone(REGISTRY);
  registry.records.push({ ...registry.records[0], recordId: "KR-0002", workspaceId: "founder-os", status: "current" });
  const mock = mockGithub(registry);
  try {
    const response = await handleKnowledgeRecords(request("/v1/workspaces/natural-nation/knowledge-records/KR-0001", { action: "supersede", replacementRecordId: "KR-0002" }), env(), "/v1/workspaces/natural-nation/knowledge-records/KR-0001");
    assert.equal(response.status, 409);
    assert.equal(mock.writes.length, 0);
  } finally { mock.restore(); }
});


test("keeps an AI link proposal pending until Founder approval", async () => {
  const mock = mockGithub();
  try {
    const response = await handleKnowledgeRecords(request(
      "/v1/workspaces/natural-nation/knowledge-records/KR-0001",
      { action: "propose-link", link: { type: "decision", targetId: "DEC-001", label: "Founder decision" } },
      "ai-secret"
    ), env(), "/v1/workspaces/natural-nation/knowledge-records/KR-0001");
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.record.state, "approval-required");
    assert.equal(payload.record.links.length, 0);
    assert.deepEqual(payload.record.proposedLinks, [{ type: "decision", targetId: "DEC-001", label: "Founder decision" }]);
    assert.equal(mock.writes.length, 2);
  } finally { mock.restore(); }
});

test("Founder approval promotes pending links and clears review state", async () => {
  const registry = structuredClone(REGISTRY);
  registry.records[0].approvalRequired = true;
  registry.records[0].proposedLinks = [{ type: "decision", targetId: "DEC-001", label: "Founder decision" }];
  const mock = mockGithub(registry);
  try {
    const response = await handleKnowledgeRecords(request(
      "/v1/workspaces/natural-nation/knowledge-records/KR-0001",
      { action: "approve" }
    ), env(), "/v1/workspaces/natural-nation/knowledge-records/KR-0001");
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.record.status, "current");
    assert.equal(payload.record.state, "current");
    assert.equal(payload.record.approvalRequired, false);
    assert.deepEqual(payload.record.proposedLinks, []);
    assert.deepEqual(payload.record.links, [{ type: "decision", targetId: "DEC-001", label: "Founder decision" }]);
    assert.equal(payload.record.approvedBy, "founder");
    assert.equal(mock.writes.length, 2);
  } finally { mock.restore(); }
});

test("AI draft edits remain queued for Founder review", async () => {
  const mock = mockGithub();
  try {
    const response = await handleKnowledgeRecords(request(
      "/v1/workspaces/natural-nation/knowledge-records/KR-0001",
      { action: "edit-draft", summary: "Updated by AI" },
      "ai-secret"
    ), env(), "/v1/workspaces/natural-nation/knowledge-records/KR-0001");
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.record.summary, "Updated by AI");
    assert.equal(payload.record.state, "approval-required");
    assert.equal(payload.record.approvalRequired, true);
    assert.equal(mock.writes.length, 2);
  } finally { mock.restore(); }
});
