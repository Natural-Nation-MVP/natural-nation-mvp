# FOS-FOUNDATION-013 — Integration Registry, Connector Governance, and External Action Boundary

## Status

Implementation candidate for Founder approval.

## Purpose

Founder OS requires a governed way to connect workspaces to external systems without allowing connectors to become an alternate authority path. This package defines the registry, ownership, permission, health, audit, and approval rules for all integrations.

## Constitutional rule

An integration may transport data or invoke a registered external capability. It may not grant authority, infer Founder approval, expose secrets, combine workspace contexts, bypass evidence or verification, or execute an unregistered consequential mutation.

## Core records

- Integration definition: product-agnostic provider and connector metadata.
- Connection: one workspace-scoped installation of an integration.
- Credential reference: opaque secret-manager reference only; never raw credential material.
- Capability: registered read or write operation with payload and approval rules.
- External action request: runtime-bound request to invoke one capability.
- Inbound event: provenance-preserving event received from an external system.
- Health record: connection availability, rate-limit, suspension, and revocation status.

## Ownership and isolation

Every connection belongs to exactly one workspace. Every invocation carries the same explicit workspace context through scheduling, execution, evidence, verification, notification, and audit layers. Cross-workspace connection use is blocked before a connector call occurs.

## Permission model

Capabilities are classified as:

- read: retrieve external state without mutation;
- write-routine: bounded, reversible, registered mutation;
- write-consequential: publishing, sending, billing, deletion, contract, deployment, financial, security-sensitive, or other externally consequential mutation.

Consequential writes require an explicit Founder approval record tied to the exact workspace, capability, payload digest, and execution request.

## Data handling

Outbound payloads are classified before delivery. Protected data is removed or delivery is blocked. Raw credentials, tokens, secrets, and protected security configuration are never placed in manifests, events, logs, evidence, notifications, or connector payload previews.

Inbound events preserve provider, connector, external event ID, received time, signature-verification result, workspace routing decision, correlation ID, and immutable audit reference.

## Reliability

Connections expose health states: pending, healthy, degraded, rate_limited, suspended, revoked, and unavailable. Retry policies must be bounded. Consequential writes require idempotency keys. Revoked or suspended connections cannot dispatch work.

## Founder experience

The Founder can review a connection, see its permissions, health, last successful use, and approval requirements. A notification may route the Founder to an approval context, but the notification itself cannot approve or execute the external action.

## Protected boundary

This package does not modify authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or other security-sensitive infrastructure protected by FOS-DIRECTIVE-001.
