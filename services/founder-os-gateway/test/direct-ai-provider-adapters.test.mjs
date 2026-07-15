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

test("provider readiness uses direct provider API keys", () => {
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

test("Google delivery returns a synchronous completed result", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /generativelanguage\.googleapis\.com/);
    assert.equal(options.headers["x-goog-api-key"], "google-test");

    return new Response(JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text: "Design review complete." }]
          }
        }
      ],
      modelVersion: "gemini-2.5-flash",
      usageMetadata: { totalTokenCount: 12 }
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const delivery = await deliverToProvider({
    env: { GOOGLE_AI_API_KEY: "google-test" },
    agent: { id: "gemini", name: "Gemini", provider: "google" },
    dispatch
  });

  assert.equal(delivery.delivered, true);
  assert.equal(delivery.synchronous, true);
  assert.equal(delivery.status, "delivered");
  assert.equal(delivery.completedResult.dispatchId, dispatch.dispatchId);
  assert.equal(delivery.completedResult.summary, "Design review complete.");
});

test("OpenAI quota errors are returned as delivery failures", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { message: "You exceeded your current quota." }
  }), {
    status: 429,
    headers: { "content-type": "application/json" }
  });

  const delivery = await deliverToProvider({
    env: { OPENAI_API_KEY: "openai-test" },
    agent: { id: "art", name: "Art", provider: "openai" },
    dispatch: { ...dispatch, agentId: "art", taskId: "AI-TASK-001" }
  });

  assert.equal(delivery.delivered, false);
  assert.equal(delivery.status, "delivery-failed");
  assert.equal(delivery.synchronous, true);
  assert.match(delivery.message, /quota/i);
});
