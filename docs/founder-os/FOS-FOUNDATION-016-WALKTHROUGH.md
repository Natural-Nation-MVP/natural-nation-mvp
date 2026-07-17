# FOS-FOUNDATION-016 — Policy, Approval, Delegation, and Authority Engine

Founder OS now evaluates every proposed action against constitutional, platform-security, Founder-global, workspace, workflow, and task policies in that order.

## Exact approval binding
An approval is tied to one workspace, action, payload hash, evidence set, and expiration time. Changing the recipient, price, code SHA, attachment, or destination invalidates the approval.

## Natural Nation
Routine validation may run autonomously. A GitHub merge requires Founder approval supported by the exact head SHA, validation report, and diff summary.

## Contractor Estimator
Reading supplier prices may be delegated within a defined limit. Sending the final estimate requires approval of the exact recipient, estimate version, total, and attachment hash.

## Guardrails
Lower-level policy cannot override a constitutional or security denial. Expired, revoked, cross-workspace, reused, or evidence-incomplete approvals are blocked. Emergency mode cannot weaken authentication, authorization, secrets, or access control.

## Validation
```bash
node scripts/validate-policy-engine.mjs
```
