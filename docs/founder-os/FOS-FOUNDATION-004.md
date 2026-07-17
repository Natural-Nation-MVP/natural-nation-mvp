# FOS-FOUNDATION-004 — Workspace Activation and Readiness Engine

## Status
Implementation candidate

## Purpose
Define the controlled transition from a registered Draft workspace to an Active workspace.

Workspace creation and workspace activation are separate operations. Creation registers a reviewable Draft. Activation confirms that the workspace is ready for execution and requires explicit Founder approval.

## Canonical flow

1. Load a registered Draft workspace.
2. Evaluate required readiness checks.
3. Separate blocking failures from advisory findings.
4. Produce a Founder-visible activation report.
5. Deny activation when any blocking check fails.
6. Request explicit Founder approval when all blocking checks pass.
7. Record the approval decision and transition result.
8. Change lifecycle state from `draft` to `active` only after approval.

## Required blocking checks

- Workspace identity is complete.
- Purpose is defined.
- Workspace type is defined.
- Registry record exists.
- Lifecycle state is `draft`.
- Isolation metadata is complete.
- Governance profile is assigned.
- At least one initial project or execution objective exists.
- No unresolved approval-required field remains.
- Protected security boundary is unchanged.

## Advisory checks

Advisory findings remain visible but do not automatically block activation. Examples include incomplete optional branding, missing optional integrations, or an AI team that has not yet been expanded beyond the minimum required roles.

## Founder approval boundary

A passing readiness assessment does not activate a workspace automatically. Founder approval is required and must be represented as a deliberate approval decision tied to the readiness report.

## Activation result

An activation result records:

- workspace identifier
- previous lifecycle state
- requested lifecycle state
- readiness report identifier
- blocking and advisory findings
- Founder decision
- transition outcome
- timestamp
- audit reference

## Failure behavior

When activation is denied, Founder OS must return actionable remediation steps. The workspace remains in Draft and no execution capability is implied to be active.

## Product neutrality

The activation contract must work without product-specific fields. Natural Nation and a contractor-estimating workspace use the same activation rules.

## Protected boundary

This package does not modify authentication, authorization, identity, sessions, tokens, secrets handling, access controls, security middleware, preventative-security measures, or security-sensitive infrastructure.
