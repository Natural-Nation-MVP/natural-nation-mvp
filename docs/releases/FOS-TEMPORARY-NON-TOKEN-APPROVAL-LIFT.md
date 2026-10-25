# Temporary non-token approval lift — AI Work Queue

Status: temporary, opt-in, reversible. Not merged. Founder approval is still
required to merge this change and to enable it in production.

## What "token" means here

Token = AI usage tokens that cost money. A token-consuming task is any work
that calls a paid AI provider or API, including redundant or repeated calls
that drain tokens. A non-token task costs no provider tokens: local code,
docs, UI, tests, and other work with no paid call.

## What is lifted, and what is not

Lifted, only while the lift is active:
- Founder-class queue items explicitly declared `costImpact: "none"` at
  creation may complete via `complete-non-token` with evidence, without a
  Founder decision.

Never lifted:
- Any item declared `costImpact: "token-consuming"`.
- Any item with no cost impact recorded (older items and undeclared work
  default to token-consuming).
- Work without evidence, and work that is not active or blocked.
- Production merges and deployments — those still require Founder approval
  separately. Completing a queue item does not deploy anything.

## How it is controlled

- Env flag: `FOUNDER_APPROVAL_LIFT_NON_TOKEN="true"`.
- Optional expiry: `FOUNDER_APPROVAL_LIFT_NON_TOKEN_UNTIL` (ISO date). After
  that time the lift stops applying. An invalid expiry disables the lift.
- The field is named `costImpact`, not `tokenImpact`, because the queue
  sanitizer strips token-named keys and would otherwise drop the field.
- Cost impact is declared by the Founder at item creation and is never
  inferred from a title or description, so wording cannot sneak a
  token-consuming task past the gate.
- Every completion under the lift records `approvalLift` on the item and a
  `completed-under-non-token-lift` ledger event, so lifted completions are
  auditable after the lift ends.

## To restore full Founder approval

Set `FOUNDER_APPROVAL_LIFT_NON_TOKEN` to anything other than `"true"` (or
remove it), or let the expiry pass. No code change is needed to restore it.
Removing this feature entirely means deleting `completeNonTokenQueueItem`,
the `complete-non-token` route, and this document.
