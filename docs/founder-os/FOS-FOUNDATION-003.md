# FOS-FOUNDATION-003 — Workspace Creation Experience

Status: Complete for Founder Review  
Authority: FOS-DIRECTIVE-001 and merged FOS-FOUNDATION-001/002

## Purpose
Define the product-agnostic experience that turns Founder intent into a validated Founder OS workspace without embedding Natural Nation-specific assumptions.

## Canonical flow
1. Capture plain-language intent.
2. Generate a reviewable draft.
3. Resolve name, slug, purpose, outcomes, workspace type, outputs, locations, integrations, AI team policy, approval policy, actions, metrics, health indicators, and delivery targets.
4. Mark every value as Founder-supplied, system-suggested, unresolved, or approval-required.
5. Validate the request.
6. Present the generated workspace contract.
7. Require explicit Founder confirmation.
8. Register the workspace in `draft` state.
9. Produce an audit event and readiness checklist.
10. Activate only after readiness rules pass.

## Rules
- Founder OS may suggest defaults but must not silently lock strategic choices.
- Creation requires explicit confirmation before registry mutation.
- Creation results in Draft, never automatic Active status.
- Activation is a separate lifecycle transition.
- The creation flow must remain product-agnostic.
- Protected authentication, authorization, identity, session, token, secrets, access-control, security middleware, preventative-security, and security-sensitive configuration are excluded.

## Required inputs
`name`, `slug`, `description`, `workspaceType`, `purpose`, `intendedOutcomes`, `outputTypes`, `isolationBoundary`, `knowledgeLocations`, `assetLocations`, `allowedIntegrations`, `aiTeamPolicyRef`, `approvalPolicyRef`, `projectCreationWorkflowRef`, `supportedActions`, `metrics`, `healthIndicators`, and `deliveryTargets`.

## Successful result
- Stable workspace ID
- Workspace sequence number
- Draft registry record
- Canonical workspace contract
- Audit event
- Readiness checklist
- Unresolved setup items

## Activation readiness
A draft may become Active only when required policy references resolve, required locations and integrations are configured or explicitly deferred, the workspace contract validates, no blocking item remains, and Founder approval exists where policy requires it.

## Workspace #2 proof
A contractor-estimating workspace can use the same contract as Natural Nation without changing Founder OS schemas or platform assumptions.

## Acceptance criteria
- Plain-language intent maps to a reviewable draft.
- Request and result contracts are machine-readable.
- Founder confirmation is required before registration.
- Successful creation produces Draft status.
- Invalid requests fail validation.
- A non-wellness Workspace #2 validates unchanged.
- No protected security code is modified.

After merge, work may continue to FOS-FOUNDATION-004 without pausing unless a protected or consequential Founder boundary is reached.
