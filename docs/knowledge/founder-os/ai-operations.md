# KB-FOUNDER-006 — AI Operations

Status: Founder Approved

## Purpose

AI Operations coordinates the AI workforce inside Founder OS. It shows who owns what, which handoffs are active, what is waiting on Founder approval, and which operating standards apply before and after AI work.

## Runtime Scope

AI Operations currently surfaces:

- AI agent registry
- current agent status
- current agent scope
- active initiatives
- AI handoff queue
- Founder approval queue
- operating standards
- context loading requirements
- continuous synchronization requirements
- Single Source of Truth requirements

## AI Roles

- Art: architecture, systems, standards, ADRs, and approved implementation direction
- Codex: implementation and technical delivery
- Gemini: design review and UX validation
- GPose: prompts, summaries, planning, and founder-facing documentation
- Duey: wellness knowledge and mentor behavior
- Founder: final approval for locked decisions, validations, and release closeout

## AI Operations Questions

AI Operations should help answer:

1. Which AI owns each active initiative?
2. What is each AI currently working on?
3. What handoffs are waiting?
4. Which Founder approvals are blocking progress?
5. What context must be loaded before work begins?

## Single Source of Truth Rule

AI Operations should reference canonical records and current validation state. It should not duplicate full project documents, workspace specs, or release records.

## Canonical Inputs

- docs/knowledge/INDEX.md
- docs/PROJECT_STATE.md
- docs/SESSION-LOG.md
- docs/releases/RELEASE-3-ROADMAP.md
- docs/releases/RELEASE-3-VALIDATION.md
- docs/releases/VALIDATION-CENTER.md
- docs/decisions/DECISION-LEDGER.md
- docs/knowledge/founder-os/source-of-truth.md
- docs/knowledge/ai/context-loading-standard.md
- docs/ai/AI-HANDOFF-STANDARD.md
- docs/governance/SYNC-STANDARD.md

## Runtime Helper

- docs/founder-os/js/ai-operations.js

## Related

- docs/knowledge/founder-os/operating-model-v1.md
- docs/knowledge/founder-os/source-of-truth.md
- docs/knowledge/ai/context-loading-standard.md
- docs/build-packages/
