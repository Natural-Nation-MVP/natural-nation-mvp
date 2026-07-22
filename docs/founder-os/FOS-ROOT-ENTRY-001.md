# FOS-ROOT-ENTRY-001 — Founder OS Root Entry Architecture

Status: Approved and implemented  
Authority: Founder approval, 2026-07-21  
Related: FOS-MIGRATION-001, deploy-founder-os-pilot.yml

## 1. Decision

Founder OS is the primary GitHub Pages application for this repository.

The repository root Pages URL must open Founder OS directly. The former Natural Nation Control Center landing page is retired as the root experience.

## 2. Canonical public routes

```text
/
└── Founder OS workspace registry and platform shell

/founder-os/
└── Compatibility route containing the same Founder OS application assets
```

The root route is canonical. The `/founder-os/` route remains available during migration so existing links and bookmarks continue to work.

## 3. Source ownership

```text
docs/index.html
└── canonical root application shell

docs/founder-os/
├── css/
├── js/
├── config/
├── pilot/
├── reports/
├── standards/
└── compatibility index.html
```

The root `docs/index.html` loads shared Founder OS assets from `docs/founder-os/`.

## 4. Platform model

Founder OS is the platform. Natural Nation is Workspace #1 inside Founder OS.

```text
Founder OS
├── Workspace Registry
├── Natural Nation
├── Knowledge
├── AI Team
├── Repository Status
├── Build Work
└── Future Workspaces
```

Natural Nation must not act as a separate front door to Founder OS.

## 5. Deployment model

The GitHub Pages workflow publishes:

```text
_site/index.html          ← docs/index.html
_site/founder-os/**       ← docs/founder-os/**
```

Changes to either `docs/index.html` or `docs/founder-os/**` trigger validation and deployment.

## 6. Compatibility and rollback

Compatibility is preserved by retaining `/founder-os/` during migration.

Rollback is possible by restoring the former `docs/index.html` landing page and previous workflow packaging behavior from Git history.

## 7. Next implementation priority

With the entry architecture simplified, development returns to making Founder OS usable as a platform:

1. Validate the workspace registry and navigation at the root URL.
2. Remove duplicate shell maintenance where practical.
3. Make platform actions functional instead of display-only.
4. Keep Natural Nation scoped as Workspace #1.
5. Add future workspaces without changing Founder OS core behavior.
