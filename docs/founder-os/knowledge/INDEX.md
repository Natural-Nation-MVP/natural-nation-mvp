# NN-KS-003 — Founder OS Knowledge Base Index

Status: Founder Approved
Knowledge Base ID: `founder-os-kb`
Workspace ID: `founder-os`

## Purpose

This is the canonical knowledge entry point for Founder OS only. It contains Founder OS architecture, workspace lifecycle, AI orchestration, repository operations, gateway operations, releases, audits, UX decisions, and system governance.

Natural Nation product knowledge is explicitly excluded.

## Isolation Rule

Every record loaded through this index must match both:

- `workspaceId: founder-os`
- `knowledgeBaseId: founder-os-kb`

No Natural Nation, Duey, wellness, nutrition, onboarding, protocol, or product-design record may be loaded unless the Founder explicitly initiates a cross-workspace search.

## Canonical Founder OS Records

- [Architecture](../../knowledge/founder-os/architecture.md)
- [Repository Intelligence](../../knowledge/founder-os/repository-intelligence.md)
- [Mission Control](../../knowledge/founder-os/mission-control.md)
- [Operating Model](../../knowledge/founder-os/operating-model-v1.md)
- [AI Operations](../../knowledge/founder-os/ai-operations.md)
- [Source of Truth Standard](../../knowledge/founder-os/source-of-truth.md)
- [Founder OS Domain Index](../../knowledge/founder-os/README.md)

## Required Record Metadata

Every new Founder OS knowledge record must declare:

```yaml
workspaceId: founder-os
knowledgeBaseId: founder-os-kb
recordType: architecture|decision|governance|operations|ux|release|audit|repository|gateway
status: draft|approved|locked|deprecated
source: repository-path-or-authoritative-system
```

## Retrieval Contract

1. Resolve the active workspace.
2. Resolve that workspace's knowledge base ID.
3. Search only records matching both IDs.
4. Reject unscoped records.
5. Reject records owned by another workspace.
6. Permit cross-workspace search only after an explicit Founder action.

## Governance

This index supersedes the previous practice of using the Natural Nation knowledge index as Founder OS operating memory.
