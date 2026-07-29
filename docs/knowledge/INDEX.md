# KB-INDEX-001 — Deprecated Combined Knowledge Index

Status: Deprecated and blocked from runtime retrieval  
Superseded by: NN-KS-003

## Approved Entry Points

- Founder OS: `docs/founder-os/knowledge/INDEX.md`
- Natural Nation: `docs/knowledge/NATURAL-NATION-INDEX.md`
- Future workspace: `<workspace-root>/knowledge/INDEX.md`

## Separation Status

Founder OS records have been physically removed from the Natural Nation knowledge tree. The former `docs/knowledge/founder-os/` directory is no longer canonical and must not be recreated.

This file exists only as a migration notice. It must not be loaded for workspace search, AI context assembly, or runtime knowledge retrieval.

## Runtime Rule

Every retrieval must resolve and enforce both `workspaceId` and `knowledgeBaseId`. Unscoped retrieval is prohibited. Cross-workspace access requires an explicit Founder action and visible source attribution.

## Governance

See `docs/knowledge/NN-KS-003-WORKSPACE-ISOLATION.md`.