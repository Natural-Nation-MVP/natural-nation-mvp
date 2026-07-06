# NNCC iPad Run Guide

**Purpose:** Open and run the Natural Nation Control Center from an iPad.

---

## Recommended Method

Use GitHub Codespaces from Safari or Chrome on iPad.

Codespaces gives you a browser-based VS Code workspace with a terminal, file explorer, and forwarded app preview.

---

## Step 1 — Open GitHub on iPad

1. Open Safari.
2. Go to GitHub.
3. Sign in to the account that owns or can access `Natural-Nation-MVP/natural-nation-mvp`.

---

## Step 2 — Open the Repository

Open:

```text
Natural-Nation-MVP/natural-nation-mvp
```

---

## Step 3 — Select the Control Center Branch

Switch to:

```text
feature/nncc-001-control-center-v1
```

---

## Step 4 — Start a Codespace

1. Tap the green Code button.
2. Choose Codespaces.
3. Create a codespace on the selected branch.

---

## Step 5 — Install Dependencies

When the Codespaces terminal opens, run:

```bash
npm install
```

---

## Step 6 — Start NNCC

Run:

```bash
npm run web
```

---

## Step 7 — Open the Dashboard

When the app starts, Codespaces should show a forwarded port message.

Open the forwarded browser preview to view NNCC on iPad.

The local development port is usually:

```text
8081
```

---

## What You Should See

The Natural Nation Control Center should open with sidebar navigation for:

- Dashboard
- Founder Brief
- Milestones
- Approvals
- Decisions
- Repository Health
- AI Team Workspace

---

## Current Limitation

NNCC currently uses seed data and live-ready parser seed documents.

The next build step is connecting NNCC to live repository files and GitHub runtime data.
