# KB-INDEX-001 — Legacy Combined Knowledge Index

Status: Deprecated for runtime retrieval
Superseded by: NN-KS-003

## Important

This file previously served as a combined entry point for Natural Nation and Founder OS. That design allowed cross-workspace context bleeding and is no longer approved for runtime loading, workspace search, or AI context assembly.

## Approved Runtime Entry Points

- Founder OS: `docs/founder-os/knowledge/INDEX.md`
- Natural Nation: `docs/knowledge/NATURAL-NATION-INDEX.md`
- Future workspaces: `<workspace-root>/knowledge/INDEX.md`

## Isolation Rule

Every runtime retrieval must resolve both:

- `workspaceId`
- `knowledgeBaseId`

Unscoped retrieval is prohibited. Cross-workspace search is disabled by default and requires an explicit Founder action.

## Legacy Domains

The records previously referenced from this combined index remain in the repository for history and migration traceability. They must now be loaded only through the correct workspace-specific index.

## Governance Reference

See `docs/knowledge/NN-KS-003-WORKSPACE-ISOLATION.md` for the locked architecture and retrieval contract.
