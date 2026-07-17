# FOS-WORKSPACE-CONTRACT-001 — Canonical Workspace Contract

Status: Complete  
Authority: FOS-DIRECTIVE-001  
Parent: FOS-FOUNDATION-001

## 1. Purpose

The workspace contract is the boundary between Founder OS and the work created through it. Founder OS manages the workspace lifecycle and shared operating capabilities. The workspace defines how its own projects, workflows, AI team, actions, outputs, approvals, and metrics operate.

## 2. Required workspace record

Every workspace must have a canonical record containing:

```json
{
  "workspaceVersion": "1.0.0",
  "workspaceId": "stable-slug-or-uuid",
  "name": "Workspace display name",
  "description": "Plain-language purpose",
  "domain": "product, research, operations, media, physical-system, hybrid, or custom",
  "founderOwnerId": "founder identity reference",
  "lifecycleState": "draft",
  "purpose": "Why the workspace exists",
  "desiredOutcomes": [],
  "boundaries": {
    "included": [],
    "excluded": []
  },
  "locations": {
    "knowledge": [],
    "assets": [],
    "repositories": [],
    "storage": []
  },
  "integrations": [],
  "capabilityPolicy": {},
  "aiTeamPolicy": {},
  "approvalPolicy": {},
  "projectCreationPolicy": {},
  "workflowRegistry": [],
  "actionRegistry": [],
  "metricRegistry": [],
  "deliveryTargets": [],
  "auditPolicy": {},
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

This schema is conceptual in FOS-FOUNDATION-001. The implementation schema will be versioned in the Workspace Registry package.

## 3. Identity requirements

- `workspaceId` is stable and must not change when the display name changes.
- Every project, task, evidence item, approval, metric, action, and audit event must include `workspaceId`.
- Founder OS must never infer a workspace from a product name, route, repository, or provider prompt.
- Human-readable slugs may be used for navigation but cannot replace the canonical ID.

## 4. Workspace lifecycle contract

Supported lifecycle states:

- `draft` — configuration is incomplete; no production actions.
- `active` — projects and workflows may operate.
- `paused` — no new autonomous execution; history remains accessible.
- `archived` — read-only except restoration and approved export.
- `restoring` — controlled transition back to active or paused.
- `deletion-pending` — destructive action scheduled and awaiting required gates.
- `deleted` — inaccessible through normal operation; audit tombstone retained according to policy.

Founder OS owns lifecycle transitions. Workspace-specific code may request a transition but cannot bypass lifecycle policy.

## 5. Workspace-owned registries

### 5.1 Workflow registry

A workspace defines one or more workflows. A workflow specifies:

- workflow ID and version
- purpose and trigger
- allowed project types
- task graph or sequence
- roles and capabilities required
- input and output contracts
- evidence requirements
- verification gates
- approval gates
- retry and recovery policy
- completion and delivery rules

Founder OS executes the registered workflow. It does not hard-code a universal five-task chain.

### 5.2 Action registry

An action is a workspace-level function available to the Founder, AI team, automation, or authorized collaborator.

Examples include:

- Create project
- Generate research package
- Build prototype
- Produce media asset
- Run analysis
- Request approval
- Publish release
- Schedule maintenance

Each action must declare:

- action ID and version
- actor permissions
- required inputs
- capability and tool requirements
- reversible or irreversible status
- approval policy
- evidence contract
- expected outputs
- audit behavior

### 5.3 AI team policy

The workspace selects roles and required capabilities. Founder OS selects or routes providers and models according to platform policy, workspace constraints, availability, quality, cost, and fallback rules.

A workspace policy must distinguish:

- role
- capability
- provider
- model
- tool
- authority level

No provider name may be treated as a permanent job role.

### 5.4 Metric registry

Metrics must declare their scope:

- platform metric
- workspace metric
- project metric
- workflow metric
- task metric
- output or product metric

Natural Nation wellness and product metrics are workspace-owned. Founder OS may aggregate workspace health but cannot reinterpret product metrics as platform metrics.

## 6. Project contract

A workspace project must contain:

- project ID
- workspace ID
- title and objective
- project type
- expected outcomes
- acceptance criteria
- constraints and exclusions
- selected workflow
- assigned AI team policy
- required integrations and resources
- approval policy
- deliverables
- status, dependencies, and history

Projects belong to exactly one workspace. Cross-workspace projects require an explicit coordination record rather than shared ownership ambiguity.

## 7. Work package and task contract

A work package is a bounded unit of project delivery. A task is an executable step within a package.

Every task must identify:

- task ID
- package ID
- project ID
- workspace ID
- owner role
- required capabilities
- provider routing policy
- input contract
- output contract
- evidence contract
- verification contract
- approval requirement
- retry and recovery policy
- current state

Task IDs such as `AI-TASK-001` are allowed within a workflow instance but cannot define the global Founder OS architecture.

## 8. Isolation contract

Every workspace must be logically isolated across:

- data
- state
- knowledge
- assets
- repositories
- integrations
- secrets references
- metrics
- audit history
- provider prompts and evidence

Shared capabilities may operate across workspaces only when the workspace ID is explicit and access is allowed by the protected security and authorization layer.

No security implementation is modified by this contract.

## 9. Evidence and verification contract

All consequential task completion must be supported by evidence.

Canonical evidence requirements:

- stable evidence ID
- content or artifact fingerprint
- workspace, project, package, and task references
- source type and location reference
- creation timestamp
- producing actor, role, provider, and tool where applicable
- verification result

Repository evidence must use stable evidence IDs and fingerprints in provider responses. Internal systems may map those IDs to paths.

## 10. Approval contract

Approval policies may be set at platform, workspace, project, workflow, action, or task level. The most restrictive applicable policy governs.

Founder approval is always required for:

- changes to security, authentication, authorization, access control, secrets handling, or preventative security measures
- irreversible deletion
- major architecture changes outside active directives
- consequential financial or legal commitments
- strategic product, brand, or scope decisions
- any action explicitly reserved by the Founder

## 11. Extension contract

A workspace may add domain-specific features without changing Founder OS core when the feature is registered as one or more of:

- workflow
- action
- capability requirement
- tool adapter
- metric
- project type
- output type
- interface module

Founder OS must expose stable extension points rather than product-specific conditional logic.

## 12. Workspace #1 registration

Natural Nation is registered conceptually as:

- Workspace ID: `natural-nation`
- Domain: wellness product and service ecosystem
- Primary outputs: mobile application, responsive web experience, AI wellness mentorship, content, protocols, data-backed user experiences, and supporting operations
- Workspace-owned areas: application code, product UI, Duey, Natural Nation knowledge and assets, product workflows, build queue, product approvals, releases, and product metrics
- Shared capabilities used: GitHub operations, AI orchestration, evidence verification, approval recording, audit history, and provider routing

## 13. Workspace #2 proof requirement

The architecture passes the product-agnostic test only when a second workspace can be created with:

- a different domain
- different project types
- different workflow graph
- different AI roles and capabilities
- different output types
- different metrics
- no Natural Nation-specific code changes in Founder OS core
