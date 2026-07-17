# FOS-FOUNDATION-014 Founder Walkthrough

## What was completed

Founder OS now has a product-agnostic observability layer for workspace metrics, health checks, service-level objectives, anomaly signals, incidents, and portfolio rollups.

## What changed

The Command Center can summarize operational health across workspaces while preserving each record's source workspace, freshness, quality, evidence, and immutable audit reference.

Observability can recommend a registered remediation workflow. It cannot execute consequential remediation or satisfy approval requirements.

## Founder experience

### Portfolio view

```text
FOUNDER COMMAND CENTER

Natural Nation          DEGRADED
Google AI provider errors affecting blueprint verification
Evidence current: 2 minutes ago
Founder attention: Required

Contractor Estimator    AT RISK
Regional pricing source showing elevated latency
Evidence current: 7 minutes ago
Founder attention: Required
```

Selecting Natural Nation opens the incident inside the Natural Nation workspace context.

### Incident detail

```text
NATURAL NATION — OPERATIONAL INCIDENT

Status: Detected
Severity: High
Source: Google AI provider
Affected workflow: AI-TASK-003
Correlation: Blueprint provider errors

Evidence:
- Provider error record
- Failed verification reference
- Current health timestamp

Recommended action:
Run registered Experience Verification workflow

[Dismiss Recommendation]
[Review Remediation]
```

`Review Remediation` opens the registered workflow and its normal governance requirements. It does not execute the workflow or approve any consequential result.

### Deduplication

Repeated provider signals with the same workspace and deduplication key update the existing incident rather than creating multiple Founder alerts.

### Data-quality warning

A stale or partial source is visibly labeled. Founder OS must not present an estimate as verified fact.

## What remains protected

No changes were made to authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or security-sensitive infrastructure.

Observability cannot expose protected payloads, infer Founder approval, combine workspace execution contexts, perform unregistered remediation, or expand AI, provider, connector, role, or tool authority.

## Approval boundary

This package defines and validates the observability contracts. Merge into `main` requires explicit Founder approval.
