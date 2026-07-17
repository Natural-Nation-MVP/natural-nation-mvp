# FOS-FOUNDATION-010 — Execution Runtime, Task State, Evidence, and Recovery Engine

## Purpose

The Founder OS execution runtime turns a registered workspace workflow into auditable task runs without changing the workflow contract. Every run belongs to exactly one workspace and retains its role, capabilities, tools, evidence requirements, verification rules, and approval boundaries.

## Runtime Rules

1. A run cannot start without an explicit workspace context.
2. Dependencies must complete before a dependent action becomes ready.
3. Required evidence must be attached before verification can pass.
4. Verification cannot be skipped or replaced by provider output.
5. Founder approval cannot be inferred from earlier approvals, workspace switches, model output, or task completion.
6. Provider fallback may continue only when the original task contract is preserved.
7. Consequential actions require an idempotency key to prevent duplicate execution.
8. Every state transition requires an immutable audit reference.
9. Cross-workspace mutations are blocked.

## Canonical Task Lifecycle

`queued → blocked|ready → running → awaiting_evidence → awaiting_verification → awaiting_founder_approval → completed`

Recoverable failures follow:

`running → retry_scheduled → recovering → ready`

Non-recoverable failures end in `failed`. A Founder or authorized platform operation may end an unfinished run in `cancelled`.

## Founder Experience — Natural Nation

The Experience Reviewer finishes the registered MVP verification action.

```text
NATURAL NATION — EXECUTION RUN

AI-TASK-003: Experience Verification
Status: Awaiting Founder Approval

Dependencies
✓ AI-TASK-002 completed

Evidence
✓ MVP verification report attached
✓ Locked-decision compatibility report attached

Verification
PASSED

Founder decision required
[ Review Evidence ] [ Approve ] [ Request Changes ] [ Reject ]
```

The runtime does not mark the release completed until the Founder records a decision. Selecting the workspace or opening the report is not approval.

## Founder Experience — Contractor Estimator Recovery

The estimate calculation provider becomes temporarily unavailable.

```text
CONTRACTOR ESTIMATOR — RECOVERY

Action: Calculate Estimate
Failure: Temporary provider outage
Attempt: 1 of 3

Contract preserved
✓ Estimator role
✓ Estimate-calculation capability
✓ Scope evidence requirement
✓ Math verification rule
✓ Estimate Engine permission

Fallback route eligible: Google General
Next retry: Scheduled
[ View Audit Trail ] [ Cancel Run ]
```

The fallback may retry because it does not alter authority or verification. If all retries fail, the run moves to `failed` and appears in the Founder Command Center attention queue.

## Blocked Cross-Workspace Example

A Natural Nation browser context attempts to execute a Contractor Estimator action.

```text
EXECUTION BLOCKED

Current workspace:
Natural Nation

Requested action owner:
Contractor Estimator

Reason:
Workspace context mismatch

No task was started.
No tool was invoked.
No evidence was changed.
```

## Protected Boundary

This package does not modify authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or security-sensitive infrastructure. FOS-DIRECTIVE-001 remains controlling.
