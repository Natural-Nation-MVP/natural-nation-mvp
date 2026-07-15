import assert from "node:assert/strict";
import test from "node:test";

import {
  deliverToProvider,
  providerReadiness
} from "../src/lib/ai-provider-adapters.js";

const dispatch = {
  dispatchId: "AI-DISPATCH-TEST",
  workspaceId: "natural-nation",
  packageId: "NN-BUILD-001",
  taskId: "AI-TASK-003",
  agentId: "gemini",
  requiredInput: "Working preview and acceptance criteria",
  expectedOutput: "Usability and responsive design findings",
  nextRole: "gpose"
};

function googleSuccess(text = "Design review complete.") {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text }] } }],
    modelVersion: "gemini-2.5-flash",
    usageMetadata: { totalTokenCount: 12 }
  }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

test("provider readiness is generated from registered provider secrets", () => {
  assert.deepEqual(
    providerReadiness({
      OPENAI_API_KEY: "openai-test",
      GOOGLE_AI_API_KEY: "google-test"
    }),
    {
      openai: true,
      google: true,
      callbackAuthentication: false,
      publicGatewayUrl: false
    }
  );
});

test("preferred Google delivery returns a synchronous completed result", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /generativelanguage\.googleapis\.com/);
    assert.equal(options.headers["x-goog-api-key"], "google-test");
    return googleSuccess();
  };

  const delivery = await deliverToProvider({
    env: { GOOGLE_AI_API_KEY: "google-test" },
    agent: { id: "gemini", name: "Gemini", provider: "google" },
    dispatch
  });

  assert.equal(delivery.delivered, true);
  assert.equal(delivery.synchronous, true);
  assert.equal(delivery.status, "delivered");
  assert.equal(delivery.fallbackUsed, false);
  assert.equal(delivery.executingProvider, "google");
  assert.equal(delivery.completedResult.dispatchId, dispatch.dispatchId);
  assert.equal(delivery.completedResult.summary, "Design review complete.");
});

test("OpenAI quota errors fail over to Google and preserve the routing audit", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const called = [];
  globalThis.fetch = async (url) => {
    called.push(String(url));
    if (String(url).includes("api.openai.com")) {
      return new Response(JSON.stringify({
        error: { message: "You exceeded your current quota.", code: "insufficient_quota" }
      }), {
        status: 429,
        headers: { "content-type": "application/json" }
      });
    }
    return googleSuccess("Architecture plan completed by fallback provider.");
  };

  const delivery = await deliverToProvider({
    env: {
      OPENAI_API_KEY: "openai-test",
      GOOGLE_AI_API_KEY: "google-test"
    },
    agent: { id: "art", name: "Art", provider: "openai" },
    dispatch: { ...dispatch, agentId: "art", taskId: "AI-TASK-001" }
  });

  assert.equal(called.length, 2);
  assert.equal(delivery.delivered, true);
  assert.equal(delivery.status, "delivered");
  assert.equal(delivery.preferredProvider, "openai");
  assert.equal(delivery.executingProvider, "google");
  assert.equal(delivery.fallbackUsed, true);
  assert.equal(delivery.fallbackReason, "QUOTA_EXCEEDED");
  assert.equal(delivery.attempts[0].provider, "openai");
  assert.equal(delivery.attempts[0].errorCategory, "QUOTA_EXCEEDED");
  assert.equal(delivery.attempts[1].provider, "google");
  assert.equal(delivery.attempts[1].status, "completed");
  assert.equal(delivery.completedResult.routing.executingProvider, "google");
});

test("authentication failures stop routing and do not try another provider", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({
      error: { message: "Invalid API key." }
    }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  };

  const delivery = await deliverToProvider({
    env: {
      OPENAI_API_KEY: "bad-openai-key",
      GOOGLE_AI_API_KEY: "google-test"
    },
    agent: { id: "art", name: "Art", provider: "openai" },
    dispatch: { ...dispatch, agentId: "art", taskId: "AI-TASK-001" }
  });

  assert.equal(calls, 1);
  assert.equal(delivery.delivered, false);
  assert.equal(delivery.status, "authentication-failed");
  assert.equal(delivery.attempts[0].errorCategory, "AUTHENTICATION_FAILED");
});
