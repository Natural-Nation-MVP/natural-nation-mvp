# FOS-FOUNDATION-005 — Workspace Context and Routing

## Status
Implementation candidate

## Purpose
Define how Founder OS distinguishes platform scope from workspace scope and requires explicit workspace context for workspace-owned operations.

Founder OS manages workspaces globally. Projects, workflows, AI teams, actions, approvals, evidence, deliverables, releases, and product metrics belong to one workspace unless an explicit cross-workspace coordination record exists.

## Scope model

### Platform scope
Platform scope contains Founder OS-owned capabilities such as:

- workspace registry and lifecycle
- cross-workspace health and activity summaries
- shared capability and provider registries
- platform governance and audit views
- shared integration administration

Platform scope must not expose Natural Nation or other product-specific actions as global Founder OS actions.

### Workspace scope
Workspace scope contains:

- workspace dashboard
- projects and work packages
- workflow execution
- AI team configuration
- approvals
- evidence and deliverables
- releases
- workspace metrics
- domain-specific actions

Every workspace-scoped record and operation must include a canonical `workspaceId`.

## Canonical context

A workspace context contains:

- `scope`: `platform` or `workspace`
- `workspaceId`: required only for workspace scope
- `workspaceStatus`
- `route`
- `resourceType`
- `resourceId`
- `requestedAction`
- `auditReference`

Founder OS may not infer workspace identity from a product name, repository path, provider prompt, project title, or previous screen.

## Routing rules

- Platform routes begin with `/founder-os` and contain only platform-owned functions.
- Workspace routes begin with `/workspaces/{workspaceId}`.
- Workspace navigation is generated from that workspace contract and registered actions.
- A workspace action is blocked when `workspaceId` is missing.
- A resource is blocked when its recorded workspace ID differs from the active context.
- Provider dispatch, evidence, approval, metric, and audit records must preserve the same workspace ID.
- Cross-workspace activity requires an explicit coordination record and cannot be created through accidental reference mixing.

## Failure behavior

When context is missing or mismatched:

1. Stop the operation before execution.
2. Preserve existing state.
3. Identify the missing or conflicting workspace reference.
4. Return a safe navigation option to the correct workspace.
5. Create an audit-visible blocked result.

## Product-neutral proof

Natural Nation and Contractor Estimator use the same context contract. Their routes, actions, metrics, projects, and AI teams remain isolated by workspace ID.

## Protected boundary

This package does not modify authentication, authorization, identity, sessions, tokens, secrets handling, access controls, security middleware, preventative-security measures, or security-sensitive infrastructure.
