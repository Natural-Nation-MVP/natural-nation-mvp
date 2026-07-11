# Explain Drawer v1

Status: Implemented for Founder Review

## Purpose

Implement NNOS-UX-001 — Explainability First without adding another primary page or overloading Workspace Discovery.

## Experience

The unresolved Natural Nation MVP billing recommendation now includes an **Explain** link.

Selecting Explain opens a contextual side drawer with three tabs:

### Explain

- recommendation
- plain-language reasoning
- confidence
- expected impact
- estimated effort

### Sources

- canonical document title
- source authority
- explanation of how the source informed the recommendation
- direct link to the canonical GitHub document

### History

- completed prerequisite stages
- current recommendation
- explanation of how the recommendation evolved

## Canonical Sources Linked

- Workspace Discovery and Blueprint Engine
- Natural Nation Project State
- Founder OS Decision Ledger
- Phase 4 Roadmap

## Progressive Disclosure

The intelligence drawer is injected only when needed. It is not a sidebar application and does not add permanent page content.

## Accessibility and Behavior

- close button
- backdrop close
- Escape-key close
- reduced-motion support
- mobile-responsive drawer
- external source links open safely in a new tab

## Files

- docs/founder-os/config/natural-nation-discovery.json
- docs/founder-os/js/workspace-discovery.js
- docs/founder-os/css/workspace-discovery.css

## Safety Boundary

The drawer explains recommendations only. It does not approve decisions, persist answers, install applications, or make protected repository changes.

## Next

Founder reviews the live Explain drawer and reports PASS, PASS WITH FINDINGS, or FAIL.
