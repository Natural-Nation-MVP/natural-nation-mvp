# FOS-RUNTIME-003 Founder Walkthrough

This package adds durable runtime tables and a workspace-scoped repository contract for runs, approval bindings, evidence, audit/observability/cost events, retries, and recovery checkpoints.

Composite foreign keys require the same `workspace_id` on parent and child records, preventing cross-workspace references. Idempotency is unique per workspace. Secrets and raw protected payloads are not persisted.

## Validate

```bash
node scripts/validate-runtime-persistence.mjs
```

Production migration should run through the release-governance package with backup, rollback, and post-migration verification evidence.