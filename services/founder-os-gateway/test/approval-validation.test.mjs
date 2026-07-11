import assert from "node:assert/strict";
import test from "node:test";

import { validateApprovalRequest } from "../src/lib/blueprint-validation.js";

const route = {
  workspaceId: "natural-nation",
  blueprintVersion: "0.2.0-draft"
};

function validRequest(overrides = {}) {
  return {
    workspaceId: "natural-nation",
    blueprintVersion: "0.2.0-draft",
    decisionResolutions: {
      "billing-mvp": "excluded-from-mvp"
    },
    confirmation: {
      approved: true,
      effectAcknowledged: true
    },
    clientRequestId: "request-0001",
    ...overrides
  };
}

test("accepts a complete Natural Nation approval request", () => {
  assert.deepEqual(validateApprovalRequest(validRequest(), route), []);
});

test("blocks an unresolved billing decision", () => {
  const blockers = validateApprovalRequest(
    validRequest({ decisionResolutions: {} }),
    route
  );

  assert.equal(blockers.some((item) => item.code === "UNRESOLVED_DECISION"), true);
});

test("blocks missing Founder confirmation", () => {
  const blockers = validateApprovalRequest(
    validRequest({ confirmation: { approved: false, effectAcknowledged: false } }),
    route
  );

  assert.equal(blockers.some((item) => item.code === "CONFIRMATION_REQUIRED"), true);
});

test("blocks route and request workspace mismatch", () => {
  const blockers = validateApprovalRequest(
    validRequest({ workspaceId: "founder-os" }),
    route
  );

  assert.equal(blockers.some((item) => item.code === "WORKSPACE_MISMATCH"), true);
});
