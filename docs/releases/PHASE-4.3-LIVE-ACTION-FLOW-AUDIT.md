# Phase 4.3 — Live Action Flow Audit

Status: Implementation Ready — Live Transaction Pending

Date: 2026-07-14

## Objective

Verify that the Natural Nation Blueprint approval works as a truthful live action from Founder OS through Cloudflare and GitHub, without browser-only approval, audit, package, or queue simulation.

## Audited Flow

```text
Founder OS Blueprint
→ Founder credential prompt
→ Gateway authentication
→ Blueprint validation
→ no-write dry run
→ explicit Founder confirmation
→ atomic GitHub commit
→ canonical Blueprint publication
→ canonical NN-BUILD-001 publication
→ Workspace Registry refresh
→ Build Studio canonical package load
```

## Verified Implementation

### Founder OS

- Blueprint action begins with `Validate Approval`.
- Dry run performs no repository writes.
- Successful dry run changes the action to `Approve Blueprint`.
- Approval requires explicit Founder confirmation.
- The browser does not create approval, audit, transaction, or package records.
- The browser does not advance to Build Studio from the Gateway response alone.
- The live client waits for the committed Blueprint and `NN-BUILD-001` to be published by GitHub Pages.
- The committed Blueprint and package must share the same transaction ID.
- Stale local package actions are intercepted.

### Gateway

- Worker version: `0.4.1`
- Deployment: GitHub-managed Cloudflare Worker
- Authentication: `FOUNDER_API_KEY`
- Canonical repository credential: `GITHUB_TOKEN`
- Route:

`POST /v2/workspaces/:workspaceId/blueprints/:blueprintVersion/approve`

- Dry-run mode verifies repository access and planned files without committing.
- Live mode creates one atomic Git commit.
- Idempotency is derived from `clientRequestId`.

### Canonical Commit

The live transaction prepares these six writes:

1. Blueprint approval record
2. Audit event
3. `docs/execution-packages/NN-BUILD-001.json`
4. Transaction record
5. Approved and locked Blueprint
6. Updated Workspace Registry

### Required Canonical State

The UI may show approval only when GitHub contains:

```json
{
  "status": "Approved",
  "locked": true,
  "decisionResolutions": {
    "billing-mvp": "excluded-from-mvp"
  },
  "openDecisions": [],
  "snapshot": {
    "openDecisions": 0
  },
  "approvalTransactionId": "TX-NN-BP-..."
}
```

Build Studio may show a ready package only when GitHub contains:

```json
{
  "packageId": "NN-BUILD-001",
  "workspaceId": "natural-nation",
  "sourceTransactionId": "TX-NN-BP-...",
  "status": "ready"
}
```

## Audit Corrections

The audit found and corrected:

- Build Studio used the wrong relative path for the canonical package.
- GitHub Pages publication was checked only once after commit.
- stale cached scripts could continue running obsolete local simulation.
- dry-run verification counts did not map to the Gateway response.
- initial Build Studio labels implied local generation was available.

## Current Canonical State

As of this audit:

- Blueprint remains `Founder Review`.
- billing remains an open canonical decision.
- `NN-BUILD-001.json` does not yet exist.
- no canonical approval transaction has been committed.

This is correct until the Founder completes the live approval action.

## Remaining Live Test

1. Open Natural Nation → Blueprint.
2. Select `Validate Approval`.
3. Enter the current Founder key.
4. Confirm dry-run success and zero repository writes.
5. Select `Approve Blueprint`.
6. Confirm the live transaction.
7. Verify returned transaction and commit SHA.
8. Verify the Blueprint becomes approved and locked.
9. Verify billing disappears from open decisions.
10. Verify Build Studio loads `NN-BUILD-001` from GitHub.
11. Verify the Workspace Registry shows `Build Ready`.

## Completion Rule

Phase 4.3 Slice #1 is complete only after the live action produces and verifies the canonical GitHub commit. Code readiness alone does not close the slice.
