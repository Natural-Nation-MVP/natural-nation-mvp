# Founder OS Workspace Isolation Contract

Status: Founder Approved — Stabilization Baseline

## Purpose

Define the mandatory architecture boundary between the Founder OS platform and every workspace it orchestrates.

## Platform boundary

Founder OS provides shared platform services:

- Workspace Registry
- protected Gateway access
- authentication and authorization
- canonical approval framework
- audit and transaction standards
- shared visual system
- deployment and health signals

Shared services do not imply shared workspace state.

## Workspace boundary

Every workspace owns its own:

- workspace identity
- navigation modules
- canonical configuration
- discovery records
- decisions and approvals
- execution packages
- build queue
- AI assignments
- repository target
- lifecycle status
- permissions

No workspace may infer, read, render, mutate, or execute another workspace's records without an explicit platform-level cross-workspace capability.

## Required identity propagation

Every runtime operation must receive an explicit `workspaceId`.

The active workspace must not be inferred from:

- page text
- selected navigation label
- package title
- browser-local storage
- globally named variables
- default Natural Nation assumptions

## Route contract

Every module route must validate:

1. workspace exists
2. module belongs to workspace
3. requested canonical record belongs to workspace
4. user or system is authorized
5. protected action is permitted in the current state

Unsupported workspace/module combinations must fail closed.

## Canonical record contract

Every canonical record must contain at minimum:

- `workspaceId`
- record type
- canonical identifier
- lifecycle status
- source transaction when applicable
- repository target when applicable
- timestamps

Execution packages must be rejected when package `workspaceId` does not match the active workspace.

## State transition contract

Protected transitions must follow:

`request → authenticate → authorize → validate → dry run → confirm → commit → publish verification → workspace refresh`

The browser must not advance canonical state from an optimistic response alone.

## Workspace switching contract

When the active workspace changes, the runtime must:

- clear previous workspace render state
- hide unsupported modules
- clear package and queue views
- cancel or ignore stale asynchronous responses
- load the new workspace's canonical state
- render execution bars only when supported by that workspace and module

## Prohibited patterns

- globally hard-coded workspace names
- one shared queue rendered for multiple workspaces
- browser-created canonical approvals or packages
- duplicate action handlers for the same protected operation
- fallback local execution paths
- implicit package selection
- cross-workspace cached content

## Required isolation tests

- Founder OS cannot load Natural Nation packages.
- Natural Nation cannot modify Founder OS state.
- Switching workspaces clears previous workspace data.
- A package cannot render or execute outside its owning workspace.
- Unsupported modules are absent and inaccessible.
- Stale async responses cannot overwrite the active workspace.
- Approved decisions cannot reappear as unresolved.

## Release rule

No new workspace or protected action may ship without satisfying this contract and its automated tests.
