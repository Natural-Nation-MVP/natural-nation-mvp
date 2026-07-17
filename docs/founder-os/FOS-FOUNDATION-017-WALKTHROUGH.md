# FOS-FOUNDATION-017 — Release and Deployment Governance

Founder OS now treats a release candidate as an immutable, workspace-scoped package with an artifact hash, change summary, validation evidence, migration plan, deployment window, rollback plan, and post-deployment checks.

## Promotion
Development may promote to preview and staging when registered gates pass. Production requires Founder approval bound to the exact candidate hash. Any code, configuration, migration, destination, or security change creates a new candidate and invalidates prior approval.

## Natural Nation
The production candidate verifies build health, workspace isolation, rollback readiness, onboarding smoke tests, and Duey response health before and after deployment.

## Contractor Estimator
A staging preview can deploy autonomously after its gates pass. Production still requires Founder approval.

## Failure behavior
Failed gates block promotion. Failed post-deploy checks open an incident and present the tested rollback action. Rollback runs through the governed execution runtime and registered connector.

## Validation
```bash
node scripts/validate-release-governance.mjs
```
