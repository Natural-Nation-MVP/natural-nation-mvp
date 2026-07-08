# NN-ARCH-001 — Founder OS Architecture Standard

## Status

Approved and active.

## Purpose

Founder OS is the Natural Nation founder/developer operating system. It is the central place for project status, AI build orchestration, repository intelligence, release readiness, approvals, and traceability.

## Canonical Public Runtime

```text
docs/founder-os/
```

## Live URL

```text
https://natural-nation-mvp.github.io/natural-nation-mvp/founder-os/
```

## Deployment Standard

```text
main
  ↓
/docs
  ↓
GitHub Pages
  ↓
/founder-os/
```

## Repository Layout

```text
natural-nation-mvp/
├── app/                  # application source
├── docs/                 # GitHub Pages and formal documentation
│   └── founder-os/       # only public Founder OS runtime
├── knowledge/            # canonical knowledge system
├── resources/            # shared assets
└── .github/              # workflows and automation
```

## Workspace Model

Founder OS is a workspace platform. Each workspace should follow the same operating pattern:

```text
Overview
Actions
Queue
Context
Execution
History
```

## Core Workspaces

- Mission Control
- Knowledge Graph
- Build Studio
- Repository Intelligence
- AI Team
- Operations
- Release Center
- Analytics
- Duey Intelligence
- Settings

## Design System

```text
NNDS-002 — Natural Nation Glass
```

Design rules:

- Natural Nation stone background
- Glass panels and windows
- Natural Nation green primary accents
- Purple AI/orchestration accents
- Gold Founder/approval accents
- Square button corners
- Engineering layout
- iPad-first responsive design

## AI Build Package Standard

Every build item must define:

- Plain English explanation
- Technical explanation
- Assigned AI role
- Delivery target
- Acceptance criteria
- Dependencies
- Context paths
- Export format
- Founder approval status

## Source-of-Truth Rule

One location. One owner. One deployment. One runtime.

No duplicate public Founder OS paths.

## Legacy Paths

These paths are legacy and should not be used for the public runtime:

```text
apps/founder-os/
docs/apps/founder-os/
```

## Governance Rule

Founder approval is required before changing:

- public runtime path
- deployment source
- design system standard
- workspace model
- build package standard
- source-of-truth location
