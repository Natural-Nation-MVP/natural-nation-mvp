# KB-FOUNDER-003 — Repository Intelligence

Status: Founder Approved

## Purpose

Repository Intelligence gives Founder OS visibility into project repository health, synchronization state, canonical records, active milestones, source-of-truth alignment, and next Founder actions.

## Runtime Scope

Repository Intelligence currently surfaces:

- repository health
- canonical runtime path
- Knowledge Base status
- Single Source of Truth status
- Decision Ledger status
- Validation Center status
- synchronization checklist
- repository risk snapshot
- next Founder actions

## SSOT Health Checks

Repository Intelligence should help answer:

- What is synchronized?
- What is out of sync?
- What changed in the repository and knowledge base?
- Which validation records are pending?
- Which decisions are recorded?
- Is Founder OS using canonical references instead of duplicate content?

## Workspace Action Rule

The Generate Package sticky bottom bar belongs to Build Studio only.

For non-build workspaces, the Build Studio action bar should be hidden or replaced with a workspace-specific action model.

Current implementation hides the bottom action bar outside Build Studio.

## Canonical Inputs

- docs/PROJECT_STATE.md
- docs/SESSION-LOG.md
- docs/releases/RELEASE-3-ROADMAP.md
- docs/releases/VALIDATION-CENTER.md
- docs/decisions/DECISION-LEDGER.md
- docs/knowledge/INDEX.md
- docs/knowledge/founder-os/source-of-truth.md
- docs/governance/SYNC-STANDARD.md
- docs/founder-os/R3-REPOSITORY-INTELLIGENCE.md

## Runtime Helpers

- docs/founder-os/js/repository-intelligence.js
- docs/founder-os/js/build-studio-polish.js

## Related

- docs/knowledge/founder-os/architecture.md
- docs/knowledge/founder-os/source-of-truth.md
- docs/knowledge/INDEX.md
- docs/knowledge/ai/context-loading-standard.md
