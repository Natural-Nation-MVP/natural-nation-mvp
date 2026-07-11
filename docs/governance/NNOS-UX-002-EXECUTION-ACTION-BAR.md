# NNOS-UX-002 — Execution Action Bar Standard

Status: Founder Approved

## Purpose

Create one consistent execution pattern across Founder OS.

## Standard

Any page that performs a page-level execution, approval, generation, deployment, submission, or protected action must use the same bottom action bar structure and page layer as Build Studio.

## Required Pattern

The execution action bar must:

- use the shared `.bottom-bar` component
- exist outside the page `<main>` layer inside the application shell
- remain fixed to the bottom on supported desktop and tablet layouts
- use the same responsive behavior as Build Studio
- contain concise execution context followed by one primary action
- remain hidden on pages without a page-level execution action
- show only the action bar belonging to the active page

## Information Structure

The shared bar uses four columns:

1. primary execution context
2. delivery, effect, or outcome
3. approval or unresolved-decision status
4. primary execution button

Labels and values may change by page, but the component structure, position, responsive behavior, and visual styling must remain consistent.

## Current Implementations

### Build Studio

- Package Target
- Delivery
- Approval
- Generate Package

### Workspace Blueprint

- Blueprint Readiness
- Approval Effect
- Pending Decisions
- Approve Blueprint

## Progressive Execution Rule

The action bar may describe or prepare an action before protected execution is available, but it must not imply that a protected action completed when it did not.

## Future Application Rule

New execution-style pages must reuse this standard instead of creating custom sticky cards, floating panels, or page-specific approval bars.

## Compact Card Rule

Until a later styling phase is approved, Founder OS cards should use compact spacing, short descriptions, and the established hierarchy:

1. eyebrow tag
2. section title
3. concise supporting text

Oversized statement treatments should not replace the standard card hierarchy unless explicitly approved.
