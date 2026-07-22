# FOS-MIGRATION-001 — Staged Core Operating Model Migration Plan

Status: Approved architecture plan  
Authority: FOS-DIRECTIVE-001  
Parent: FOS-FOUNDATION-001  
Root-entry implementation: FOS-ROOT-ENTRY-001

## 1. Migration objective

Transform the current mixed Founder OS/Natural Nation repository into a product-agnostic Founder OS platform with Natural Nation registered and operated as Workspace #1, while preserving reusable work and leaving protected security and authentication code unchanged.

## 2. Migration principles

- Reuse before rewrite.
- Correct ownership before adding duplicate features.
- Keep Founder OS product-agnostic.
- Make workspace identity explicit in state, routes, actions, tasks, evidence, and metrics.
- Preserve working orchestration and evidence verification.
- Replace fixed workflows with workspace-registered workflows.
- Verify every slice independently.
- Do not modify protected code without separate Founder approval.

## 3. Target repository boundaries

The final physical folder layout may evolve, but the logical ownership model is fixed:

```text
Founder OS Platform
├── workspace registry and lifecycle
├── shared orchestration engine
├── capability/provider/model/tool registries
├── shared integrations
├── governance, evidence, audit, and analytics
└── platform interface

Workspace: Natural Nation
├── workspace configuration
├── projects and workflows
├── AI team policy
├── product application and services
├── product knowledge and assets
├── product approvals and releases
└── product metrics
```

A monorepo may contain both layers, but imports and runtime ownership must remain explicit.

### 3.1 Canonical public entry

Founder OS is now the canonical GitHub Pages root application.

```text
/             → Founder OS platform shell and workspace registry
/founder-os/  → compatibility route during migration
```

The previous Natural Nation landing page is no longer the root experience. Natural Nation is entered from the Founder OS workspace registry as Workspace #1. See `FOS-ROOT-ENTRY-001`.

## 4. Staged implementation plan

### Stage 0 — Constitutional foundation

Deliverables:

- FOS-FOUNDATION-001
- FOS-AUDIT-001
- FOS-WORKSPACE-CONTRACT-001
- FOS-GOVERNANCE-001
- FOS-MIGRATION-001
- FOS-ROOT-ENTRY-001

Exit criteria:

- boundaries are documented
- repository baseline is classified
- protected boundary is explicit
- workspace contract is defined
- migration sequence is approved
- Founder OS opens directly at the canonical Pages root

### Stage 1 — Workspace Registry and Lifecycle

Implement:

- canonical workspace schema and versioning
- workspace registry storage
- create, read, update metadata, pause, archive, restore, and deletion-request operations
- lifecycle validation
- audit events
- workspace list and workspace overview foundation

Restrictions:

- deletion must remain gated
- no authentication or authorization changes
- existing identity references are consumed as-is

Exit criteria:

- Natural Nation is registered as Workspace #1
- a second draft workspace can be registered without Natural Nation assumptions
- lifecycle transitions are validated and audited

### Stage 2 — Workspace Context and Routing

Implement:

- explicit workspace context in platform routes and state
- workspace-scoped navigation
- workspace-aware task, project, evidence, approval, and metric references
- clear visual distinction between Founder OS platform scope and workspace scope

Exit criteria:

- Founder OS pages do not expose Natural Nation product actions globally
- Natural Nation actions appear only within its workspace context
- cross-workspace leakage tests pass

### Stage 3 — Workflow and Action Registry

Implement:

- workspace-defined workflow schema
- workspace-defined actions
- task graph support
- input/output/evidence/verification contracts
- retry, recovery, and approval gates
- compatibility adapter for the current five-task workflow

Exit criteria:

- current Natural Nation workflow runs through a registered workspace workflow
- a second workspace can register a different task graph
- fixed `AI-TASK-001..005` assumptions are no longer required by Founder OS core

### Stage 4 — AI Team and Capability Registry

Implement:

- roles
- capabilities
- providers
- models
- tools
- routing policies
- workspace team composition
- provider fallback and evidence requirements

Exit criteria:

- roles are independent from provider names
- each workspace can select a different team and capability set
- provider substitution does not change workspace role definitions

### Stage 5 — Natural Nation Workspace Migration

Move or register under Workspace #1:

- project creation
- build queue
- current/running task view
- AI team builder/selector
- workspace approvals
- releases
- product metrics
- application, knowledge, assets, and product documentation

Exit criteria:

- Natural Nation product behavior is fully owned by its workspace
- Founder OS contains no Natural Nation-specific product workflow logic
- existing Natural Nation history remains traceable

### Stage 6 — Platform Analytics and Administration

Implement Founder OS platform features:

- workspace health
- activity and task summaries
- resource and provider usage
- approval load
- failure and recovery reporting
- archive and lifecycle management
- platform-level audit views

Exit criteria:

- platform metrics are clearly separated from product metrics
- Founder can target one workspace or view cross-workspace summaries

### Stage 7 — Workspace #2 Validation

Create a non-Natural Nation workspace with a different purpose and output type.

Proof requirements:

- no Founder OS core source change required to describe the workspace
- different project type and workflow
- different roles/capabilities/tools
- different outputs and metrics
- isolated state, evidence, and history

## 5. Compatibility strategy

Existing Founder OS orchestration will remain operational while registries are introduced.

Compatibility adapters may translate:

- current orchestration state into workspace/project/package/task references
- fixed task IDs into registered workflow nodes
- current GitHub repository configuration into workspace integration records
- current result contracts into capability-based contracts

The `/founder-os/` public route is also retained temporarily as a compatibility route while the root URL becomes canonical.

Adapters and compatibility routes are temporary and must have removal criteria.

## 6. Deprecation policy

An old path or behavior may be removed only when:

- replacement behavior exists
- data/history migration is complete or intentionally archived
- acceptance tests pass
- protected code is not changed without approval
- the pull request documents the replacement and rollback path

## 7. Validation matrix

Each implementation pull request must test applicable items:

- workspace ID is explicit
- ownership boundary is correct
- Natural Nation assumptions are absent from Founder OS core
- evidence and fingerprints remain valid
- task completion is atomic
- approval gates remain enforced
- protected files are unchanged
- backward compatibility is maintained or migration is documented
- rollback path exists
- canonical root and compatibility routes both load during the transition

## 8. Completion definition

The migration is complete when Founder OS can create, manage, track, and govern multiple diverse workspaces; each workspace can define its own projects, workflows, AI team, actions, outputs, approvals, and metrics; and Natural Nation operates entirely as Workspace #1 without defining the Founder OS core.
