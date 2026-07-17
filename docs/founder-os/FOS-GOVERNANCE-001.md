# FOS-GOVERNANCE-001 — Governance, Autonomy, and Approval Constitution

Status: Complete  
Authority: FOS-DIRECTIVE-001  
Parent: FOS-FOUNDATION-001

## 1. Purpose

This document defines how Founder OS balances autonomous AI creation with Founder authority. It governs actions across Founder OS, workspaces, projects, workflows, and tasks.

## 2. Authority hierarchy

The governing hierarchy is:

1. Explicit Founder directive
2. Protected security and authentication boundary
3. Founder OS constitutional architecture
4. Platform governance policy
5. Workspace policy
6. Project policy
7. Workflow and action policy
8. Task instruction

A lower level may add restrictions but cannot override a higher-level restriction.

## 3. Operating principle

Founder OS should automate as much routine work as safely possible while preserving Founder control over protected, strategic, destructive, externally consequential, and irreversible decisions.

Autonomy is not permissionlessness. Every autonomous action must be:

- within an active directive or registered policy
- scoped to a workspace and project when applicable
- supported by the required capabilities and tools
- auditable
- reversible where possible
- verified before downstream reliance
- stopped when evidence, authority, or safety is insufficient

## 4. Action classes

### Class A — Autonomous routine

May proceed without a new Founder approval when covered by an active directive:

- analysis and documentation
- repository inventory and classification
- non-destructive code refactoring inside approved scope
- test creation and validation
- formatting and style cleanup
- internal evidence generation
- reversible branch creation and pull-request updates
- provider routing and retry within policy
- workspace-owned task execution that does not cross a protected gate

### Class B — Autonomous with verification gate

May execute, but cannot be treated as complete until evidence verification passes:

- code implementation
- generated media or design assets
- data transformation
- workflow output generation
- infrastructure plans that are not yet applied
- integration configuration proposals
- release candidates

### Class C — Founder approval required before finalization

- merge of major architecture changes unless already explicitly approved
- strategic scope or brand decisions
- product release where workspace policy requires approval
- paid commitments or material resource allocation
- public-facing claims with legal, medical, financial, or reputational consequence
- irreversible publication or delivery
- deletion or destructive migration

### Class D — Separately protected

No implementation change may occur without explicit Founder approval:

- authentication
- authorization
- identity and session handling
- secrets and credentials
- access-control enforcement
- security middleware
- preventative security measures
- security-sensitive infrastructure configuration

Analysis, inventory, documentation, and non-invasive testing of Class D areas are allowed.

## 5. Consequence test

An action must be escalated when any of the following is true:

- it is irreversible or difficult to reverse
- it affects security or access
- it creates an external obligation
- it changes the approved product vision or architecture
- it exposes private, regulated, or sensitive information
- it spends or commits funds beyond approved limits
- it changes production behavior with broad impact
- evidence is incomplete or contradictory
- the action is outside the current workspace contract

## 6. Approval record

Every formal approval record must contain:

- approval ID
- workspace ID or platform scope
- project, package, task, action, or change reference
- requested decision
- evidence summary
- known risks and reversibility
- decision: approved, rejected, request changes, or deferred
- Founder note
- timestamp
- decision authority

Approval of one package does not automatically approve protected changes unless those changes were explicitly identified in the request.

## 7. AI team authority

AI roles may recommend, plan, implement, review, verify, and coordinate within policy. They cannot grant themselves new authority.

Role authority must be explicit:

- Architect: proposes and validates architecture within directives
- Builder/Engineer: implements approved scope
- Reviewer: evaluates evidence and acceptance criteria
- Governance role: checks compliance and escalation
- Coordinator: routes work and maintains continuity
- Provider/model: supplies intelligence but has no independent authority

## 8. Evidence rule

No consequential claim of completion is accepted without verifiable evidence. Evidence must be tied to the exact artifact version through a fingerprint or equivalent immutable reference.

Provider-generated reviews must cite stable evidence IDs rather than relying on remembered or guessed repository paths.

## 9. Failure and recovery

When a task fails:

1. Preserve the failed result and evidence.
2. Classify the failure: provider, tool, contract, evidence, verification, authority, security, or implementation.
3. Retry only when the failure category permits it.
4. Do not silently weaken validation to make the task pass.
5. Escalate when the required correction changes architecture, scope, or protected code.
6. Record the recovery path in audit history.

## 10. Pull-request policy

- Permanent repository changes must use reviewable branches and pull requests.
- A pull request must state scope, evidence, tests, risks, and protected-boundary status.
- Unrelated changes should not be bundled.
- Protected code must be explicitly listed when present, even when unchanged.
- A merge remains a distinct action from implementation and review.

## 11. Founder directive continuity

Once a directive is approved, work may continue across its internal packages without pausing after every package, provided:

- the work remains inside the directive
- no new protected change is introduced
- no new strategic decision is required
- each package remains traceable and reviewable
- merge and other separately gated actions follow the applicable approval policy

This rule enables continuous orchestration while preserving Founder control at true decision boundaries.
