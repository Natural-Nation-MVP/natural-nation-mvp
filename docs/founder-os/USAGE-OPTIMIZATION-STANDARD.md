# Founder OS Usage Optimization Standard

Status: Active

Effective: 2026-08-27

Scope: Founder OS and every governed workspace, including Natural Nation

## Outcome

Founder OS must minimize redundant AI, automation, repository, validation, and review usage without deleting or weakening project history, approved decisions, evidence, acceptance criteria, or Founder authority.

## Three-layer context model

1. The permanent archive preserves complete source conversations, decisions, screenshots, repository evidence, approvals, and raw technical records.
2. The verified project state preserves locked decisions, current phase, architecture, authority boundaries, and active blockers.
3. A task context pack contains only the current assignment, required inputs, expected output, relevant evidence, and acceptance criteria.

AI execution uses the task context pack by default. It retrieves the verified state or permanent archive only when the task requires it.

## Required controls

- Fingerprint each governed dispatch so unchanged work can be recognized.
- Reject duplicate or already-completed task dispatches.
- Reuse validation only when payload, commit, environment, and acceptance criteria are unchanged.
- Batch related repository operations into one reviewed implementation pass.
- Prefer completion events over repeated status polling.
- Review only changed visual regions while retaining approved baselines.
- Record provider, model, tokens, cached tokens, retries, fallback use, workspace, role, and task.
- Never invent missing historical usage or cost.
- Preserve protected Founder decisions and material-risk escalation.

## Model routing

Routine status, formatting, and deterministic checks use the lowest-capability governed model that satisfies the exact contract. Implementation and review use the role-matched model. Architecture, unresolved debugging, and material risk use a strong reasoning model. A routing change may not weaken acceptance criteria or Founder gates.

## Analytics contract

The Usage Analytics view is the Founder-facing control surface for:

- total tokens and requests;
- usage by provider, model, role, workspace, and task;
- cached-token reuse;
- retries and fallback overhead;
- recorded cost when available;
- highest measured usage driver;
- telemetry coverage and optimization recommendations.

Historical activity without exact provider telemetry remains explicitly labeled as unmetered.
