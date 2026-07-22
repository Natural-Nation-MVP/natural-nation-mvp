# Section 2 — Founder Approval Inbox

## Scope

This slice adds a first-class Founder Approval Inbox to Founder OS and connects the homepage Action Center to exact approval records.

## Included

- Live Founder-owned approval queue from orchestration state
- Exact Action Center deep links
- Evidence, risks, recommendation, workspace, package, task, owner, status, and timestamp display
- Approve, request changes, defer, reject, and note controls
- Founder Key protection for state-changing decisions
- Safe loading, empty, unavailable, validation, and failure states
- Route-safe loading through `NNOSPaths`
- Responsive keyboard, touch, iPad, iPhone, and desktop layout
- Automated contract validation

## Compatibility

- Preserves `/`
- Preserves `/founder-os/`
- Preserves the existing Natural Nation canonical build workflow
- Reuses the existing Gateway task decision endpoint

## Review gate

Do not begin Section 3 until this slice is merged, deployed, and live-tested on desktop, iPad, and iPhone.