# NN-KS-003 — Natural Nation Knowledge Base Index

Status: Founder Approved
Knowledge Base ID: `natural-nation-kb`
Workspace ID: `natural-nation`

## Purpose

This is the canonical knowledge entry point for the Natural Nation product only.

It includes product strategy, onboarding, Duey, wellness protocols, design, nutrition, API, testing, releases, and product decisions that belong to Natural Nation.

Founder OS system architecture, workspace lifecycle, gateway operations, repository management, orchestration control, and Founder OS UX are explicitly excluded.

## Isolation Rule

Every record loaded through this index must match both:

- `workspaceId: natural-nation`
- `knowledgeBaseId: natural-nation-kb`

## Natural Nation Domains

- [Product](./product/README.md)
- [Governance](./governance/README.md)
- [Design](./design/README.md)
- [Duey](./duey/README.md)
- [Protocols](./protocols/README.md)
- [AI Product Context](./ai/README.md)
- [API](./api/README.md)
- [Testing](./testing/README.md)
- [Releases](./releases/README.md)
- [Decisions](./decisions/README.md)

## Excluded Founder OS Records

The following records belong to `founder-os-kb` and must not be loaded into Natural Nation context:

- `./founder-os/README.md`
- `./founder-os/architecture.md`
- `./founder-os/repository-intelligence.md`
- `./founder-os/mission-control.md`
- `./founder-os/operating-model-v1.md`
- `./founder-os/ai-operations.md`
- `./founder-os/source-of-truth.md`

## Required Record Metadata

```yaml
workspaceId: natural-nation
knowledgeBaseId: natural-nation-kb
recordType: product|decision|governance|design|duey|protocol|api|testing|release
status: draft|approved|locked|deprecated
source: repository-path-or-authoritative-system
```

## Retrieval Contract

1. Resolve the active workspace as `natural-nation`.
2. Search only records matching `natural-nation-kb`.
3. Reject Founder OS and other workspace records.
4. Permit cross-workspace access only after an explicit Founder action.
