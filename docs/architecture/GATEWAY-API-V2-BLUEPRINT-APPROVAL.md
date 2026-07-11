# Gateway API v2 — Blueprint Approval Transaction

Status: Approved Implementation Contract

Date: 2026-07-11

## Objective

Move the Natural Nation Blueprint approval transaction from browser-local persistence to the authenticated Founder OS Gateway and canonical GitHub persistence.

## Endpoint

`POST /v2/workspaces/:workspaceId/blueprints/:blueprintVersion/approve`

## Authority Boundary

The Founder OS browser is a client only.

The Gateway is responsible for:

- authentication
- authorization
- validation
- transaction creation
- canonical repository writes
- audit logging
- execution package creation
- workspace-state updates
- verified response delivery

The browser must not claim canonical approval until the Gateway returns a successful verified transaction.

## Authentication

The endpoint must require an authenticated Founder identity.

Minimum requirements:

- reject missing credentials with `401`
- reject authenticated users without approval permission with `403`
- do not expose repository credentials or secrets to the browser
- record the authenticated actor in the approval and audit records

## Request

```json
{
  "workspaceId": "natural-nation",
  "blueprintVersion": "0.2.0-draft",
  "decisionResolutions": {
    "billing-mvp": "excluded-from-mvp"
  },
  "confirmation": {
    "approved": true,
    "effectAcknowledged": true
  },
  "clientRequestId": "uuid"
}
```

## Validation

The Gateway must verify:

1. workspace exists
2. Blueprint exists
3. requested version matches the canonical version
4. required Blueprint fields are complete
5. every critical Founder decision is resolved
6. required components are identified
7. canonical repository target is configured
8. actor has approval permission
9. request has not already been processed
10. Blueprint is not already locked by a conflicting transaction

Validation failures return a structured blocker list and perform no canonical writes.

## Transaction Model

```json
{
  "transactionId": "TX-NN-BP-000001",
  "type": "blueprint-approval",
  "workspaceId": "natural-nation",
  "blueprintVersion": "0.2.0-draft",
  "status": "committed",
  "actor": "founder",
  "clientRequestId": "uuid",
  "createdAt": "ISO-8601",
  "committedAt": "ISO-8601"
}
```

Supported statuses:

- `received`
- `validating`
- `blocked`
- `committing`
- `committed`
- `failed`

## Canonical Writes

A successful transaction must create or update all of the following as one logical transaction:

### Approval record

Path pattern:

`docs/approvals/workspaces/natural-nation/blueprints/<version>.json`

### Audit event

Path pattern:

`docs/audit/<year>/<transactionId>.json`

### Execution package

Path pattern:

`docs/execution-packages/NN-BUILD-001.json`

### Workspace state

Path:

`docs/founder-os/config/workspace-registry.json`

Required state changes:

- Blueprint status becomes `Approved`
- current stage becomes `Build Ready`
- active package becomes `NN-BUILD-001`
- pending approval count decreases
- next action becomes `Open Build Studio`

### Blueprint lock

The approved Blueprint version must become immutable through normal UI editing. Later changes require a new version.

## Execution Package

The Gateway creates `NN-BUILD-001` with:

- source Blueprint transaction ID
- workspace ID
- Blueprint version
- implementation objective
- repository target
- assigned implementation role: Codex
- architecture review role: Art
- design review role: Gemini
- final approval role: Founder
- acceptance criteria
- validation checklist
- rollback guidance
- status: `ready`

## Response — Success

```json
{
  "ok": true,
  "transactionId": "TX-NN-BP-000001",
  "status": "committed",
  "workspace": {
    "id": "natural-nation",
    "stage": "Build Ready",
    "nextAction": "Open Build Studio"
  },
  "blueprint": {
    "version": "0.2.0-draft",
    "status": "Approved",
    "locked": true
  },
  "executionPackage": {
    "id": "NN-BUILD-001",
    "status": "ready",
    "assignedTo": "Codex"
  },
  "repository": {
    "synchronized": true,
    "commitSha": "<sha>"
  }
}
```

## Response — Blocked

```json
{
  "ok": false,
  "status": "blocked",
  "blockers": [
    {
      "code": "UNRESOLVED_DECISION",
      "field": "billing-mvp",
      "message": "Resolve whether subscription billing is included in the MVP."
    }
  ]
}
```

## Idempotency

`clientRequestId` is required.

Submitting the same request twice must return the original transaction result and must not create duplicate approvals, packages, audit records, or repository commits.

## Failure Handling

- no success response before every required canonical write is verified
- failed writes produce `failed` status and a reviewable audit event where possible
- partial repository writes must be reconciled or reverted before returning a final result
- the UI remains in review state when the transaction is blocked or failed

## UI Integration

After `committed`:

1. display verified success
2. replace local-only approval state with the canonical transaction result
3. open Build Studio
4. select `NN-BUILD-001`
5. show repository synchronization and commit SHA

Before `committed`, the UI must not display `Approved` as canonical.

## Follow-up Endpoints

- `GET /v2/transactions/:transactionId`
- `GET /v2/workspaces/:workspaceId`
- `POST /v2/execution-packages/:packageId/approve`
- `POST /v2/execution-packages/:packageId/execute`

## Completion Criteria

This endpoint is complete when a Founder approval initiated in the live Founder OS UI creates verified canonical approval, audit, execution-package, Blueprint-lock, and workspace-state records and returns the resulting GitHub commit SHA.
