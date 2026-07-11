# Explain Drawer v1

Status: Revised for Founder Review

## Purpose

Implement NNOS-UX-001 — Explainability First without adding another primary page, overloading Workspace Discovery, or sending the Founder to an outside platform.

## Experience

The unresolved Natural Nation MVP billing recommendation includes an **Explain** link.

Selecting Explain opens a contextual side drawer with three tabs.

### Explain

The reasoning is compact and explains:

- the discussion that led to the recommendation
- the road from the original product definition to the current decision
- why the decision is needed now
- how the decision affects scope, applications, security, and launch planning
- confidence and estimated effort

### Sources

Each source shows:

- canonical document title
- source authority
- what the source contributed
- an **Open document** action

Open document keeps the Founder inside the Explain drawer and displays a readable text summary of the relevant canonical document. No GitHub or other outside platform is opened.

### History

History summarizes the decision path:

1. core product defined
2. MVP scope organized
3. monetization discussed but left unresolved
4. billing decision recommended because it changes project scope

## Canonical Sources Available Internally

- Workspace Discovery and Blueprint Engine
- Natural Nation Project State
- Founder OS Decision Ledger
- Phase 4 Roadmap

## Progressive Disclosure

The intelligence drawer is injected only when needed. The internal document reader appears only after Open document is selected and returns to the source list without leaving Founder OS.

## Accessibility and Behavior

- close button
- backdrop close
- Escape-key close
- reduced-motion support
- mobile-responsive drawer
- internal source reader
- back-to-sources control

## Files

- docs/founder-os/config/natural-nation-discovery.json
- docs/founder-os/js/workspace-discovery.js
- docs/founder-os/css/workspace-discovery.css

## Safety Boundary

The drawer explains recommendations only. It does not approve decisions, persist answers, install applications, or make protected repository changes.

## Next

Founder reviews the compact reasoning and internal document reader and reports PASS, PASS WITH FINDINGS, or FAIL.
