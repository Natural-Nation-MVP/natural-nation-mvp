---
workspaceId: founder-os
knowledgeBaseId: founder-os-kb
recordType: operations
status: approved
source: docs/founder-os/knowledge/ai-operations.md
---

# KB-FOUNDER-006 — AI Operations

AI Operations coordinates the Founder OS AI workforce, handoffs, approvals, provider readiness, execution evidence, and context-loading standards.

## Founder OS Roles

- Art: architecture, systems, standards, and implementation direction
- Codex: implementation and technical delivery
- Gemini: design and UX review
- GPose: planning, prompts, summaries, and Founder-facing coordination
- Founder: approval for locked decisions and release closeout

Duey belongs to the Natural Nation workspace and must not be loaded as Founder OS operating context unless the Founder explicitly requests cross-workspace access.

## Isolation Rule

Every AI task must load the active workspace identity and matching knowledge-base ID before retrieval. Unscoped context and records owned by another workspace must be rejected.

## Canonical Inputs

- `docs/founder-os/knowledge/INDEX.md`
- `docs/ai/AI-HANDOFF-STANDARD.md`
- `docs/governance/SYNC-STANDARD.md`
- Founder OS decisions, releases, repository, and audit records

## Related

- [Operating Model](./operating-model-v1.md)
- [Source of Truth](./source-of-truth.md)