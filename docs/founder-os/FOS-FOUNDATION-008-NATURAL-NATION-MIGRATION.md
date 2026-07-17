# FOS-FOUNDATION-008 — Natural Nation Workspace #1 Migration

## Purpose

Represent Natural Nation as the first governed Founder OS workspace while preserving all approved Natural Nation product behavior and locked decisions.

## Result

Natural Nation is now declared as `workspace-001-natural-nation` and bound to the Founder OS workspace registry, routing contract, workflow/action registry, AI role registry, governance rules, evidence model, and approval system.

Founder OS owns platform concerns. Natural Nation continues to own its product projects, roadmap, releases, metrics, deliverables, AI team, and execution.

## Preserved product decisions

The migration does not redesign or reopen:

- navigation architecture
- dashboard structure
- Duey's mentor identity and safety boundaries
- Wellness Score™
- Rejuvenation Score™
- AGR-001
- Guest First
- feature-based repository structure
- FLOW-001 onboarding decisions

Any later change to these items remains a Founder decision.

## Compatibility behavior

Existing product endpoints remain recognizable, but Natural Nation-owned endpoints now require an explicit matching workspace context. Founder OS platform endpoints remain platform-owned. A missing or mismatched context is blocked and audited rather than silently routed.

The protected authentication boundary remains unchanged. Guest account upgrades continue to retain the canonical user UUID.

## Founder experience

The Founder sees Natural Nation in the Workspace Registry as Workspace #1. Opening it establishes the Natural Nation context. Founder OS can then show its projects, workflow status, AI team, evidence, metrics, and approvals without mixing records from another workspace.

Routine work may continue autonomously when its registered workflow, evidence, tool, and verification rules are satisfied. Locked product decisions, releases, external actions, financial actions, destructive actions, and security-boundary changes require Founder approval.

## Migration safety

This package is compatibility-preserving. It introduces declarative workspace bindings and validation only. It does not modify authentication, authorization, identity, sessions, tokens, secrets, access control, security middleware, preventative security, or other security-sensitive infrastructure.
