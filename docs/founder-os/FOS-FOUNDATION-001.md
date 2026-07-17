# FOS-FOUNDATION-001 — Founder OS Constitutional Architecture

Status: Complete — Founder Directive Implemented  
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
- Provider, model, tool, role, and capability registries
- Shared integration management
- Platform governance and approval policies
- Cross-workspace health, audit, cost, and activity reporting
- Shared evidence, verification, recovery, and traceability standards
- Workspace isolation requirements
- Stable extension points through which workspaces register their own functions

### 2.2 Each workspace owns

- Purpose, vision, objectives, and boundaries
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

Founder OS treats the following as separate canonical concepts:

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
- Workflow
- Action
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
- Project creation policy
- Workflow registry
- Action registry
- Supported project and output types
- Metrics and health indicators
- Audit and evidence requirements
- Delivery and deployment targets

Workspace-specific functions must be registered through the workspace contract rather than embedded into Founder OS core logic.

The complete contract is defined in `FOS-WORKSPACE-CONTRACT-001.md`.

## 5. Workspace lifecycle

Canonical lifecycle states:

1. Draft
2. Active
3. Paused
4. Archived
5. Restoring
6. Deletion pending
7. Deleted

Founder OS owns lifecycle enforcement. Deletion must be deliberate, auditable, and separately protected where irreversible effects exist.

## 6. Autonomous AI operating model

Founder intent is transformed through the controlled chain:

Intent → clarified outcome → workspace or project context → work packages → task assignment → execution → evidence → verification → approval when required → delivery → maintenance and learning

Founder OS may autonomously coordinate routine, reversible, policy-compliant work. Workspace workflows determine the task graph, roles, capabilities, contracts, evidence, verification, retry, recovery, approval, and delivery behavior.

Founder approval remains required for protected or consequential actions, including:

- Security and authentication changes
- Authorization and access-control changes
- Secrets handling changes
- Preventative security measure changes
- Destructive or irreversible operations
- Major architecture changes outside an active directive
- Strategic product, brand, scope, legal, or financial decisions
- Production release when the governing workspace policy requires it

The complete autonomy and approval constitution is defined in `FOS-GOVERNANCE-001.md`.

## 7. Protected security boundary

Under FOS-DIRECTIVE-001, the following may be identified, documented, classified, and isolated but must not be modified without separate Founder approval:

- Authentication code
- Authorization code
- Login, identity, token, and session handling
- Access-control logic
- Secrets and credential handling
- Security middleware
- Preventative security controls
- Security-sensitive infrastructure configuration

Any migration plan that touches these areas must stop at analysis and request explicit Founder approval before implementation.

## 8. Repository audit classification

All repository artifacts are governed by these classifications:

1. Founder OS core
2. Workspace-owned
3. Reusable shared capability
4. Obsolete or conflicting
5. Protected security or authentication
6. Unclassified and requiring review

The completed baseline inventory is defined in `FOS-AUDIT-001.md`.

The central audit finding is that the repository currently contains both Founder OS and Natural Nation concerns. Valuable working capabilities should be retained, but ownership must be corrected so Natural Nation operates as Workspace #1 rather than as Founder OS itself.

## 9. Migration rules

- Reuse compatible code where practical.
- Refactor ownership boundaries before adding duplicate systems.
- Move product-specific behavior into the owning workspace.
- Keep Founder OS product-agnostic.
- Make workspace identity explicit in state, routes, actions, evidence, approvals, and metrics.
- Replace universal fixed-task assumptions with workspace-registered workflows.
- Remove obsolete code only through reviewable pull requests.
- Preserve traceability from old behavior to replacement behavior.
- Do not change protected security code under this package.
- Keep migration slices independently verifiable.

## 10. Required migration sequence

1. Constitutional architecture and audit baseline
2. Workspace Registry and Lifecycle
3. Workspace context and routing
4. Workflow and Action Registry
5. AI Role, Capability, Provider, Model, and Tool Registry
6. Natural Nation Workspace #1 migration
7. Cross-workspace health and analytics
8. Workspace #2 product-agnostic validation

The complete staged plan and acceptance matrix are defined in `FOS-MIGRATION-001.md`.

## 11. Natural Nation Workspace #1

Natural Nation is conceptually registered as:

- Workspace ID: `natural-nation`
- Domain: wellness product and service ecosystem
- Workspace-owned concerns: application, website, Duey, knowledge, assets, projects, build queue, running tasks, AI team policy, product approvals, releases, and product metrics
- Shared Founder OS capabilities: orchestration, provider routing, GitHub operations, evidence verification, audit history, lifecycle governance, and cross-workspace reporting

Natural Nation-specific functions may not become Founder OS defaults.

## 12. Product-agnostic proof

Founder OS satisfies this constitution only when Workspace #2 can be created with:

- a different domain
- different project types
- a different workflow graph
- different AI roles and capabilities
- different tools and integrations
- different output types
- different metrics
- no Natural Nation-specific modifications to Founder OS core

## 13. Package artifacts

FOS-FOUNDATION-001 consists of:

- `FOS-FOUNDATION-001.md` — constitutional architecture
- `FOS-AUDIT-001.md` — repository architecture inventory and classification
- `FOS-WORKSPACE-CONTRACT-001.md` — canonical workspace and extension contract
- `FOS-GOVERNANCE-001.md` — autonomy, authority, evidence, approval, and recovery rules
- `FOS-MIGRATION-001.md` — staged implementation and validation plan

## 14. Acceptance criteria verification

- Founder OS, workspace, and project ownership boundaries are explicit — **Pass**
- Workspace contract is defined — **Pass**
- Protected security boundary is documented — **Pass**
- Existing repository artifacts have a canonical baseline classification — **Pass**
- Staged migration plan exists — **Pass**
- No protected security or authentication code was modified — **Pass**
- Natural Nation is represented as Workspace #1 — **Pass**
- Architecture supports a second workspace with a different domain and output type — **Pass by contract; implementation proof scheduled**
- All implementation work is traceable through branches and pull requests — **Pass**

## 15. Completion decision

FOS-FOUNDATION-001 is complete in its entirety as the constitutional and migration foundation of Founder OS.

Implementation may now continue continuously across the approved migration stages without stopping at the end of every internal package, unless a protected security/authentication change, new strategic decision, destructive action, or other Founder-gated boundary is reached.
