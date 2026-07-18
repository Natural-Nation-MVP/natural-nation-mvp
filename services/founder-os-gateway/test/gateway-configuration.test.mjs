import assert from "node:assert/strict";
import test from "node:test";

import { gatewayConfiguration } from "../src/index.js";

const requiredBindings = {
  FOUNDER_API_KEY: "founder-test",
  GITHUB_TOKEN: "github-test",
  GITHUB_OWNER: "Natural-Nation-MVP",
  GITHUB_REPOSITORY: "natural-nation-mvp",
  GITHUB_BRANCH: "main",
  FOUNDER_OS_RUNTIME_STORE: {
    async get() { return null; },
    async put() {}
  }
};

test("direct-provider deployments are configured without optional legacy callback bindings", () => {
  const configuration = gatewayConfiguration({
    ...requiredBindings,
    GOOGLE_AI_API_KEY: "google-test"
  });

  assert.equal(configuration.configured, true);
  assert.equal(configuration.directProviderReady, true);
  assert.equal(configuration.required.runtimeStore, true);
  assert.equal(configuration.optionalLegacy.aiCallbackAuthentication, false);
  assert.equal(configuration.optionalLegacy.gatewayPublicUrl, false);
});

test("at least one direct provider is required", () => {
  const configuration = gatewayConfiguration(requiredBindings);

  assert.equal(configuration.configured, false);
  assert.equal(configuration.directProviderReady, false);
});

test("missing canonical repository bindings keeps the gateway unconfigured", () => {
  const configuration = gatewayConfiguration({
    FOUNDER_API_KEY: "founder-test",
    GOOGLE_AI_API_KEY: "google-test",
    FOUNDER_OS_RUNTIME_STORE: requiredBindings.FOUNDER_OS_RUNTIME_STORE
  });

  assert.equal(configuration.configured, false);
  assert.equal(configuration.directProviderReady, true);
});

test("missing durable runtime store keeps live workflow deployment unconfigured", () => {
  const { FOUNDER_OS_RUNTIME_STORE, ...withoutRuntimeStore } = requiredBindings;
  const configuration = gatewayConfiguration({
    ...withoutRuntimeStore,
    GOOGLE_AI_API_KEY: "google-test"
  });

  assert.equal(configuration.configured, false);
  assert.equal(configuration.required.runtimeStore, false);
});
