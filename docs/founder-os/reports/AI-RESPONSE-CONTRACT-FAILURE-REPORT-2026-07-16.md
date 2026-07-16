# AI Response Contract Failure Report

**Date:** 2026-07-16  
**Workspace:** Natural Nation  
**Package:** NN-BUILD-001  
**Failed task:** AI-TASK-003 — Gemini experience review

## Executive finding

The retry failed because Founder OS described the expected review structure in prompt text, but did not enforce that structure through the Google provider API for AI-TASK-003. Provider-native structured output was enabled only for AI-TASK-002. Gemini therefore returned a Markdown-fenced JSON-like response with incompatible field names and values. The verifier correctly refused to advance the workflow.

A second synchronization defect also existed: after the Founder requested changes, Codex created successor PR #38 with a new file set, while AI-TASK-003 still instructed Gemini to review PR #30 and the previous five files. This allowed the review request, provider response, and verifier allowlist to disagree.

## Evidence

The failed result recorded:

- fenced output beginning with ` ```json `
- missing `type: experience_review`
- snake_case fields such as `merge_blockers` and `file_based_evidence`
- a narrative recommendation instead of the required `approve` or `changes_required`
- stale assumptions from the earlier implementation cycle

The canonical state still referenced PR #30 even though AI-TASK-002 had completed successor PR #38.

## Root causes

1. **Provider schema coverage gap** — only AI-TASK-002 requested provider-native JSON schema output.
2. **Prompt-only contracts** — AI-TASK-003 and AI-TASK-004 relied on the model following prose instructions.
3. **No normalized structured result** — raw provider text was passed to verification and reparsed later.
4. **Stale evidence contract** — the review task did not update when the implementation PR and changed-file set changed.
5. **Static verifier paths** — evidence validation was tied to the first implementation file layout rather than the current task contract.

## Corrections implemented

- Added a centralized provider contract registry for AI-TASK-002, AI-TASK-003, and AI-TASK-004.
- Google requests now use `responseMimeType: application/json` and a task-specific `responseSchema` for all structured tasks.
- OpenAI requests now use strict `json_schema` response formatting for all structured tasks.
- Provider output is parsed and normalized immediately; verified structured data is stored separately from summary text.
- Invalid structured output is classified as `INVALID_RESPONSE` and is eligible for safe provider fallback.
- Gemini evidence paths are derived from the current task contract, not a hardcoded initial file list.
- AI-TASK-003 now references successor PR #38 and its exact five changed files.
- Gemini, GPose, and Founder downstream stages remain waiting until the corrected review verifies.
- Validation tests now require all three provider contracts and both provider-native schema mechanisms.

## Expected behavior after deployment

For every structured task, Founder OS sends the model both the task instructions and an API-enforced response schema. The provider must return the exact field names, allowed values, and evidence object shapes. Founder OS normalizes that object before verification. A provider that still returns malformed output is classified clearly and may fail over to another configured provider without advancing the workflow on unverified data.

## Remaining boundary

Provider schemas control response shape, not factual correctness. Repository and task verification must still confirm that cited PRs, files, test evidence, and recommendations match the current canonical build cycle.
