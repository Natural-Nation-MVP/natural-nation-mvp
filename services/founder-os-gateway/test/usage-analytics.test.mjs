import test from "node:test";
import assert from "node:assert/strict";
import { activeUsage, detectUsageAlerts, handleUsageAnalytics, summarizeUsage } from "../src/routes/usage-analytics.js";

const usageRegistry = {
  policyRef: "docs/founder-os/config/usage-optimization-policy.json",
  historicalCoverage: { status: "unmetered" },
  records: [
    { usageId:"U1", workspaceId:"natural-nation", provider:"openai", model:"gpt-5", roleId:"art", requests:1, tokens:{ input:80, output:20, total:100, cached:25 }, optimization:{ retryCount:0, fallbackUsed:false } },
    { usageId:"U2", workspaceId:"natural-nation", provider:"google", model:"gemini-2.5-flash", roleId:"gemini", requests:2, tokens:{ input:40, output:10, total:50, cached:0 }, optimization:{ retryCount:1, fallbackUsed:true } },
    { usageId:"U3", workspaceId:"founder-os", provider:"openai", model:"gpt-5", roleId:"codex", requests:1, tokens:{ input:20, output:10, total:30, cached:0 }, optimization:{ retryCount:0, fallbackUsed:false } }
  ]
};

const evidenceRegistry = { records:[
  { workspaceId:"natural-nation", cost:{ amount:0.12 } },
  { workspaceId:"founder-os", cost:{ amount:0.03 } }
] };

const orchestrationState = {
  workspaceId:"natural-nation", packageId:"NN-BUILD-001", tasks:[
    { id:"AI-TASK-001", workspaceId:"natural-nation", packageId:"NN-BUILD-001", title:"Active provider review", owner:"gemini", status:"working", providerStatus:"running", startedAt:"2026-08-27T11:00:00.000Z" },
    { id:"AI-TASK-002", workspaceId:"natural-nation", packageId:"NN-BUILD-001", title:"Completed work", owner:"codex", status:"complete", providerStatus:"result-verified", startedAt:"2026-08-27T10:00:00.000Z" }
  ]
};
const agentRegistry = { agents:[{ id:"gemini", provider:"google" }, { id:"codex", provider:"openai" }] };

function env() {
  return { FOUNDER_API_KEY:"founder-test", GITHUB_TOKEN:"token", GITHUB_OWNER:"Natural-Nation-MVP", GITHUB_REPOSITORY:"natural-nation-mvp", GITHUB_BRANCH:"main" };
}

const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; });

function installRepositoryFetch() {
  globalThis.fetch = async (url) => {
    const value = String(url);
    const body = value.includes("usage-records.json") ? usageRegistry : value.includes("evidence-records.json") ? evidenceRegistry : value.includes("ai-agent-registry.json") ? agentRegistry : orchestrationState;
    return new Response(JSON.stringify({ type:"file", sha:"registry-sha", content:Buffer.from(JSON.stringify(body), "utf8").toString("base64") }), { status:200, headers:{ "content-type":"application/json" } });
  };
}

test("summarizes tokens, cache reuse, retries, fallback, cost, and highest provider", () => {
  const summary = summarizeUsage(usageRegistry.records.slice(0, 2), evidenceRegistry.records.slice(0, 1));
  assert.equal(summary.requests, 3);
  assert.equal(summary.tokens, 150);
  assert.equal(summary.cachedTokens, 25);
  assert.equal(summary.cacheRate, 16.7);
  assert.equal(summary.retries, 1);
  assert.equal(summary.fallbacks, 1);
  assert.equal(summary.recordedCost, 0.12);
  assert.equal(summary.highestUsage.label, "openai");
});

test("requires Founder authentication", async () => {
  const request = new Request("https://gateway.test/v1/workspaces/founder-os/usage-analytics");
  const response = await handleUsageAnalytics(request, env(), "/v1/workspaces/founder-os/usage-analytics");
  assert.equal(response.status, 401);
});

test("public live analytics are read-only and omit exact records", async () => {
  installRepositoryFetch();
  const request = new Request("https://gateway.test/v1/public/usage-analytics?workspaceId=founder-os");
  const response = await handleUsageAnalytics(request, env(), "/v1/public/usage-analytics");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.live, true);
  assert.equal(body.readOnly, true);
  assert.equal(body.active.length, 1);
  assert.equal(body.active[0].provider, "google");
  assert.equal(body.records, undefined);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("detects long-running work, retries, fallback, and provider concentration", () => {
  const active = activeUsage(orchestrationState, "founder-os", new Date("2026-08-27T11:20:00.000Z"));
  const summary = {
    requests:10, tokens:2000, cachedTokens:0, cacheRate:0, retries:2, fallbacks:1,
    highestUsage:{ label:"openai", tokens:1600 }
  };
  const alerts = detectUsageAlerts(summary, [{ date:"2026-08-26", requests:2, tokens:500 }, { date:"2026-08-27", requests:8, tokens:2000 }], active);
  const codes = alerts.map((alert) => alert.code);
  assert(codes.includes("RETRY_RATE"));
  assert(codes.includes("LOW_CACHE_REUSE"));
  assert(codes.includes("PROVIDER_FALLBACK"));
  assert(codes.includes("PROVIDER_CONCENTRATION"));
  assert(codes.includes("LONG_RUNNING_TASK"));
  assert(codes.includes("USAGE_SPIKE"));
});

test("Founder OS receives portfolio analytics while product workspaces remain isolated", async () => {
  installRepositoryFetch();
  const founderRequest = new Request("https://gateway.test/v1/workspaces/founder-os/usage-analytics", { headers:{ authorization:"Bearer founder-test" } });
  const founderResponse = await handleUsageAnalytics(founderRequest, env(), "/v1/workspaces/founder-os/usage-analytics");
  const founderBody = await founderResponse.json();
  assert.equal(founderBody.scope, "portfolio");
  assert.equal(founderBody.records.length, 3);
  assert.equal(founderBody.summary.tokens, 180);

  installRepositoryFetch();
  const productRequest = new Request("https://gateway.test/v1/workspaces/natural-nation/usage-analytics", { headers:{ authorization:"Bearer founder-test" } });
  const productResponse = await handleUsageAnalytics(productRequest, env(), "/v1/workspaces/natural-nation/usage-analytics");
  const productBody = await productResponse.json();
  assert.equal(productBody.scope, "workspace");
  assert.equal(productBody.records.length, 2);
  assert(productBody.records.every((record) => record.workspaceId === "natural-nation"));
  assert.equal(productBody.summary.recordedCost, 0.12);
});
