# Blueprint Approval Transaction v0.1

Status: Implemented for Founder Review

## Purpose

Complete the first usable section of NNOS-FLOW-001 by connecting Blueprint approval to validation, explicit Founder confirmation, approval state, audit state, execution-package generation, and Build Studio handoff.

## Implemented Flow

1. Founder selects **Approve Blueprint**.
2. Founder OS opens a compact approval dialog.
3. Required Blueprint sections are validated.
4. The unresolved MVP billing decision must be answered.
5. Founder explicitly confirms approval.
6. Founder OS creates a browser-persisted approval transaction.
7. Founder OS creates a browser-persisted audit event.
8. Founder OS generates execution package `NN-BUILD-001`.
9. Blueprint state advances to Founder Approved in the active browser.
10. Build Studio opens with the generated package loaded.

## Truthfulness Boundary

This version does not claim canonical GitHub synchronization.

The approval dialog explicitly marks GitHub synchronization as pending because the secure gateway approval endpoint has not yet been implemented.

## Persistence

The current transaction uses browser local storage so the approval and generated package survive page refreshes on the same browser.

Canonical persistence requires the next gateway milestone.

## Runtime Files

- `docs/founder-os/js/blueprint-approval-transaction.js`
- `docs/founder-os/css/blueprint-approval.css`
- `docs/founder-os/js/gateway-status.js`

## Next Milestone

Add an authenticated gateway endpoint that accepts the confirmed transaction and writes:

- the Founder approval record
- the audit event
- the execution package
- the updated workspace state

After the gateway confirms those writes, the transaction status may advance from `approved-local` to `approved-canonical`.
