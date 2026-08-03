# Founder OS Browser Compatibility Audit — FOUNDER-UX-046

## Scope

Critical Founder OS interaction paths were audited for Safari, Chrome, Edge, and Firefox compatibility:

- Workspace-card activation
- Touch and pointer gestures inside the workspace carousel
- Founder OS Home and workspace sidebar routing
- Workspace view visibility
- Welcome Back / Account & Settings control
- Native dialog behavior
- Keyboard activation

## Confirmed Safari risks

1. Critical runtime files used optional chaining (`?.`) and nullish coalescing (`??`). Older Safari versions reject those files at parse time, preventing all listeners in the file from registering.
2. Workspace activation depended on Pointer Events without a Touch Events fallback.
3. Object-form smooth scrolling was used without a numeric fallback.
4. The Account & Settings control depended on native `<dialog>.showModal()` without a fallback.
5. View-state cleanup used optional Web Animations APIs without feature guards.
6. Several actions relied on `dataset` and modern iteration patterns throughout the critical event path.

## Compatibility standard applied

Critical interaction files now use broadly supported ES2018-compatible syntax and guarded browser APIs.

- No optional chaining or nullish coalescing in the critical interaction runtime.
- Pointer Events are preferred when available.
- Touch Events are used as the Safari fallback when Pointer Events are unavailable.
- Click and keyboard activation remain independent fallbacks.
- Touch and pointer routes preserve immutable workspace IDs.
- Scroll APIs use numeric fallbacks.
- Native dialog is used when supported; an accessible overlay fallback is used otherwise.
- Page activation is synchronous and explicitly restores visibility and pointer interaction.
- Web Animations calls are feature-detected.

## Supported baseline

The critical Founder OS navigation and settings path is designed for:

- Safari 12.1+
- iOS/iPadOS Safari 12.2+
- Current Chrome and Chromium Edge
- Current Firefox

Advanced non-critical modules may still use newer browser features and should be progressively audited as Founder OS moves toward production release.

## Required regression matrix

- Safari on iPad: tap each workspace card, drag carousel, release near a card, open greeting settings, close settings, use workspace sidebar.
- Safari on macOS: mouse click, keyboard Enter/Space, trackpad horizontal scroll.
- Chrome: repeat all primary actions.
- Firefox: repeat desktop actions and dialog fallback verification.
- Edge: repeat desktop actions.
