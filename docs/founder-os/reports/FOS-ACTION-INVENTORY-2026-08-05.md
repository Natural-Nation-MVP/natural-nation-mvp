# Founder OS Action Inventory

**Inventory ID:** FOS-ACTIONS-005  
**Date:** 2026-08-05  
**Scope:** Canonical Founder OS shell, static controllers, and dynamically loaded Founder OS action controllers

## Result

Every current control family now has an explicit selector, authoritative controller, availability rule, expected outcome, and browser-test assignment in `config/action-inventory.json`.

The inventory covers Founder Home, workspace navigation, Workspace Discovery, workspace lifecycle management, planning and Blueprint actions, Build Work, task details, the Founder Action Center, the Approval Inbox, Mission Control, AI task execution, and workspace-scoped Project Records.

## Conflicts found and corrected

### Duplicate Blueprint approval runtime

`gateway-status.js` dynamically loaded `blueprint-approval-transaction.js`, while `live-approval-controller.js` also owned `[data-approve-blueprint]`.

The retired controller wrote a local approval transaction and created a legacy dialog. The live controller performs the protected Gateway and canonical GitHub transaction. Loading both created duplicate capture-phase ownership and required cleanup observers.

Resolution:

- `live-approval-controller.js` is the sole action owner.
- `gateway-status.js` now reports Gateway status only.
- `blueprint-approval-transaction.js` and `blueprint-approval.css` were removed.
- Legacy dialog suppression and mutation cleanup were removed from the live controller.

### Duplicate planning-review ownership and missing Blueprint route

Both `blueprint-renderer.js` and `workspace-flow.js` handled `[data-review-blueprint]`.

After duplicate ownership was removed, browser execution also proved that the resolved **Continue to Blueprint** state updated its label but did not navigate when live Build Work was unavailable.

Resolution:

- `workspace-flow.js` is the sole owner because it knows whether the next valid destination is Approved Plan or live Build Work.
- `blueprint-renderer.js` is presentation-only.
- A resolved planning decision now always opens Blueprint through Navigation Manager when Build Work is unavailable.
- When Build Work is available, the same control opens the live Build Work view and refreshes its canonical runtime.

### Founder Action Center stale workspace route

The Action Center searched for the retired `[data-resume-workspace]` control and then called `setWorkspace` after a delay. The selector no longer existed, and direct view activation could occur without the correct active workspace identity.

Resolution:

- Action Center workspace actions now call `NNOSNavigationManager.openWorkspace()`.
- Optional destination views open only after the workspace route succeeds.
- Failed routes render an Action Center error instead of silently doing nothing.
- Browser coverage now opens the Action Center from its actual Product Overview surface rather than from Founder Home.

### Mission Control legacy and fallback actions

Mission Control contained inline `onclick` handlers, legacy `data-workspace-button` lookups, and simple hash routes such as `#repo` that conflicted with the canonical workspace route format.

Live Gateway fallback rendering could also replace the Product Overview contents and remove every Mission Control control.

Resolution:

- Inline actions were replaced with `[data-mission-action]` controls.
- Supporting records use `[data-mission-view]` controls.
- Every view change goes through Navigation Manager.
- Dead deployment-relative document links were replaced with functional Code Status or Product Records destinations.
- A dedicated Mission Control runtime surface and observer restore the owned controls when fallback rendering replaces the surrounding view.

### Duplicate Project Records ownership and inline handlers

`workspace-knowledge-scope.js` and `knowledge-engine.js` both rendered Project Records and listened for user interactions. The Knowledge Engine also generated inline `onclick` handlers for audit, category, related-record, and record-review actions.

Resolution:

- `knowledge-engine.js` is the sole Project Records renderer and interaction owner.
- `workspace-knowledge-scope.js` is now a presentation-free workspace-scoping helper.
- All Project Records actions use delegated `[data-knowledge-action]` controls.
- Inline event attributes are prohibited by the validator and browser suite.

### Unowned Build Work buttons

The canonical shell displayed Generate, Validate, Download, and Copy buttons from an older Build Studio runtime. The current runtime disabled some of them but did not own their actions.

Resolution:

- The legacy button family was removed from the shell.
- Build Work now exposes one owned `[data-build-refresh]` action in the right rail and action bar.
- `canonical-build-runtime-v2.js` owns the refresh lifecycle and busy state.
- `build-dispatch-bridge.js` now manages only the protected AI dispatch and reset controls it actually supports.

### Missing local repository review context

The Pages deployment generates `repository-review-context.js`, but local and cross-browser QA previously requested a file that did not exist until deployment.

Resolution:

- Source now includes a safe null-context fallback.
- The deployment workflow continues to replace that fallback with the reviewed pull-request context in the published artifact.
- Local development and browser QA no longer produce the hidden runtime 404.

### Retired selector aliases

The active action runtime still referenced historical selectors:

- `data-workspace-button`
- `data-resume-workspace`
- `data-context-module`
- `data-page-link-view`

These aliases were removed from the canonical action path. The static shell now uses `data-nav-home`, and `app.js` updates only canonical `data-nav-view` controls.

## Authoritative action boundaries

| Responsibility | Owner |
|---|---|
| Home and sidebar history navigation | `navigation-manager-035.js` |
| View visibility | `app.js` |
| Founder settings and workspace-card buttons | `founder-home-functionality.js` |
| Launch actions, portfolio filters, and search | `founder-ux-002.js` |
| Workspace Discovery | `workspace-creation.js` |
| Workspace lifecycle actions | `workspace-manager.js` |
| Planning review and Build Work gate | `workspace-flow.js` |
| Blueprint approval transaction | `live-approval-controller.js` |
| Build status refresh | `canonical-build-runtime-v2.js` |
| Build task details | `founder-task-details.js` |
| Founder Action Center | `founder-action-center.js` |
| Approval Inbox | `founder-approval-inbox.js` |
| Mission supporting and closeout controls | `mission-control.js` |
| Protected AI task dispatch and reset | `ai-orchestration.js` |
| Project Records rendering, search, audit, and review | `knowledge-engine.js` |
| Project Records workspace scoping | `workspace-knowledge-scope.js` |

## Enforcement

`scripts/validate-founder-action-inventory.mjs` enforces:

- Unique action IDs and selectors.
- Complete owner, availability, outcome, and test metadata.
- Owner-file existence and selector presence.
- Coverage for every data-attributed static interactive control.
- Absence of legacy selector aliases and inline click handlers.
- Single ownership for planning review, Blueprint approval, and Project Records presentation.
- Removal of the duplicate local approval runtime.
- Removal of unowned Build Studio button controls.
- Navigation Manager usage by the Action Center, Mission Control, Founder utility actions, and planning review.
- Mission Control action recovery after fallback rendering.

The validator is part of both stabilization and deployment gates. The browser suite exercises the same action contract in Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari.
