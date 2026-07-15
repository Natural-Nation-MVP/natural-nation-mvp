# Founder OS Stabilization v1 — Test Matrix

Status: Active

Issue: #4

Branch: `stabilization/founder-os-runtime-v1`

## Release objective

Prove that Founder OS operates through one canonical runtime, isolates every workspace, preserves protected execution behavior, and fails safely.

## Architecture validation

| ID | Test | Expected result |
|---|---|---|
| ARCH-001 | Load Founder OS workspace | Only Founder OS modules are available |
| ARCH-002 | Load Natural Nation workspace | Only Natural Nation modules and records are available |
| ARCH-003 | Attempt unsupported module route | Route fails closed and redirects safely |
| ARCH-004 | Inspect runtime script graph | One owner per protected action and canonical renderer |
| ARCH-005 | Inspect canonical record schemas | Every workspace-owned record contains matching `workspaceId` |

## Workspace isolation

| ID | Test | Expected result |
|---|---|---|
| ISO-001 | Open Founder OS after Natural Nation Build Studio | NN-BUILD-001 and Natural Nation queue are cleared |
| ISO-002 | Open Natural Nation after Founder OS | Founder OS operational records are cleared |
| ISO-003 | Load Natural Nation package while Founder OS is active | Package is rejected or not requested |
| ISO-004 | Change workspace during an in-flight request | Stale response cannot overwrite active workspace |
| ISO-005 | Refresh each workspace directly | Correct workspace identity and module set are restored |

## Canonical state

| ID | Test | Expected result |
|---|---|---|
| STATE-001 | Load approved Natural Nation Discovery | Billing appears as approved; no unresolved billing question |
| STATE-002 | Load approved Blueprint | Status, lock, transaction, and open-decision count match GitHub |
| STATE-003 | Load Build Studio | Package transaction matches Blueprint transaction |
| STATE-004 | Remove or corrupt package in test fixture | Build Studio remains locked |
| STATE-005 | Switch workspaces repeatedly | No browser-local canonical state is created |

## Protected actions

| ID | Test | Expected result |
|---|---|---|
| EXEC-001 | Run approval dry run | Validation passes with zero repository writes |
| EXEC-002 | Submit invalid Founder key | Request rejected with zero writes |
| EXEC-003 | Retry identical approved transaction | No duplicate canonical transaction is created |
| EXEC-004 | Submit package for wrong workspace | Request rejected |
| EXEC-005 | Gateway returns success before publication is visible | UI waits for canonical publication verification |
| EXEC-006 | Gateway times out | UI exits loading state and explains retry safely |

## Runtime cleanup

| ID | Test | Expected result |
|---|---|---|
| CLEAN-001 | Search live HTML for deleted script paths | No dead script references |
| CLEAN-002 | Count Gateway clients | One active Gateway client |
| CLEAN-003 | Count package renderers | One canonical package renderer |
| CLEAN-004 | Inspect event listeners for protected actions | One authoritative handler per action |
| CLEAN-005 | Inspect local/session storage use | No storage-backed canonical approvals, packages, or queues |

## UX and device validation

| ID | Test | Expected result |
|---|---|---|
| UX-001 | Desktop workspace switching | Correct content, navigation, and execution bars |
| UX-002 | iPad landscape | No clipped action bar or inaccessible content |
| UX-003 | iPad portrait | Responsive navigation and static mobile action bar behave correctly |
| UX-004 | Loading/error/empty states | Clear, truthful, recoverable states |
| UX-005 | Keyboard navigation | Dialogs, navigation, and actions remain operable |

## Repository and deployment

| ID | Test | Expected result |
|---|---|---|
| REL-001 | Run repository checks | All required checks pass |
| REL-002 | Verify Gateway health/configuration | Online and all required bindings true |
| REL-003 | Verify GitHub Pages deployment | Published commit matches release candidate |
| REL-004 | Verify canonical approval artifacts | Existing transaction and NN-BUILD-001 remain intact |
| REL-005 | Compare branch to main | Only documented stabilization changes are present |

## Exit criteria

- All critical tests pass.
- No cross-workspace leakage remains.
- No duplicate or fallback protected-action paths remain.
- Live deployment matches the reviewed release candidate.
- Remaining technical debt is documented as non-blocking.
- Founder receives a concise verified release report rather than raw debugging work.
