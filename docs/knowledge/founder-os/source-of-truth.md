# KB-FOUNDER-007 — Founder OS Single Source of Truth Standard

Status: Founder Approved

## Purpose

This record defines how Founder OS prevents duplicate project data while still supporting Mission Control, Knowledge Graph, Repository Intelligence, Build Studio, AI Operations, Validation Center, Decision Ledger, and future release workflows.

## Core Rule

Every piece of project content must have exactly one canonical owner.

Founder OS should reference canonical records instead of copying their full contents into multiple locations.

## Canonical Ownership Map

| Information Type | Canonical Owner |
| --- | --- |
| Product requirements | Knowledge Base |
| Current project status | docs/PROJECT_STATE.md |
| Architecture decisions | docs/decisions/ |
| Governance standards | docs/governance/ |
| Session history | docs/SESSION-LOG.md |
| Release planning | docs/releases/ |
| Build packages | docs/build-packages/ |
| Repository state | Repository Intelligence |
| Validation results | Validation Center records |
| Founder approvals | Decision Ledger records |

## Reference Model

Founder OS workspaces should store and display lightweight references:

- title
- status
- canonical path
- related records
- latest decision
- validation status
- commit reference when applicable

They should not duplicate full source documents unless a temporary summary is explicitly required.

## Validation Center Rule

Validation Center records should capture validation events, not duplicate workspace documentation.

A validation event may include:

- release
- workspace
- status
- date
- founder result
- issue summary
- canonical source path
- related commits

## Decision Ledger Rule

Decision Ledger records should capture approval events, not duplicate the approved document.

A decision event may include:

- decision ID
- date
- decision summary
- affected workspace
- canonical source path
- related ADR or governance record
- related commits
- validation status
- release association

## Implementation Principle

Founder OS is a graph of references, not a collection of duplicated documents.

Each workspace presents a different operational view of the same canonical source records.

## Related Records

- docs/knowledge/founder-os/operating-model-v1.md
- docs/knowledge/founder-os/mission-control.md
- docs/knowledge/founder-os/ai-operations.md
- docs/governance/SYNC-STANDARD.md
- docs/releases/RELEASE-3-VALIDATION.md
