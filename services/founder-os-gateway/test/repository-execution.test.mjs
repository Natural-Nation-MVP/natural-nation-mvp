import assert from "node:assert/strict";
import test from "node:test";
import { executeRepositoryPlan } from "../src/lib/repository-execution.js";

const env = {
  GITHUB_TOKEN: "test-token",
  GITHUB_OWNER: "Natural-Nation-MVP",
  GITHUB_REPOSITORY: "natural-nation-mvp",
  GITHUB_BRANCH: "main"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("Codex repository execution creates real branch, commit, PR, and evidence", async () => {
  const calls = [];
  let blobCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const method = options.method || "GET";
    calls.push({ url: String(url), method, body: options.body || null });

    if (method === "GET" && String(url).includes("/git/ref/heads/main")) {
      return jsonResponse({ object: { sha: "base-sha" } });
    }
    if (method === "POST" && String(url).endsWith("/git/refs")) return jsonResponse({ ref: "created" }, 201);
    if (method === "GET" && String(url).includes("/git/ref/heads/codex%2F")) {
      return jsonResponse({ object: { sha: "base-sha" } });
    }
    if (method === "GET" && String(url).endsWith("/git/commits/base-sha")) {
      return jsonResponse({ tree: { sha: "base-tree" } });
    }
    if (method === "POST" && String(url).endsWith("/git/blobs")) {
      blobCount += 1;
      return jsonResponse({ sha: `blob-${blobCount}` }, 201);
    }
    if (method === "POST" && String(url).endsWith("/git/trees")) return jsonResponse({ sha: "new-tree" }, 201);
    if (method === "POST" && String(url).endsWith("/git/commits")) {
      return jsonResponse({ sha: "head-sha", html_url: "https://github.com/Natural-Nation-MVP/natural-nation-mvp/commit/head-sha" }, 201);
    }
    if (method === "PATCH" && String(url).includes("/git/refs/heads/codex%2F")) return jsonResponse({ object: { sha: "head-sha" } });
    if (method === "POST" && String(url).endsWith("/pulls")) {
      return jsonResponse({
        number: 20,
        html_url: "https://github.com/Natural-Nation-MVP/natural-nation-mvp/pull/20",
        state: "open",
        head: { sha: "head-sha" },
        base: { ref: "main" }
      }, 201);
    }
    if (method === "GET" && String(url).endsWith("/pulls/20")) {
      return jsonResponse({
        number: 20,
        html_url: "https://github.com/Natural-Nation-MVP/natural-nation-mvp/pull/20",
        state: "open",
        merged: false,
        head: { ref: "codex/ai-task-002-test", sha: "head-sha" },
        base: { ref: "main" }
      });
    }
    if (method === "GET" && String(url).includes("/pulls/20/files")) {
      return jsonResponse([{ filename: "services/founder-os-gateway/src/lib/repository-execution.js" }]);
    }
    return jsonResponse({ message: `Unhandled ${method} ${url}` }, 500);
  };

  try {
    const result = await executeRepositoryPlan({
      env,
      workspaceId: "natural-nation",
      packageId: "NN-BUILD-001",
      taskId: "AI-TASK-002",
      actor: { id: "founder" },
      plan: {
        title: "Implement repository execution adapter",
        summary: "Adds guarded GitHub branch, commit, and pull-request execution.",
        files: [{
          path: "services/founder-os-gateway/src/lib/repository-execution.js",
          content: "export const ready = true;\n"
        }]
      }
    });

    assert.equal(result.pullRequest.url, "https://github.com/Natural-Nation-MVP/natural-nation-mvp/pull/20");
    assert.equal(result.pullRequest.headSha, "head-sha");
    assert.deepEqual(result.pullRequest.changedFiles, ["services/founder-os-gateway/src/lib/repository-execution.js"]);
    assert.equal(result.verification.realPullRequest, true);
    assert.equal(result.verification.founderMergeRequired, true);
    assert.equal(result.verification.productionDeploymentAuthorized, false);
    assert(calls.some((call) => call.method === "POST" && call.url.endsWith("/pulls")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("repository execution rejects paths outside approved roots", async () => {
  await assert.rejects(
    executeRepositoryPlan({
      env,
      workspaceId: "natural-nation",
      packageId: "NN-BUILD-001",
      taskId: "AI-TASK-002",
      actor: { id: "founder" },
      plan: {
        title: "Unsafe change",
        summary: "Must be rejected.",
        files: [{ path: ".github/workflows/unsafe.yml", content: "name: unsafe\n" }]
      }
    }),
    /outside approved roots/
  );
});
