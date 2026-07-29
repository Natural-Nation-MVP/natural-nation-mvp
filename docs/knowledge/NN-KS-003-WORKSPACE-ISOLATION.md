# NN-KS-003 — Workspace-Isolated Knowledge Architecture

Status: Founder Approved, Implemented, and Physically Separated

## Decision

Every Founder OS workspace owns an isolated knowledge base. Retrieval is scoped by the active workspace and its immutable knowledge-base identifier.

## Canonical Roots

- Founder OS: `docs/founder-os/knowledge/`
  - `workspaceId: founder-os`
  - `knowledgeBaseId: founder-os-kb`
- Natural Nation: `docs/knowledge/` through `docs/knowledge/NATURAL-NATION-INDEX.md`
  - `workspaceId: natural-nation`
  - `knowledgeBaseId: natural-nation-kb`
- Future workspace: `<workspace-root>/knowledge/`
  - `workspaceId: <immutable-workspace-id>`
  - `knowledgeBaseId: <immutable-workspace-id>-kb`

## Mandatory Rule

No record, search result, AI response, or workspace page may access another workspace's content unless the Founder explicitly initiates a cross-workspace search.

## Record Contract

Every new record must include workspace ID, knowledge-base ID, record type, title, status, source, creation time, and update time.

## Runtime Rules

1. Resolve the active workspace.
2. Resolve its knowledge-base ID.
3. Search only matching records within the workspace's canonical physical root and explicitly registered sources.
4. Reject unscoped records.
5. Reject records owned by another workspace.
6. Keep global search disabled by default.
7. Require an explicit Founder action and visible attribution for cross-workspace access.

## UI Rules

- Founder OS exposes `System Records`.
- Natural Nation exposes `Product Records`.
- Other workspaces expose `Workspace Records`.
- Search displays the active knowledge-base identity.
- Empty workspaces show an isolated empty state.

## Completed Migration

- Founder OS records were migrated from `docs/knowledge/founder-os/` to `docs/founder-os/knowledge/`.
- Migrated records now include Founder OS ownership metadata.
- The former mixed-location Founder OS directory was removed from the Natural Nation knowledge tree.
- `docs/knowledge/INDEX.md` is now only a blocked migration notice and is not a runtime entry point.
- Founder OS and Natural Nation now have separate canonical indexes and physical roots.