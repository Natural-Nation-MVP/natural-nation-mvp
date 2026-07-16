import assert from "node:assert/strict";
import test from "node:test";

import { deliverToProvider, providerReadiness } from "../src/lib/ai-provider-adapters.js";

const dispatch = {
  dispatchId: "AI-DISPATCH-TEST",
  workspaceId: "natural-nation",
  packageId: "NN-BUILD-001",
  taskId: "AI-TASK-003",
  agentId: "gemini",
  requiredInput: "Review app/frontend/index.html and app/frontend/src/App.js",
  expectedOutput: "A provider-native experience_review JSON object",
  nextRole: "gpose"
};

const artAgent = {
  id: "art",
  name: "Art",
  role: "Architecture Lead",
  purpose: "Defines system structure, boundaries, standards, and implementation plans.",
  provider: "openai",
  allowedActions: ["plan", "review-architecture", "prepare-handoff"],
  requiresFounderApprovalFor: ["architecture-lock", "production-standard-change"]
};

const experienceReview = {
  type: "experience_review",
  summary: "The responsive foundation was reviewed against the current task evidence.",
  passes: ["Semantic structure is present."],
  issues: ["Keyboard focus treatment needs confirmation."],
  mergeBlockers: [],
  recommendation: "changes_required",
  evidence: [{ path: "app/frontend/index.html", finding: "The viewport and document landmarks are present." }]
};

function googleSuccess(text = JSON.stringify(experienceReview)) {
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
  assert.deepEqual(providerReadiness({ OPENAI_API_KEY: "openai-test", GOOGLE_AI_API_KEY: "google-test" }), {
    openai: true,
    google: true,
    callbackAuthentication: false,
    publicGatewayUrl: false
  });
});

test("preferred Google delivery enforces and normalizes the experience review contract", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /generativelanguage\.googleapis\.com/);
    assert.equal(options.headers["x-goog-api-key"], "google-test");
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.responseMimeType, "application/json");
    assert.deepEqual(body.generationConfig.responseSchema.properties.type.enum, ["experience_review"]);
    assert(body.generationConfig.responseSchema.required.includes("mergeBlockers"));
    return googleSuccess();
  };

  const delivery = await deliverToProvider({
    env: { GOOGLE_AI_API_KEY: "google-test" },
    agent: {
      id: "gemini",
      name: "Gemini",
      role: "Design Review",
      purpose: "Reviews usability, visual quality, and responsive behavior.",
      provider: "google"
    },
    dispatch
  });

  assert.equal(delivery.delivered, true);
  assert.equal(delivery.synchronous, true);
  assert.equal(delivery.status, "delivered");
  assert.equal(delivery.fallbackUsed, false);
  assert.equal(delivery.temporaryRoleAssumption, false);
  assert.equal(delivery.executingProvider, "google");
  assert.equal(delivery.assignedRole.id, "gemini");
  assert.equal(delivery.completedResult.dispatchId, dispatch.dispatchId);
  assert.deepEqual(delivery.completedResult.structured, experienceReview);
  assert.deepEqual(JSON.parse(delivery.completedResult.summary), experienceReview);
  assert.equal(delivery.attempts[0].contract, "experience_review");
});

test("OpenAI quota errors let Google temporarily assume the Art role and preserve the audit", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  const called = [];
  let fallbackPrompt = "";
  globalThis.fetch = async (url, options) => {
    called.push(String(url));
    if (String(url).includes("api.openai.com")) {
      return new Response(JSON.stringify({ error: { message: "You exceeded your current quota.", code: "insufficient_quota" } }), {
        status: 429,
        headers: { "content-type": "application/json" }
      });
    }
    const body = JSON.parse(options.body);
    fallbackPrompt = body.contents[0].parts[0].text;
    return googleSuccess("Architecture plan completed by fallback provider acting as Art.");
  };

  const delivery = await deliverToProvider({
    env: { OPENAI_API_KEY: "openai-test", GOOGLE_AI_API_KEY: "google-test" },
    agent: artAgent,
    dispatch: { ...dispatch, agentId: "art", taskId: "AI-TASK-001" }
  });

  assert.equal(called.length, 2);
  assert.match(fallbackPrompt, /temporarily executing the Founder OS role "Art"/);
  assert.match(fallbackPrompt, /Architecture Lead/);
  assert.match(fallbackPrompt, /for this request only/);
  assert.equal(delivery.delivered, true);
  assert.equal(delivery.status, "delivered");
  assert.equal(delivery.assignedRole.id, "art");
  assert.equal(delivery.preferredProvider, "openai");
  assert.equal(delivery.executingProvider, "google");
  assert.equal(delivery.fallbackUsed, true);
  assert.equal(delivery.temporaryRoleAssumption, true);
  assert.equal(delivery.roleRelinquishedAfterCompletion, true);
  assert.equal(delivery.fallbackReason, "QUOTA_EXCEEDED");
  assert.equal(delivery.attempts[0].provider, "openai");
  assert.equal(delivery.attempts[0].assignedRole, "art");
  assert.equal(delivery.attempts[0].errorCategory, "QUOTA_EXCEEDED");
  assert.equal(delivery.attempts[1].provider, "google");
  assert.equal(delivery.attempts[1].assignedRole, "art");
  assert.equal(delivery.attempts[1].temporaryRoleAssumption, true);
  assert.equal(delivery.attempts[1].status, "completed");
  assert.equal(delivery.completedResult.routing.assignedRole.id, "art");
  assert.equal(delivery.completedResult.routing.executingProvider, "google");
  assert.equal(delivery.completedResult.routing.temporaryRoleAssumption, true);
  assert.equal(delivery.completedResult.routing.roleRelinquishedAfterCompletion, true);
});

test("authentication failures stop routing and do not allow another provider to assume the role", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: { message: "Invalid API key." } }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  };

  const delivery = await deliverToProvider({
    env: { OPENAI_API_KEY: "bad-openai-key", GOOGLE_AI_API_KEY: "google-test" },
    agent: artAgent,
    dispatch: { ...dispatch, agentId: "art", taskId: "AI-TASK-001" }
  });

  assert.equal(calls, 1);
  assert.equal(delivery.delivered, false);
  assert.equal(delivery.status, "authentication-failed");
  assert.equal(delivery.assignedRole.id, "art");
  assert.equal(delivery.attempts[0].errorCategory, "AUTHENTICATION_FAILED");
});

test("malformed structured output is classified and can fail over safely", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    if (String(url).includes("generativelanguage.googleapis.com")) return googleSuccess("not json");
    return new Response(JSON.stringify({ output_text: JSON.stringify(experienceReview), model: "gpt-5" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const delivery = await deliverToProvider({
    env: { GOOGLE_AI_API_KEY: "google-test", OPENAI_API_KEY: "openai-test" },
    agent: { id: "gemini", name: "Gemini", role: "Design Review", provider: "google" },
    dispatch
  });

  assert.equal(calls, 2);
  assert.equal(delivery.delivered, true);
  assert.equal(delivery.fallbackUsed, true);
  assert.equal(delivery.executingProvider, "openai");
  assert.equal(delivery.attempts[0].errorCategory, "INVALID_RESPONSE");
  assert.equal(delivery.attempts[1].status, "completed");
});
