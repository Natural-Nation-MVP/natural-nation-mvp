# NNCC-003 Run Guide

**Milestone:** NNCC-003  
**Status:** Draft Implementation  
**Purpose:** Run the Natural Nation Control Center locally.

---

## What This Adds

NNCC now has a runnable Expo application shell.

The root `App.tsx` mounts the Control Center and allows navigation between:

- Dashboard
- Founder Brief
- Milestones
- Approvals
- Decisions
- Repository Health
- AI Team Workspace

---

## Local Setup

From the repository root:

```bash
npm install
npm run web
```

Expo will print a local browser URL, usually:

```text
http://localhost:8081
```

Open that URL to view the Natural Nation Control Center.

---

## Available Commands

```bash
npm run start
npm run web
npm run ios
npm run android
npm run typecheck
```

---

## Current Data Source

NNCC currently uses TypeScript seed data and live-ready parser seed documents.

The next step is replacing seed documents with repository-loaded Knowledge System documents.

---

## Current Status

NNCC is now a runnable Founder dashboard foundation.

It is not yet deployed and it is not yet connected to live GitHub APIs at runtime.
