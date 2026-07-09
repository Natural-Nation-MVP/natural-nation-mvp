# Founder OS Decision Ledger

Status: Active

## Purpose

The Decision Ledger records Founder approval events without duplicating the full source documents. Each decision points back to the canonical source of truth.

## Ledger Rules

- Record approvals as events.
- Reference canonical documents instead of copying them.
- Include affected workspace, release, status, and related commits when known.
- Use ADRs for architecture decisions that require fuller explanation.

## Decisions

| ID | Decision | Release | Workspace | Status | Canonical Source |
| --- | --- | --- | --- | --- | --- |
| DL-001 | GitHub is the canonical source of truth for Natural Nation and Founder OS | R3 | Governance | Approved | docs/governance/NNOS-GOV-001.md |
| DL-002 | Continuous synchronization standard approved | R3 | Governance | Approved | docs/governance/SYNC-STANDARD.md |
| DL-003 | Founder OS Operating Model v1 approved | R3 | Founder OS | Approved | docs/knowledge/founder-os/operating-model-v1.md |
| DL-004 | Mission Control v1 foundation approved | R3 | Mission Control | Approved | docs/knowledge/founder-os/mission-control.md |
| DL-005 | AI Operations foundation approved | R3 | AI Operations | Approved | docs/knowledge/founder-os/ai-operations.md |
| DL-006 | Single Source of Truth standard approved | R3 | Founder OS | Approved | docs/knowledge/founder-os/source-of-truth.md |

## Related Records

- docs/knowledge/founder-os/source-of-truth.md
- docs/knowledge/founder-os/operating-model-v1.md
- docs/governance/SYNC-STANDARD.md
