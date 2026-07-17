# FOS-RUNTIME-001 — Founder Walkthrough

## Purpose

This package converts the completed Founder OS foundation into the first executable runtime contract.

## Governed request flow

1. A request receives a unique request and correlation ID.
2. Founder OS resolves exactly one workspace.
3. Cross-workspace references are rejected.
4. The action is classified as routine, strategic, destructive, financial, security-sensitive, or external.
5. Policy, authority, approval, budget, connector, and workflow requirements are checked.
6. The runtime dispatches only a registered workflow.
7. Evidence and verification are captured before consequential success is recorded.
8. Cost is reconciled and audit, health, and notification events are emitted.

## Founder experience

Routine work within approved limits may proceed automatically. Strategic, destructive, security-sensitive, consequential financial, and policy-defined external work remains blocked until the exact action and payload are approved.

Changing the payload after approval invalidates the approval binding. Retrying consequential work requires the same valid approval and an idempotent handler.

## Workspace examples

Natural Nation runs blueprint experience verification inside `workspace-natural-nation`. Contractor Estimator prepares a draft estimate inside `workspace-contractor-estimator`. Neither request can read, write, reference, or reuse execution context from the other workspace.

## Validation

Run:

```bash
node scripts/validate-runtime-backbone.mjs
```

## Constitutional boundary

This package does not modify authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or other FOS-DIRECTIVE-001 protected systems.
