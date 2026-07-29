# NN-KS-003 — Workspace-Isolated Knowledge Architecture

Status: Founder Approved

## Decision

Every Founder OS workspace owns an isolated knowledge base. Knowledge retrieval is scoped by the active workspace and its knowledge base identifier.

## Required Identifiers

- Founder OS: `workspaceId: founder-os`, `knowledgeBaseId: founder-os-kb`
- Natural Nation: `workspaceId: natural-nation`, `knowledgeBaseId: natural-nation-kb`
- Future workspace: `workspaceId: <immutable-workspace-id>`, `knowledgeBaseId: <immutable-workspace-id>-kb`

## Mandatory Retrieval Rule

No knowledge record, search result, AI response, or workspace page may access another workspace's content unless the Founder explicitly initiates a cross-workspace search.

## Record Contract

Every new record must include:

```yaml
workspaceId: string
knowledgeBaseId: string
recordType: string
title: string
status: draft|approved|locked|deprecated
source: string
createdAt: ISO-8601
updatedAt: ISO-8601
```

## Runtime Rules

1. Resolve the active workspace before rendering or retrieval.
2. Resolve the matching knowledge base ID.
3. Search only matching records.
4. Reject unscoped records.
5. Reject records assigned to another workspace.
6. Keep global search disabled by default.
7. Require an explicit Founder action to search across workspaces.

## UI Rules

- Founder OS exposes `System Records`.
- Natural Nation exposes `Product Records`.
- Other workspaces expose `Workspace Records`.
- Search results display the active knowledge base ID.
- Empty workspaces show an isolated empty state rather than records from another workspace.

## Migration

The previous `docs/knowledge/INDEX.md` mixed Founder OS and Natural Nation domains. It remains as a legacy combined index for traceability but is no longer an approved runtime entry point.

Approved runtime entry points:

- Founder OS: `docs/founder-os/knowledge/INDEX.md`
- Natural Nation: `docs/knowledge/NATURAL-NATION-INDEX.md`
