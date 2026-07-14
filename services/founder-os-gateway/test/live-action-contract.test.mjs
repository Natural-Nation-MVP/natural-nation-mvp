import assert from "node:assert/strict";
import test from "node:test";

import { validateApprovalRequest } from "../src/lib/blueprint-validation.js";

const route = {
  workspaceId: "natural-nation",
  blueprintVersion: "0.2.0-draft"
};

function request(overrides = {}) {
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
    clientRequestId: "nn-live-action-contract-0001",
    dryRun: true,
    ...overrides
  };
}

test("live dry run request passes validation with billing excluded", () => {
  assert.deepEqual(validateApprovalRequest(request(), route), []);
});

test("live approval request passes validation with the same stable request id", () => {
  assert.deepEqual(validateApprovalRequest(request({ dryRun: false }), route), []);
});

test("live action remains blocked when billing has not been resolved", () => {
  const blockers = validateApprovalRequest(
    request({ decisionResolutions: { "billing-mvp": "pending" } }),
    route
  );

  assert.equal(blockers.some((blocker) => blocker.code === "UNRESOLVED_DECISION"), true);
});

test("live action remains blocked without explicit Founder confirmation", () => {
  const blockers = validateApprovalRequest(
    request({ confirmation: { approved: false, effectAcknowledged: false } }),
    route
  );

  assert.equal(blockers.some((blocker) => blocker.code === "CONFIRMATION_REQUIRED"), true);
});
