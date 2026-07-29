---
workspaceId: founder-os
knowledgeBaseId: founder-os-kb
recordType: repository
status: approved
source: docs/founder-os/knowledge/repository-intelligence.md
---

# KB-FOUNDER-003 — Repository Intelligence

Repository Intelligence gives Founder OS visibility into repository health, synchronization, canonical records, active milestones, validation state, decisions, and next Founder actions.

## Responsibilities

- repository and deployment health
- canonical runtime path verification
- workspace knowledge-base isolation checks
- decision and validation traceability
- synchronization risks
- changed-file and release readiness summaries

## Isolation Requirement

Repository Intelligence must report knowledge state per workspace. It must never merge Founder OS and product-workspace records into one search or status result.

## Canonical Inputs

- `docs/founder-os/knowledge/INDEX.md`
- `docs/PROJECT_STATE.md`
- `docs/SESSION-LOG.md`
- `docs/releases/`
- `docs/decisions/`
- `docs/governance/`

## Related

- [Architecture](./architecture.md)
- [Source of Truth](./source-of-truth.md)