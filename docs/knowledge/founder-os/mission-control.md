# KB-FOUNDER-004 — Mission Control

Status: Founder Approved

## Purpose

Mission Control is the executive command center for Founder OS. It summarizes what requires Founder attention, release health, recent changes, pending decisions, active risks, and next actions using reference-based information from canonical records.

## Runtime Scope

Mission Control currently surfaces:

- project health
- Release 3 validation state
- validation progress
- repository synchronization status
- current initiative
- next milestone
- what requires Founder attention now
- what changed recently
- pending Founder decisions
- active risks

## Executive Questions

Mission Control should help answer:

1. What requires my attention right now?
2. Is Release 3 healthy?
3. What changed since my last session?
4. What decisions are waiting for me?
5. What should I do next?

## Single Source of Truth Rule

Mission Control should summarize and reference canonical records. It should not duplicate full workspace documentation, validation records, or decision records.

## Canonical Inputs

- docs/PROJECT_STATE.md
- docs/SESSION-LOG.md
- docs/releases/RELEASE-3-ROADMAP.md
- docs/releases/RELEASE-3-VALIDATION.md
- docs/releases/VALIDATION-CENTER.md
- docs/decisions/DECISION-LEDGER.md
- docs/knowledge/INDEX.md
- docs/knowledge/founder-os/source-of-truth.md
- docs/founder-os/R3-MISSION-CONTROL.md
- docs/founder-os/R3-REPOSITORY-INTELLIGENCE.md

## Runtime Helper

- docs/founder-os/js/mission-control.js

## Related

- docs/knowledge/founder-os/repository-intelligence.md
- docs/knowledge/founder-os/source-of-truth.md
- docs/knowledge/founder-os/architecture.md
- docs/knowledge/INDEX.md
