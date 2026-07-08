# Founder OS

Founder OS is the canonical web runtime for Natural Nation founder/developer operations.

## Live Path

```text
https://natural-nation-mvp.github.io/natural-nation-mvp/apps/founder-os/
```

## Cache-Safe Release 2 Path

```text
https://natural-nation-mvp.github.io/natural-nation-mvp/apps/founder-os/v2/
```

## Runtime Decision

Founder OS is treated as a static web operating environment for GitHub Pages first.

Expo remains useful for mobile/app experiments, but Founder OS should be reviewed through the GitHub Pages route above.

## Current Design Standard

```text
NNDS-002 — Natural Nation Glass
```

Approved visual direction:

- Natural Nation stone background
- Glass-style cards and windows
- Natural Nation green primary accents
- Purple AI/orchestration accents
- Gold Founder/approval accents
- Square button corners
- Right-side always-visible scrollable queue
- Collapsed utility panels below queue
- Bottom command bar

## Deployment Fix

A GitHub Pages deployment workflow now publishes the repository root so `/apps/founder-os/` resolves from this folder instead of any older deployment artifact.

```text
.github/workflows/deploy-founder-os.yml
```

## Update Rule

When Founder OS is changed, update this folder directly. The deployment workflow should publish the corrected static Founder OS route after changes land on `main`.
