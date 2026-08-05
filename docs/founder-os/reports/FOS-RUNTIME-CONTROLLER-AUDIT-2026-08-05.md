# Founder OS Runtime Controller Audit

**Audit ID:** FOS-RUNTIME-004  
**Date:** 2026-08-05  
**Scope:** Canonical Founder OS shell at `docs/founder-os/index.html`

## Result

The canonical shell now loads 19 static controllers. Three retired compatibility or recovery controllers were removed from both the shell and production tree.

## Authoritative ownership

| Responsibility | Authoritative owner |
|---|---|
| Runtime paths | `runtime-paths.js` |
| View visibility and active page state | `app.js` |
| Workspace, Home, sidebar, history, refresh, and direct-route navigation | `navigation-manager-035.js` |
| Workspace registry data and card rendering | `workspace-registry.js` |
| Founder Home layout, filters, search, and launch actions | `founder-ux-002.js` |
| Welcome Back, Account & Settings, and explicit Open Workspace button bindings | `founder-home-functionality.js` |
| Workspace creation flow | `workspace-creation.js` |
| Workspace identity review enhancement | `workspace-identity-ui.js` |
| Workspace lifecycle management | `workspace-manager.js` |
| Natural Nation planning and build gate | `workspace-flow.js` |
| Workspace knowledge isolation | `workspace-knowledge-scope.js` |
| Gateway protected requests | `gateway-client-v2.js` |
| Gateway status and approval runtime loading | `gateway-status.js` |
| Blueprint rendering | `blueprint-renderer.js` |
| Live Blueprint approval transaction | `live-approval-controller.js` |
| Natural Nation discovery rendering | `workspace-discovery.js` |
| Build runtime module loading and execution-bar visibility | `build-studio-polish.js` |
| Launch-control availability state | `interaction-availability.js` |
| External-link restriction policy | `internal-navigation-only.js` |

## Removed controllers

| Removed file | Reason |
|---|---|
| `founder-settings-dialog-fix.js` | Retired no-op shim. Settings are owned directly by `founder-home-functionality.js`. |
| `founder-interaction-stability-025.js` | Retired no-op carousel shim. The workspace portfolio is a static grid. |
| `founder-startup-recovery.js` | Obsolete global recovery layer. It duplicated view cleanup, removed active dialogs during normal navigation, and masked runtime failures. `app.js` and feature controllers now own their state directly. |

## Retained policy controllers

`internal-navigation-only.js` remains active because removing it changes the application’s external-navigation policy. It is isolated from workspace and sidebar controls. Its long-term disposition should be decided during the full action inventory.

`interaction-availability.js` remains active because it controls disabled states for Resume Setup, Duplicate Review, and Archived Workspaces. It does not route pages.

## Runtime contract

`scripts/validate-founder-runtime-controllers.mjs` now enforces:

- Exact static controller list and deterministic order.
- One load per static controller.
- One source-version identifier across the canonical shell.
- Absence of retired files and script references.
- Navigation ownership boundaries.
- Settings and explicit workspace-button ownership boundaries.
- Separation of presentation, availability, and external-link policy from routing.

## Follow-up findings for the action inventory

The following controllers still contain feature-specific direct event ownership and should be tested in the next action-inventory phase rather than removed here:

- `live-approval-controller.js`
- `workspace-manager.js`
- `workspace-flow.js`
- `blueprint-renderer.js`

These controls are not general page routers, but their actions should each receive an owner, selector, expected result, and browser-test case.
