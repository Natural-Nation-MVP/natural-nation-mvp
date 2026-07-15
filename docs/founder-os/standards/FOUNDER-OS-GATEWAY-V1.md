# Founder OS Gateway v1 Standard

Status: Stabilization candidate  
Tracking: Issue #12

## 1. Canonical production flow

GitHub `main` is the production source of truth. Normal releases move through a feature branch, pull request, validation, Founder approval, merge to `main`, and Cloudflare Git deployment. Cloudflare Quick Editor is reserved for emergency recovery and must not replace the canonical repository workflow.

## 2. AI role virtualization

Founder OS roles are stable organizational identities. Providers are interchangeable execution engines.

A dispatch package defines the assigned role through its identity, title, purpose, allowed actions, approval boundaries, required input, expected output, workspace, package, task, and next role. A provider executes that package without taking permanent ownership of the role.

When the preferred provider cannot complete a request for an approved failover reason, the next configured provider temporarily assumes the same assigned role. Temporary role assumption ends when the request completes or fails.

Manual Founder actions never fall back to an AI provider.

## 3. Failover policy

Failover may occur for billing not enabled, connection failure, provider unavailability, quota exhaustion, rate limiting, or timeout.

Authentication, authorization, invalid request, workspace mismatch, permission, malformed request, and safety failures remain terminal. These failures must not be bypassed by trying another provider.

Only one successful result may be recorded for a dispatch.

## 4. Routing audit

Each provider delivery record must preserve:

- assigned role
- preferred provider
- executing provider
- fallback usage and reason
- temporary role assumption
- role relinquishment after completion
- every provider attempt and normalized outcome
- dispatch, workspace, package, and task identifiers

## 5. Configuration readiness

A direct-provider deployment is configured when all protected Gateway and canonical GitHub bindings are present and at least one direct AI provider is configured.

`AI_CALLBACK_TOKEN` and `GATEWAY_PUBLIC_URL` support the legacy callback path. Their absence must be reported but must not mark a direct-provider deployment unconfigured.

## 6. Structured observability

Production logs use JSON records with an event name, timestamp, service identity, routing identifiers, provider outcome, and normalized error category where applicable. Secrets, credentials, authorization headers, and API keys must never be logged.

Required event families:

- dispatch validation and start
- provider attempt
- provider failover
- provider completion
- terminal provider failure
- canonical result completion

## 7. Change control

Until Issue #12 is completed, changes to role identity, provider routing, failover categories, canonical repository writes, or the production deployment path require explicit Founder approval.
