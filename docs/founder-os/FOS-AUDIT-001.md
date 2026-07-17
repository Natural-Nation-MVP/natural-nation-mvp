# FOS-AUDIT-001 — Repository Architecture Inventory and Classification

Status: Complete baseline audit  
Authority: FOS-DIRECTIVE-001  
Parent: FOS-FOUNDATION-001

## 1. Purpose

This audit classifies the current repository against the Founder OS Core Operating Model. It establishes ownership boundaries before implementation migration begins.

## 2. Audit rules

Every artifact is classified as one of:

- **FOS Core** — platform-level workspace creation, lifecycle, governance, orchestration, tracking, audit, shared infrastructure, and cross-workspace services.
- **Workspace-Owned** — behavior, content, workflows, interfaces, metrics, and outputs belonging to one workspace.
- **Shared Capability** — reusable implementation that may serve multiple workspaces without containing workspace-specific assumptions.
- **Obsolete/Conflicting** — unused, duplicated, stale, or structurally inconsistent with the Core Operating Model.
- **Protected** — authentication, authorization, secrets, access control, security middleware, or preventative security measures.
- **Needs Review** — insufficient evidence to classify safely.

## 3. Current repository-level finding

The repository was originally structured and described primarily as the Natural Nation product repository. Founder OS capabilities were later added inside the same repository. This creates a temporary mixed-boundary repository where platform and Workspace #1 concerns coexist.

This is permitted during migration, but ownership must be explicit and code must stop treating Natural Nation as the definition of Founder OS.

## 4. Classified inventory

### 4.1 Founder OS Core

| Artifact or area | Classification | Required action |
|---|---|---|
| `docs/founder-os/` | FOS Core | Retain as canonical Founder OS governance and architecture location. |
| `services/founder-os-gateway/` | FOS Core with protected subareas | Retain as shared orchestration gateway. Separate workspace-neutral orchestration from workspace-specific configuration. Do not modify protected security/authentication code without approval. |
| `scripts/validate-founder-os.mjs` | FOS Core | Retain and evolve into architecture, contract, and migration validation. |
| AI provider adapters | FOS Core / Shared Capability | Retain. Providers must remain separate from roles and capabilities. |
| Provider contracts | FOS Core / Shared Capability | Retain. Replace task-number coupling over time with capability and workflow contract registration. |
| Evidence IDs and SHA-256 fingerprints | Shared Capability | Retain as canonical evidence integrity mechanism across workspaces. |
| Orchestration transaction and verification logic | FOS Core | Retain. Generalize package/task semantics so workflows are workspace-defined. |

### 4.2 Natural Nation Workspace #1

| Artifact or area | Classification | Required action |
|---|---|---|
| `app/` and `app/frontend/` | Workspace-Owned: Natural Nation | Register under Workspace #1. Product-facing interfaces and code remain owned by Natural Nation. |
| `resources/` | Primarily Workspace-Owned | Treat Natural Nation brand assets as Workspace #1 assets. Only move truly generic assets into shared resources. |
| `knowledge/` | Workspace-Owned: Natural Nation | Preserve as Natural Nation knowledge system and register its location in the workspace contract. |
| Natural Nation design, wellness, Duey, onboarding, dashboard, score, protocol, and product documentation | Workspace-Owned | Keep inside Natural Nation workspace boundary. Do not elevate to Founder OS defaults. |
| `NN-*` packages and task history | Workspace-Owned | Preserve as Workspace #1 project history. Founder OS may track them but must not own their product semantics. |
| Natural Nation build queue and product approval workflow | Workspace-Owned | Move behind Natural Nation workspace actions and views. |

### 4.3 Reusable shared capabilities

| Capability | Current source | Required action |
|---|---|---|
| AI provider routing and fallback | Founder OS gateway | Generalize and register as shared capability. |
| Structured provider output contracts | Founder OS gateway | Convert from fixed task IDs toward workflow-defined contract selection. |
| GitHub branch, commit, PR, evidence, and status operations | Founder OS gateway | Retain as shared repository capability with workspace-scoped configuration. |
| Evidence fingerprinting and verification | Founder OS gateway | Retain as global standard. |
| Audit events and completion transactions | Founder OS gateway | Retain and make workspace-aware. |
| Founder approval recording | Founder OS orchestration | Retain as shared governance capability; policy remains workspace-configurable. |

### 4.4 Obsolete or conflicting patterns

The following patterns conflict with the approved architecture and are authorized for refactor or removal:

- Founder OS screens or routes that behave as Natural Nation product build screens outside a workspace context.
- Global build queues containing Natural Nation-specific package semantics.
- Fixed assumptions that every workspace produces a website or mobile application.
- Hard-coded Natural Nation file paths in shared provider contracts.
- Hard-coded `AI-TASK-001` through `AI-TASK-005` as the only possible workflow shape.
- UI labels that use Founder OS and Natural Nation interchangeably.
- Shared services that infer workspace identity rather than receiving an explicit workspace ID.
- Duplicate or stale workflow state that is not connected to the canonical orchestration transaction.
- Product-specific metrics shown as platform-wide Founder OS metrics.

These items must be removed only after replacement behavior is verified.

### 4.5 Protected security and authentication boundary

The following areas are protected from modification under FOS-DIRECTIVE-001:

- Founder login and identity handling
- Authentication providers and callbacks
- Session and token handling
- Authorization and permission checks
- Access-control middleware
- Credential, secret, and API-key handling
- CORS, request filtering, rate limiting, abuse prevention, and security headers
- Security-sensitive deployment configuration
- Any code whose primary purpose is preventing unauthorized, destructive, or abusive behavior

Protected areas may be mapped, documented, tested, and wrapped with non-invasive observability. They may not be altered without separate Founder approval.

## 5. Ownership correction map

### Existing mixed model

`Founder OS UI → Natural Nation build queue → fixed AI task chain → Natural Nation product output`

### Target model

`Founder OS → Workspace Registry → Natural Nation Workspace → Natural Nation projects/workflows → workspace-selected AI team/capabilities → product output`

A second workspace must be able to use a completely different workflow, team, toolset, project type, and output without changing Founder OS core code.

## 6. Repository migration categories

### Category A — Retain unchanged initially

- Evidence ID and fingerprint model
- Atomic completion and verification transaction
- Existing GitHub integration capability
- Existing AI provider connectivity
- Existing Natural Nation application code
- All protected security/authentication implementation

### Category B — Refactor and generalize

- Workspace state model
- Task and workflow definition model
- Provider contract selection
- Build queue ownership
- UI navigation between platform and workspace scopes
- Metrics ownership and aggregation
- Repository/integration configuration

### Category C — Move into Natural Nation workspace scope

- Natural Nation build work
- Natural Nation task queue
- Natural Nation AI team choices
- Natural Nation approvals
- Natural Nation project metrics
- Natural Nation release history
- Natural Nation product knowledge and assets

### Category D — Deprecate after replacement

- Global Natural Nation-specific build queue
- Fixed product-type assumptions
- Fixed task-number orchestration as the universal workflow
- Any duplicated or disconnected state records

## 7. Audit limitations

This is the canonical baseline architecture audit. File-by-file migration classification will continue as each implementation slice opens. A file discovered to contain protected code must immediately be marked protected and excluded from modification.

## 8. Audit conclusion

The existing repository contains valuable reusable Founder OS orchestration capabilities and the complete beginning of Natural Nation Workspace #1. The primary requirement is not a rewrite. It is an ownership correction:

> Retain working capabilities, place them behind explicit workspace contracts, remove product-specific assumptions from Founder OS, and protect all security and authentication boundaries.
