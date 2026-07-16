# Founder OS Resilience Audit — 2026-07-16

## Scope

Reviewed the live execution path across Build Work, Assigned AI Team, the Cloudflare Gateway, provider routing, result verification, protected task reset, canonical GitHub state, and repository execution.

## Executive result

Founder OS is correctly enforcing canonical GitHub state and deterministic result verification. The highest remaining stall risk was in the browser monitor: it treated `delivered` as a finished action even though verification had not reached a terminal state. A second gap was that blocked tasks had a protected reset endpoint but no Founder-facing recovery control.

This change corrects both gaps and records the remaining risks below.

## Findings and disposition

### 1. Delivered-state false completion — Critical — Fixed

**Failure:** The browser monitor stopped as soon as a provider response was marked `delivered`. Verification could still be running or could later fail, leaving Build Work displaying a non-terminal state with no active recovery action.

**Correction:** The monitor now waits for the canonical task to reach `complete` or `blocked`. `delivered` is displayed as the verification stage, not success.

### 2. No Founder-facing blocked-task recovery — High — Fixed

**Failure:** The Gateway supported protected reset, but the UI exposed no safe reset button. Recovery required manual repository edits.

**Correction:** The current blocked task now exposes **Retry current task safely**. The action requires the Founder key, preserves completed upstream work, preserves failure history, and resets only the current blocked task.

### 3. Duplicate dispatch after browser timeout — High — Fixed

**Failure:** A user could interpret an expired browser monitor as provider failure and dispatch the same task again while canonical processing was still active.

**Correction:** A five-minute monitor expiration no longer reports success or encourages rerun. It instructs the Founder to refresh canonical state and use recovery/reset rather than dispatching a duplicate request.

### 4. Provider quota and failover classification — High — Existing protection verified

Quota, billing, rate-limit, timeout, connection, and provider-unavailable failures are eligible for failover. Authentication and malformed-request failures remain terminal so invalid configuration is not hidden. Every attempt records preferred provider, executing provider, fallback reason, and temporary role assumption.

**Residual risk:** Empty or malformed provider output should remain a verification failure unless explicitly classified as retryable by provider policy. It must never silently advance the workflow.

### 5. Structured-result language false positives — Critical — Fixed previously

Structured Gemini and GPose contracts are verified before generic narrative heuristics. Legitimate review findings such as “placeholder asset” or “incomplete persistence” no longer cause false execution failure.

### 6. Canonical commit conflicts — Medium — Monitored

Concurrent GitHub writes can return non-fast-forward conflicts. Current dispatch eligibility and unique task ownership reduce this risk. A future multi-workspace release should add bounded optimistic retries to canonical state commits.

### 7. Worker interruption after handoff commit — Medium — Recoverable

A Worker interruption can leave a task at `working` or `delivered`. The recover endpoint can complete a stored synchronous result, while protected reset can safely retry a blocked task.

**Future hardening:** Add a scheduled reconciler that marks stale `dispatching` records for Founder review instead of allowing indefinite active state.

### 8. Reset endpoint misuse — Medium — UI constrained

The UI only offers reset for the current blocked task. Completed upstream work cannot be reset through the endpoint. Direct API callers remain Founder-authenticated and are logged in canonical GitHub history.

### 9. Browser and network failures — Medium — Fixed

Network errors no longer overwrite canonical truth. The browser refreshes Gateway state and reports terminal canonical status when available. Non-terminal expiration is shown as “needs review,” not task failure.

### 10. Missing favicon — Low — Deferred

The recurring `favicon.ico` 404 is cosmetic and unrelated to orchestration. It should be corrected with the next Founder OS asset package.

## Expected resilient behavior

1. Validate task without writes.
2. Record one protected handoff.
3. Attempt the preferred provider.
4. Fail over only for approved retryable categories.
5. Record provider delivery.
6. Verify deterministic result contract and evidence.
7. Commit either `result-verified` or `verification-failed` to canonical GitHub state.
8. Advance only after verification.
9. Display a protected retry control only for the current blocked task.
10. Require direct Founder action for final approval and merge.

## Remaining recommended follow-up

- Add bounded GitHub commit retries for non-fast-forward canonical-state conflicts.
- Add stale-dispatch reconciliation with an explicit age threshold.
- Add provider circuit-breaker telemetry to avoid repeatedly selecting a provider with sustained quota or outage failures.
- Add a favicon and remove the cosmetic console 404.
- Add end-to-end browser tests for dispatch, failover, verification failure, reset, and owner advancement.
