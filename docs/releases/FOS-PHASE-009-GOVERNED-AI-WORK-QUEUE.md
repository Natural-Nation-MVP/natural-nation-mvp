# FOS Phase 9 — Governed AI Work Queue

Status: implementation candidate  
Tracking issue: #109

## Outcome

Phase 9 adds a durable, workspace-scoped queue that lets governed AI roles claim approved work, report progress, attach evidence, request Founder decisions, and complete routine assignments. Queue events are recorded in the Phase 8 execution ledger so current activity and history share one evidence trail.

## Founder experience

The AI Team screen now begins with a compact work queue showing:

- Active, ready, approval, and blocked totals.
- Founder decisions before routine work.
- Active owners, progress, next actions, and evidence state.
- Ready work and completed history.
- A one-column mobile layout with contained filters and details.

The screen is read-only. It does not let the browser impersonate an AI role or make protected decisions.

## Governance boundaries

- Queue storage is isolated by immutable workspace ID.
- The browser receives a sanitized read-only queue.
- All queue mutations require authenticated mutations through the Founder gateway.
- AI callbacks must declare a registered agent role and may update only work they own.
- Revision checks prevent duplicate or stale claims.
- Protected work cannot complete without evidence and a Founder decision.
- Routine completion still requires evidence.
- Queue events are appended to the execution ledger.
- Secrets and secret-shaped fields are removed before storage or presentation.
- The queue is bounded to 200 records per workspace.

## Verification

The Phase 9 contract validates:

- Workspace isolation.
- Role permissions and ownership.
- Duplicate-claim protection.
- Evidence requirements.
- Founder approval routing.
- Durable queue capability registration.
- Canonical runtime-controller registration.
- Responsive desktop and mobile presentation.
- Cross-browser loading and containment.

## Deployment boundary

This phase does not grant autonomous architecture, security, production-policy, or Founder-decision authority. It provides durable governed execution within previously approved scope.
