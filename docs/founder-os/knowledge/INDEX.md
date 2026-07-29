---
workspaceId: founder-os
knowledgeBaseId: founder-os-kb
recordType: governance
status: locked
source: docs/founder-os/knowledge/INDEX.md
---

# NN-KS-003 — Founder OS Knowledge Base Index

This is the canonical and physically isolated knowledge entry point for Founder OS.

## Identity

- Workspace ID: `founder-os`
- Knowledge Base ID: `founder-os-kb`
- Physical root: `docs/founder-os/knowledge/`

## Scope

Included: Founder OS architecture, workspace lifecycle, AI orchestration, repository and Gateway operations, Founder OS UX, system governance, releases, audits, decisions, and operational standards.

Excluded: Natural Nation product requirements, Duey, wellness, nutrition, onboarding, protocols, product design, and product assets.

## Canonical Records

- [Domain Overview](./README.md)
- [Architecture](./architecture.md)
- [Repository Intelligence](./repository-intelligence.md)
- [Mission Control](./mission-control.md)
- [Operating Model](./operating-model-v1.md)
- [AI Operations](./ai-operations.md)
- [Source of Truth Standard](./source-of-truth.md)

## Required Metadata

Every Founder OS record must declare `workspaceId: founder-os`, `knowledgeBaseId: founder-os-kb`, record type, status, and source.

## Retrieval Contract

1. Resolve the active workspace.
2. Require `workspaceId: founder-os`.
3. Require `knowledgeBaseId: founder-os-kb`.
4. Search only within this physical knowledge root and explicitly registered Founder OS sources.
5. Reject unscoped or foreign records.
6. Permit cross-workspace retrieval only after an explicit Founder action with visible attribution.

## Separation Status

The former `docs/knowledge/founder-os/` mixed-location domain has been migrated out of the Natural Nation knowledge tree and removed. This directory is now the sole canonical Founder OS knowledge root.