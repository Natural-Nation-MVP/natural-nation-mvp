# Founder OS Decision Ledger

Status: Active

## Purpose

The Decision Ledger records Founder approval events without duplicating full source documents. Each decision points back to the canonical source of truth.

## Ledger Rules

- Record approvals as events.
- Reference canonical documents instead of copying them.
- Include affected workspace, release, status, and related commits when known.
- Use ADRs for architecture decisions that require fuller explanation.

## Decisions

| ID | Decision | Release | Workspace | Status | Canonical Source |
| --- | --- | --- | --- | --- | --- |
| DL-001 | GitHub is the canonical source of truth for Natural Nation and Founder OS | R3 | Governance | Approved | docs/governance/NNOS-GOV-001.md |
| DL-002 | Continuous synchronization standard approved | R3 | Governance | Approved | docs/governance/SYNC-STANDARD.md |
| DL-003 | Founder OS Operating Model v1 approved | R3 | Founder OS | Approved | docs/knowledge/founder-os/operating-model-v1.md |
| DL-004 | Mission Control foundation approved | R3 | Mission Control | Approved | docs/knowledge/founder-os/mission-control.md |
| DL-005 | AI Operations foundation approved | R3 | AI Operations | Approved | docs/knowledge/founder-os/ai-operations.md |
| DL-006 | Single Source of Truth standard approved | R3 | Founder OS | Approved | docs/knowledge/founder-os/source-of-truth.md |
| DL-007 | Founder Action Layer v1 approved | R3 | Founder OS | Approved | docs/releases/VALIDATION-EVENT-FOUNDER-ACTION-LAYER.md |
| DL-008 | Release 3 Foundation approved as current production baseline | R3 | Release | Approved | docs/releases/RELEASE-3-VALIDATION-STATUS.md |
| DL-009 | Phase Completion Standard approved | R4 | Governance | Approved | docs/governance/PHASE-COMPLETION-STANDARD.md |
| DL-010 | Phase 4 begins as Automation Environment Foundation | R4 | Roadmap | Approved | docs/releases/PHASE-4-ROADMAP.md |
| DL-011 | Cloudflare Workers selected as secure command gateway | R4 | Automation | Approved | docs/releases/PHASE-4-PLATFORM-DECISIONS.md |
| DL-012 | GitHub Pages retained as Founder OS UI host | R4 | Hosting | Approved | docs/releases/PHASE-4-PLATFORM-DECISIONS.md |
| DL-013 | Repository strategy approved with Founder OS managing automation and Natural Nation App shipping app and branding page lanes | R4 | Repository | Approved | docs/releases/PHASE-4-REPOSITORY-STRATEGY.md |
| DL-014 | Phase 4.1 platform and repository foundation approved | R4 | Foundation | Approved | docs/releases/PHASE-4-FOUNDATION-APPROVAL.md |
| DL-015 | Founder OS repository foundation validated | R4 | Repository | Approved | docs/releases/PHASE-4-FOUNDER-OS-REPOSITORY-FOUNDATION.md |
| DL-016 | Natural Nation App repository foundation recorded as pending external repository creation | R4 | Repository | Pending | docs/releases/PHASE-4-NATURAL-NATION-APP-REPOSITORY-FOUNDATION.md |
| DL-017 | Founder OS Vision v2 approved as a reusable AI-powered product creation platform | R4 | Product Strategy | Approved | docs/releases/PHASE-4-FOUNDER-OS-VISION-V2.md |
| DL-018 | Natural Nation designated as Project #1 of Founder OS | R4 | Product Strategy | Approved | docs/releases/PHASE-4-FOUNDER-OS-VISION-V2.md |
| DL-019 | Cloudflare account security foundation completed with verified two-factor authentication | R4 | Security | Complete | docs/releases/PHASE-4-CLOUDFLARE-SECURITY-FOUNDATION.md |
| DL-020 | Founder OS Gateway API v1 structure approved | R4 | Gateway | Approved | docs/releases/PHASE-4-GATEWAY-API-V1.md |
| DL-021 | Public gateway routes GET /, GET /health, and GET /version validated | R4 | Gateway | Complete | docs/releases/PHASE-4-GATEWAY-API-V1.md |
| DL-022 | Workspace Registry approved as the default Command Center landing experience | R4 | Command Center | Approved | docs/releases/COMMAND-CENTER-UX-V1.1.md |
| DL-023 | Command Center UX v1.1 approved with Founder metrics, living cards, contextual navigation, and motion | R4 | Command Center | Approved | docs/releases/COMMAND-CENTER-UX-V1.1.md |
| DL-024 | AI-guided product development operating system positioning deferred for future marketing | R4 | Marketing Backlog | Deferred | docs/releases/COMMAND-CENTER-UX-V1.1.md |
| DL-025 | Workspace Discovery and Blueprint Engine approved | R4 | Intelligence | Approved | docs/releases/WORKSPACE-DISCOVERY-BLUEPRINT-ENGINE.md |
| DL-026 | Application recommendations must be classified as Required, Recommended, or Later | R4 | Intelligence | Approved | docs/releases/WORKSPACE-DISCOVERY-BLUEPRINT-ENGINE.md |
| DL-027 | Natural Nation selected as the first real blueprint validation workspace | R4 | Natural Nation | Approved | docs/releases/WORKSPACE-DISCOVERY-BLUEPRINT-ENGINE.md |
| DL-028 | Digital Company Builder retained as a strategic future direction | R4 | Strategy Backlog | Deferred | docs/releases/WORKSPACE-DISCOVERY-BLUEPRINT-ENGINE.md |
| DL-029 | NNOS-UX-001 Explainability First approved as a platform-wide UX standard | R4 | Founder OS | Approved | docs/governance/NNOS-UX-001-EXPLAINABILITY-FIRST.md |
| DL-030 | AI recommendations must expose an Explain action with reasoning, confidence, sources, and history | R4 | Founder OS | Approved | docs/governance/NNOS-UX-001-EXPLAINABILITY-FIRST.md |
| DL-031 | Supporting sources must link to canonical documents and respect source-authority ranking | R4 | Governance | Approved | docs/governance/NNOS-UX-001-EXPLAINABILITY-FIRST.md |
| DL-032 | Founder Intelligence remains a shared platform service and not a required primary-navigation page | R4 | Architecture | Approved | docs/governance/NNOS-UX-001-EXPLAINABILITY-FIRST.md |
| DL-033 | Natural Nation Blueprint uses Our Mission and positive purpose-led language | R4 | Natural Nation | Approved | docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.2.md |
| DL-034 | Blueprint uses What We’re Building, Core User Experience, and Deployment Phases terminology | R4 | Natural Nation | Approved | docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.2.md |
| DL-035 | Components and recommendations are unified with visual executive metrics | R4 | Founder OS | Approved | docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.2.md |
| DL-036 | CRM terminology replaced with Community for Natural Nation | R4 | Natural Nation | Approved | docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.2.md |
| DL-037 | Blueprint approval controls use a sticky Build Studio-style action bar | R4 | Founder OS | Superseded | docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.3.md |
| DL-038 | NNOS-UX-002 standardizes the exact Build Studio bottom action bar for every execution-style page | R4 | Founder OS | Approved | docs/governance/NNOS-UX-002-EXECUTION-ACTION-BAR.md |
| DL-039 | Execution action bars must live at the application-shell layer outside page main content | R4 | Architecture | Approved | docs/governance/NNOS-UX-002-EXECUTION-ACTION-BAR.md |
| DL-040 | Blueprint cards use compact spacing and the standard tag, title, and text hierarchy | R4 | Founder OS | Approved | docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.3.md |
| DL-041 | Blueprint execution-bar visibility, compact height, and cache-busted production fix passed Founder validation | R4 | Founder OS | Approved | docs/releases/VALIDATION-EVENT-BLUEPRINT-EXECUTION-BAR.md |

## Related Records

- docs/releases/PHASE-4-ROADMAP.md
- docs/releases/PHASE-4-FOUNDER-OS-VISION-V2.md
- docs/releases/PHASE-4-CLOUDFLARE-SECURITY-FOUNDATION.md
- docs/releases/PHASE-4-GATEWAY-API-V1.md
- docs/releases/COMMAND-CENTER-UX-V1.1.md
- docs/releases/WORKSPACE-DISCOVERY-BLUEPRINT-ENGINE.md
- docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.2.md
- docs/releases/NATURAL-NATION-WORKSPACE-BLUEPRINT-V0.3.md
- docs/releases/VALIDATION-EVENT-BLUEPRINT-EXECUTION-BAR.md
- docs/governance/NNOS-UX-001-EXPLAINABILITY-FIRST.md
- docs/governance/NNOS-UX-002-EXECUTION-ACTION-BAR.md
- docs/releases/PHASE-4-PLATFORM-DECISIONS.md
- docs/releases/PHASE-4-REPOSITORY-STRATEGY.md
- docs/governance/SYNC-STANDARD.md
- docs/governance/PHASE-COMPLETION-STANDARD.md
