# R3 Repository Intelligence Milestone

Status: Founder Approved

## Purpose

Repository Intelligence turns Founder OS into a live project visibility system. It should help the Founder understand what changed, what is synchronized, what is blocked, and what needs action.

## Core Questions

Repository Intelligence should answer:

- What changed recently?
- Which documents are out of sync?
- Which builds are waiting for approval?
- Which ADRs affect this feature?
- Which modules are incomplete?
- What is blocking Release 3?
- Is the Knowledge Base current?

## First Production Scope

The first version should include:

- repository health
- canonical runtime status
- knowledge base status
- release sync status
- documentation coverage
- pending sync items
- recent implementation activity
- next Founder actions

## Data Sources

- docs/PROJECT_STATE.md
- docs/SESSION-LOG.md
- docs/releases/RELEASE-3-ROADMAP.md
- docs/knowledge/INDEX.md
- docs/governance/SYNC-STANDARD.md
- docs/decisions/
- docs/founder-os/

## Acceptance Criteria

- Repository Intelligence opens from the left navigation.
- The page explains project repository health in plain English.
- The Founder can see synchronization status without searching manually.
- The page shows the Knowledge Base as the canonical documentation source.
- The layout remains consistent with the approved Founder OS workspace system.

## Relationship To Mission Control

Repository Intelligence provides detailed project and GitHub visibility. Mission Control summarizes the most important signals for Founder-level decision-making.
