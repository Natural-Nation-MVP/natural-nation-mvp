---
workspaceId: founder-os
knowledgeBaseId: founder-os-kb
recordType: governance
status: locked
source: docs/founder-os/knowledge/source-of-truth.md
---

# KB-FOUNDER-007 — Founder OS Single Source of Truth Standard

## Core Rule

Every record has exactly one canonical workspace owner. Founder OS references records owned by another workspace; it does not silently copy or retrieve them.

## Founder OS Ownership

Founder OS owns system architecture, workspace lifecycle, AI orchestration, Gateway operations, repository intelligence, Founder OS UX, system governance, audits, and operational releases.

Product requirements, product design, assets, onboarding, protocols, mentor behavior, and product implementation records belong to their respective product workspaces.

## Required Reference Metadata

- title
- status
- workspace ID
- knowledge-base ID
- canonical path
- record type
- source
- related decision or validation evidence

## Retrieval Rule

1. Resolve the active workspace.
2. Resolve its knowledge-base ID.
3. Search only matching records.
4. Reject unscoped or foreign records.
5. Allow cross-workspace access only through an explicit Founder action with visible source attribution.

## Implementation Principle

Founder OS is a graph of workspace-scoped references, not a shared container of duplicated product documents.

## Related

- [Operating Model](./operating-model-v1.md)
- [Mission Control](./mission-control.md)
- [AI Operations](./ai-operations.md)