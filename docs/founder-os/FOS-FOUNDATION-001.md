# FOS-FOUNDATION-001 — Founder OS Constitutional Architecture

Status: Draft for Founder Review  
Authority: FOS-DIRECTIVE-001  
Source of truth: Founder OS Core Operating Model

## 1. Constitutional principle

> Founder OS manages the workspace. The workspace manages the work. AI enables autonomous creation. The Founder retains final authority over protected and consequential decisions.

Founder OS is an AI-native operating framework for creating, governing, organizing, tracking, and coordinating diverse workspaces. It is not limited to websites, mobile applications, or software products.

A workspace may produce software, services, automations, research, media, data products, operational systems, hardware/software combinations, physical-world plans, or other Founder/Builder outcomes.

Natural Nation is Workspace #1 and the first product created through Founder OS. Natural Nation must not define or constrain the Founder OS core.

## 2. System boundaries

### 2.1 Founder OS owns

- Founder identity and platform-level permissions
- Workspace creation, registration, archive, restoration, cloning, and deletion
- Cross-workspace organization and tracking
- Shared AI orchestration framework
- Provider, model, tool, and capability registries
- Shared integration management
- Platform governance and approval policies
- Cross-workspace health, audit, cost, and activity reporting
- Shared evidence, verification, recovery, and traceability standards
- Workspace isolation requirements

### 2.2 Each workspace owns

- Workspace purpose, vision, objectives, and boundaries
- Workspace-specific projects and project creation workflows
- Workspace-specific AI team composition
- Task queues, running work, maintenance, and releases
- Workspace approval flows
- Workspace knowledge, assets, decisions, and history
- Workspace-specific tools, actions, metrics, and outputs
- Product- or domain-specific interfaces

### 2.3 Projects own

- Defined outcomes and acceptance criteria
- Work packages and tasks
- Assigned roles and capabilities
- Evidence and verification records
- Deliverables and deployment targets
- Project-specific timelines, dependencies, and status

## 3. Canonical entity model

Founder OS will treat the following as separate canonical concepts:

- Founder
- Workspace
- Project
- Work package
- Task
- AI role
- Capability
- Provider
- Model
- Tool
- Integration
- Approval policy
- Evidence item
- Verification result
- Deliverable
- Deployment target
- Metric
- Audit event

Roles, capabilities, providers, models, and tools must remain separable. A role describes responsibility. A capability describes what can be done. A provider or model supplies intelligence. A tool performs an action.

## 4. Workspace contract

Every workspace must define:

- Stable workspace ID
- Name and description
- Workspace type or domain
- Purpose and intended outcomes
- Founder ownership
- Lifecycle state
- Isolation boundary
- Knowledge and asset locations
- Allowed integrations
- AI team policy
- Approval policy
- Project creation workflow
- Supported actions
- Metrics and health indicators
- Audit and evidence requirements
- Delivery and deployment targets

Workspace-specific functions must be registered through the workspace contract rather than embedded into Founder OS core logic.

## 5. Workspace lifecycle

Canonical lifecycle states:

1. Draft
2. Active
3. Paused
4. Archived
5. Restored
6. Scheduled for deletion
7. Deleted

Deletion must be deliberate, auditable, and separately protected where irreversible effects exist.

## 6. Autonomous AI operating model

Founder intent should be transformed through the following controlled chain:

Intent → clarified outcome → workspace or project context → work packages → task assignment → execution → evidence → verification → approval when required → delivery → maintenance and learning

Founder OS may autonomously coordinate routine, reversible, policy-compliant work.

Founder approval remains required for protected or consequential actions, including:

- Security and authentication changes
- Authorization and access-control changes
- Secrets handling changes
- Preventative security measure changes
- Destructive or irreversible operations
- Major architecture changes not already covered by an active directive
- Strategic product, brand, scope, or financial decisions
- Production release when the workspace policy requires it

## 7. Protected security boundary

Under FOS-DIRECTIVE-001, the following may be identified, documented, classified, and isolated but must not be modified without separate Founder approval:

- Authentication code
- Authorization code
- Login and session handling
- Access-control logic
- Secrets and credential handling
- Security middleware
- Preventative security controls
- Security-sensitive infrastructure configuration

Any migration plan that touches these areas must stop at analysis and request explicit Founder approval before implementation.

## 8. Repository audit classification

All existing repository artifacts must be classified into one of these groups:

1. Founder OS core
2. Workspace-owned
3. Reusable shared capability
4. Obsolete or conflicting
5. Protected security or authentication
6. Unclassified and requiring review

The audit must include code, pages, workflows, routes, services, styles, data models, scripts, documentation, tests, and integrations.

## 9. Migration rules

- Reuse compatible code where practical.
- Refactor ownership boundaries before adding duplicate systems.
- Move product-specific behavior into the owning workspace.
- Keep Founder OS product-agnostic.
- Remove obsolete code only through reviewable pull requests.
- Preserve traceability from old behavior to replacement behavior.
- Do not change protected security code under this package.
- Keep each migration slice small enough to verify independently.

## 10. Required migration sequence

1. Complete repository inventory.
2. Classify every major artifact.
3. Identify protected files and modules.
4. Produce target architecture map.
5. Produce staged migration plan.
6. Establish workspace registry and lifecycle.
7. Establish workspace extension and capability framework.
8. Migrate Natural Nation into the Workspace #1 boundary.
9. Verify that Workspace #2 can be created without Natural Nation-specific assumptions.

## 11. Acceptance criteria

FOS-FOUNDATION-001 is complete when:

- Founder OS, workspace, and project ownership boundaries are explicit.
- The workspace contract is defined.
- The protected security boundary is documented.
- Existing repository artifacts are classified.
- A staged migration plan exists.
- No protected security or authentication code has been modified.
- Natural Nation is represented as Workspace #1 rather than as Founder OS core.
- The architecture can support a second workspace with a different domain and output type.
- All implementation work is traceable through branches and pull requests.

## 12. Immediate next artifacts

- FOS-AUDIT-001 — Repository Architecture Inventory and Classification
- FOS-FOUNDATION-002 — Workspace Registry and Lifecycle
- FOS-FOUNDATION-003 — Workspace Creation Experience
- FOS-FOUNDATION-004 — AI Role, Capability, Provider, Model, and Tool Registry
- FOS-FOUNDATION-005 — Workspace Extension and Action Framework
- FOS-FOUNDATION-006 — Founder Authentication and Authorization Review Package
- FOS-FOUNDATION-007 — Cross-Workspace Health and Analytics

FOS-FOUNDATION-006 is analysis-only until the Founder gives separate approval to modify protected authentication or security code.
