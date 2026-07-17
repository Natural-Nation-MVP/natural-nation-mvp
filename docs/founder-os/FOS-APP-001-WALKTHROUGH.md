# FOS-APP-001 Founder Walkthrough

Open `founder-os/app/index.html` through any static web server. The responsive Command Center displays platform health and separate workspace views for Natural Nation (Workspace #1) and Contractor Estimator (Workspace #2).

Each workspace includes execution runs, pending approvals, health and incidents, schedules, cost indicators, release status, evidence, and audit-oriented summaries. Switching workspaces replaces the entire view so data is never combined.

## Validate

```bash
node scripts/validate-command-center.mjs
```

The validator confirms workspace identity/order, required panels, responsive styles, accessibility landmarks, and absence of protected credential fields.