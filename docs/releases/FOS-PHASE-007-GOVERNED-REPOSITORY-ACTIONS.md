# FOS Phase 7 — Governed Repository Actions

Status: Implementation candidate  
Tracking: #107  
Founder scope approval: 2026-09-01

## Approved post-beta operating model

Founder OS uses lightweight repository governance during post-beta development. The governed AI credential may prepare routine, reversible work by creating a branch, commit, and pull request inside the approved Natural Nation package.

Founder approval remains required for merges, production deployments, public releases, destructive operations, major product or architecture changes, and changes involving authentication, authorization, secrets, billing, payments, or release infrastructure.

## Implemented boundary

- Every repository plan is classified before a GitHub write.
- Routine preparation is labeled `delegated-routine` and may use the `repository:prepare` permission.
- Consequential or sensitive preparation is labeled `founder-required` and stops before mutation without Founder authentication.
- Pull-request merge, production deployment, publication, and repository deletion are outside the delegated capability.
- The action class, consequence, actor, changed files, branch, commit, and pull request remain in the execution evidence.

## Preserved controls

- Natural Nation workspace and `NN-BUILD-001` package isolation remain unchanged.
- Path traversal and unapproved repository roots remain blocked.
- CI must pass before merge.
- Merge and production deployment remain Founder-controlled.
- No secret value is written to repository evidence.
