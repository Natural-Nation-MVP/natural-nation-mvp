# FOS-FOUNDATION-012 — Founder Walkthrough

## Create a recurring workspace operation

The Founder opens Natural Nation and creates a daily MVP health review.

```text
NATURAL NATION — AUTOMATION

Daily MVP Health Review
Runs: Every day at 8:00 AM
Timezone: America/New_York
Target: AI-TASK-003 — Experience Verification
Overlap: Not allowed
Missed run: Run once when service resumes

[ Save Draft ]  [ Review and Activate ]
```

Activating the schedule authorizes the timing only. It does not approve any consequential result produced by the workflow.

## Scheduled run

At the eligible time, Founder OS creates a normal execution-runtime run inside the Natural Nation workspace.

```text
AUTOMATION DISPATCHED

Workspace: Natural Nation
Automation: Daily MVP Health Review
Occurrence: 2026-07-18
Execution context: workspace-001-natural-nation
Idempotency key: automation-nn-daily-mvp-health:2026-07-18
```

Registered dependencies, evidence rules, verification requirements, tool permissions, and approval gates remain unchanged.

## Overlap prevention

If yesterday's run is still active, a second run is not started.

```text
RUN NOT STARTED

Reason: Active occurrence already exists
Policy: Overlap forbidden
Action: Existing run retained
Audit event: Recorded
```

## Condition watch

Contractor Estimator checks hourly for provider recovery. When the condition becomes true, the action is dispatched once and enters a six-hour cooldown. Repeated true checks during cooldown are deduplicated.

## Missed runs

After an outage, the Natural Nation daily review uses `run_once`; Founder OS creates one recovery occurrence rather than replaying every missed day. Consequential approval gates are never compressed or auto-approved during catch-up.

## Cross-workspace block

A Natural Nation automation targeting a Contractor Estimator workflow is blocked before dispatch.

```text
AUTOMATION BLOCKED

Automation workspace: Natural Nation
Target owner: Contractor Estimator
Reason: Workspace ownership mismatch
No execution run created.
No tool invoked.
```

## Founder controls

The Founder may pause, resume, or cancel an automation. Material changes to consequential scope, cadence, target, or authority return to the Founder approval boundary.

## Protected boundary

This package does not modify authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or security-sensitive infrastructure.
