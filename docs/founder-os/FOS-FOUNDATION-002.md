# FOS-FOUNDATION-002 — Workspace Registry and Lifecycle Engine

Status: Implementation Candidate  
Authority: FOS-DIRECTIVE-001 and FOS-FOUNDATION-001  
Issue: #45

## 1. Purpose

This package establishes the first executable, product-agnostic workspace registry for Founder OS.

Founder OS owns workspace identity, registration, lifecycle, isolation metadata, governance references, health summaries, and audit references. Each workspace owns its projects, workflows, AI team, actions, approvals, deliverables, releases, assets, and domain-specific behavior.

Natural Nation is registered as Workspace #1. It is not embedded into the Founder OS core model.

## 2. Canonical workspace record

Every workspace record must contain:

- `workspaceId`: stable lowercase machine identifier
- `displayName`: Founder-facing name
- `sequence`: stable Founder OS workspace number
- `workspaceType`: broad product or initiative category
- `description`: concise purpose statement
- `status`: current canonical lifecycle state
- `ownerType`: currently `founder`
- `isolation`: namespace, data boundary, asset boundary, and execution boundary
- `locations`: workspace-owned knowledge, assets, source, and delivery references
- `governance`: approval policy, audit policy, and protected-boundary references
- `capabilities`: registered workspace capability identifiers
- `health`: summary state without domain-specific assumptions
- `createdAt` and `updatedAt`: auditable timestamps

Optional lifecycle metadata is required when a workspace is paused, archived, restored, scheduled for deletion, or deleted.

## 3. Lifecycle states

Canonical states:

1. `draft`
2. `active`
3. `paused`
4. `archived`
5. `restored`
6. `scheduled_for_deletion`
7. `deleted`

`restored` is an explicit audit-visible state. A restored workspace must transition to `active`, `paused`, or `archived` before normal work resumes.

## 4. Allowed transitions

- `draft` → `active`, `archived`, `scheduled_for_deletion`
- `active` → `paused`, `archived`, `scheduled_for_deletion`
- `paused` → `active`, `archived`, `scheduled_for_deletion`
- `archived` → `restored`, `scheduled_for_deletion`
- `restored` → `active`, `paused`, `archived`
- `scheduled_for_deletion` → `restored`, `deleted`
- `deleted` → no transitions

All transitions must record actor, timestamp, reason, previous state, next state, and an audit reference.

## 5. Approval gates

The following transitions require explicit Founder approval evidence:

- Any transition to `scheduled_for_deletion`
- `scheduled_for_deletion` → `deleted`
- Restoration after deletion is not supported by this lifecycle model

Archive, pause, restore from archive, and activation may proceed under workspace policy when reversible and authorized by an active directive.

## 6. Isolation contract

Every workspace must declare separate boundaries for:

- Namespace
- Data
- Assets
- Execution
- Knowledge
- Deliverables

A workspace may use shared Founder OS capabilities, but shared capabilities must receive an explicit workspace context and may not silently mix state between workspaces.

## 7. Registry storage

The canonical repository-backed registry is stored at:

`docs/founder-os/registry/workspaces.json`

Its governing schema is stored at:

`docs/founder-os/registry/workspace-registry.schema.json`

Lifecycle rules are stored at:

`docs/founder-os/registry/workspace-lifecycle.json`

The repository registry is the initial canonical implementation. A later persistence adapter may mirror it into a database, but it must preserve the same contract and audit semantics.

## 8. Natural Nation registration

Natural Nation is Workspace #1 with:

- Workspace ID: `natural-nation`
- Sequence: `1`
- Type: `digital_wellness_product`
- Status: `active`
- Workspace-owned source: `app/`
- Workspace-owned assets: `resources/`
- Workspace-owned knowledge: `knowledge/`

Founder OS documentation, governance, orchestration, shared registry, and platform services remain outside the Natural Nation workspace boundary.

## 9. Workspace #2 proof requirement

The schema and validator must accept a second workspace with a different domain and output type without modification to Founder OS core files.

The validation fixture uses a non-wellness research-and-media workspace to prove product independence. The fixture is not a production workspace registration.

## 10. Validation

`scripts/validate-workspace-registry.mjs` must verify:

- Registry and lifecycle documents parse
- Schema version is present
- Workspace IDs and sequence numbers are unique
- Required fields and isolation boundaries exist
- States are canonical
- Lifecycle transitions reference canonical states
- Deleted workspaces have deletion evidence
- Scheduled deletion records have Founder approval evidence
- Natural Nation is Workspace #1
- A non-wellness Workspace #2 fixture validates without schema changes

## 11. Protected security boundary

This package does not modify authentication, authorization, identity, sessions, tokens, credentials, secrets handling, access controls, security middleware, preventative security measures, or security-sensitive infrastructure.

Registry governance references may point to protected policies, but this package does not alter those policies or implementations.

## 12. Acceptance criteria

FOS-FOUNDATION-002 is complete when:

- The machine-readable registry, schema, and lifecycle model exist.
- Natural Nation is registered as Workspace #1.
- Workspace ownership and Founder OS ownership remain separated.
- Lifecycle transitions are deterministic and auditable.
- Destructive transitions require Founder approval evidence.
- Validation rejects invalid records.
- A second non-wellness workspace fixture passes the same contract.
- No protected security or authentication code is changed.
