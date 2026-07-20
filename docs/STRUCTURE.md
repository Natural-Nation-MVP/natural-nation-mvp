# Natural Nation Docs Structure

## Public Website (`/docs`)

These files are published to GitHub Pages at https://natural-nation-mvp.github.io/natural-nation-mvp/

```
docs/
├── index.html                    ← Main landing page
├── assets/
│   ├── styles.css               ← Shared CSS
│   └── scripts.js               ← Shared JavaScript
├── pages/
│   ├── dashboard.html           ← Dashboard page
│   └── team.html                ← Team page (example)
└── founder-os/                  ← Founder OS runtime (keep as-is)
```

## Internal Documentation (`/docs/_internal`)

These files are NOT published to the web. Use these for project planning, decisions, and records.

```
docs/_internal/
├── PROJECT_STATE.md             ← Current project status
├── README.md                    ← How the docs are organized (for developers)
├── SESSION-LOG.md               ← Session history
├── DECISIONS/
│   └── DECISION-LEDGER.md
├── ARCHITECTURE/
│   └── GATEWAY-API-V2-BLUEPRINT-APPROVAL.md
├── RELEASES/
│   ├── PHASE-4-ROADMAP.md
│   └── PHASE-4.2-GITHUB-MANAGED-GATEWAY-COMPLETE.md
├── GOVERNANCE/
│   ├── NNOS-UX-001-EXPLAINABILITY-FIRST.md
│   └── NNOS-FLOW-001-END-TO-END-VERTICAL-SLICE.md
├── APPROVALS/
├── KNOWLEDGE/
├── AUDIT/
├── TRANSACTIONS/
└── EXECUTION-PACKAGES/
    └── NN-BUILD-001.json
```

## How to Edit

### Update the Main Page
Edit: `docs/index.html`
Result: Updates appear on the main website immediately (after GitHub Pages rebuilds)

### Update Styles
Edit: `docs/assets/styles.css`
Reference: Add `<link rel="stylesheet" href="./assets/styles.css">` in HTML pages

### Add Internal Documentation
Create files in: `docs/_internal/` (will NOT be published)

### Add a New Public Page
1. Create: `docs/pages/my-page.html`
2. Link to it: Add `<a href="./pages/my-page.html">My Page</a>` in `index.html`

## GitHub Pages Settings

✅ Source: Deploy from a branch
✅ Branch: main
✅ Folder: /docs

No special Jekyll config needed—just keep `.md` and `.html` files in `/docs`.
