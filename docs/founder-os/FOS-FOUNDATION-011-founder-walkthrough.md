# FOS-FOUNDATION-011 Founder Walkthrough

## What this package adds

Founder OS converts audited platform and workspace events into governed attention items and delivery requests. It provides one portfolio-level attention experience while preserving each event's owning workspace.

## Natural Nation approval notification

The Founder receives:

```text
NATURAL NATION
Release evidence is ready for review.
Severity: High
Verification: Passed

[Open Approval Context]
```

The notification does not include Approve or Reject controls. Opening it establishes or requests the Natural Nation workspace context and displays the registered approval evidence. The execution run remains paused until the Founder records an explicit decision inside the approval context.

## Repeated Contractor Estimator outage

Two provider-unavailable events share the same owner, subject, type, and correlation identifier. Founder OS produces one attention item:

```text
CONTRACTOR ESTIMATOR
Primary estimate provider unavailable
Occurrences: 2
Last seen: 1:07 PM
Recovery: fallback route scheduled

[Open Run]
```

The notification does not start a different workflow, alter permissions, or combine this run with Natural Nation.

## Critical protected-data safeguard

When an outbound notification candidate contains protected data, delivery is blocked before any channel is invoked:

```text
DELIVERY BLOCKED
Protected data detected in notification payload.
Redaction required.
Audit event recorded.
```

## Founder authority boundary

Notifications may:

- inform the Founder
- route the Founder to the correct workspace or platform context
- request acknowledgement
- show status, evidence references, and remediation guidance

Notifications may not:

- infer approval
- approve or reject consequential actions
- execute workspace mutations
- combine workspace contexts
- expose secrets or protected security data
- grant authority to AI roles, providers, models, or tools

## Protected systems

This package does not modify authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or other security-sensitive infrastructure.
