# FOS-FOUNDATION-009 — Founder Command Center and Cross-Workspace Operations Model

## Purpose

The Founder Command Center is the Founder OS control surface for portfolio-level visibility and governed action routing. It summarizes workspace state without collapsing workspace ownership or allowing one workspace execution context to act inside another.

## Founder experience

### Portfolio

The Founder sees each workspace as a separate operating unit:

- Workspace #1 — Natural Nation
- Workspace #2 — Contractor Estimator

Each card shows lifecycle state, health, milestone, pending approvals, blocking risks, and the time of the most recent verification.

### Unified attention queue

Founder OS aggregates items that need attention, but every item retains its originating `workspaceId`, `actionId`, consequence class, evidence, and verification state.

The queue may prioritize and route. It may not execute a cross-workspace mutation.

### Approval inbox

A consequential action appears with:

- workspace identity
- requesting AI role
- action identity
- consequence class
- evidence references
- verification result
- time requested

Approval must be explicit. Viewing, opening, or switching into a workspace does not count as approval.

## Cross-workspace routing rules

1. Every operation resolves to exactly one target workspace.
2. Workspace ownership remains attached to projects, workflows, actions, evidence, tasks, metrics, releases, and approvals.
3. A routine read may open the target workspace context directly.
4. A consequential action from another workspace requires an explicit Founder workspace-switch confirmation.
5. Strategic, destructive, financial, security-sensitive, and external actions also require their normal Founder approval record.
6. AI may recommend a workspace switch but cannot confirm it for the Founder.
7. Provider fallback cannot alter workspace identity, action authority, approval requirements, or permitted tools.
8. Missing or conflicting workspace context blocks execution and creates an auditable finding.

## Example: Natural Nation release approval

The Founder opens the global approval inbox and selects a Natural Nation release candidate. Founder OS shows that the current context is Contractor Estimator and asks the Founder to switch to Natural Nation. After explicit confirmation, the approval record opens inside `workspace-001-natural-nation`. The Founder can review evidence and approve, reject, or request changes.

No Natural Nation action runs while the active execution context remains Contractor Estimator.

## Example: Contractor Estimator blocked workflow

The attention queue shows a high-severity blocker for missing job measurements. Opening the item establishes Contractor Estimator context and routes the Founder to the scope-capture action. This is a routine correction and does not require a consequential approval, but the action still cannot read or modify Natural Nation data.

## Protected boundary

This package does not modify authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or security-sensitive infrastructure. FOS-DIRECTIVE-001 remains controlling.
