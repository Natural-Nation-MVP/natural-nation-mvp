# AI Delivered-State Stall Report

**Date:** 2026-07-16  
**Workspace:** Natural Nation  
**Package:** NN-BUILD-001  
**Affected task:** AI-TASK-003 — Review the experience

## Executive finding

Gemini successfully returned a schema-valid `experience_review` response. Founder OS then recorded the provider delivery in GitHub, but the later verification/completion transaction did not finish. This left the task stranded in `working` with `providerStatus: delivered`, while GPose remained waiting.

This was not a provider response-format failure. It was a transaction-boundary failure inside Founder OS.

## Confirmed sequence

1. Founder OS committed the task handoff.
2. Gemini returned a valid structured result.
3. Founder OS committed the delivered state and embedded completed result.
4. The separate completion transaction failed or ended before it committed the verified result and next handoff.

Because steps 3 and 4 were separate GitHub transactions, the browser displayed a permanent delivered state.

## Evidence-grounding finding

The Gemini request included PR #38 and filenames, but did not include actual pull-request patches. The response shape was valid, but some factual findings were unsupported because the model did not receive the repository evidence it was asked to evaluate.

## Corrections

- Synchronous providers no longer commit a durable intermediate delivered state.
- Provider delivery, task record, verification result, completed state, and next-role handoff are committed together in one canonical completion transaction.
- Verification failures are also committed atomically with the task record and failure result.
- AI-TASK-003 now loads PR metadata and exact changed-file patches before the provider call.
- The provider receives an evidence contract containing the PR number, head SHA, and allowed paths.
- Review instructions prohibit claims not supported by the injected patches.
- The stranded task was reset to Ready while preserving the failed dispatch in retry context.
- The obsolete Founder decision from the previous review cycle was cleared.

## Expected behavior

A successful synchronous review now moves directly from dispatching to result-verified and advances GPose in one repository commit. A verification failure moves directly to blocked with an actionable reason. Founder OS should no longer remain at delivered after a synchronous provider has already returned a completed result.
