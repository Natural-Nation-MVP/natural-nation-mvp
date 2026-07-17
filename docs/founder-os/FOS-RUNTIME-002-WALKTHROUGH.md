# FOS-RUNTIME-002 Founder Walkthrough

The executable runtime now accepts a workspace-scoped request, validates the workspace and registered workflow, blocks protected payloads, evaluates policy, verifies exact approval bindings when required, dispatches the workflow with bounded retries, captures evidence, emits audit/observability/cost events, and returns an idempotent result.

## Validate

```bash
node scripts/validate-runtime-service.mjs
```

The validator proves successful Natural Nation execution, idempotent replay, cross-workspace denial, protected-payload denial, changed-payload approval invalidation, health reporting, and required event emissions.

No authentication, authorization, secrets, access control, or preventative-security control is changed.