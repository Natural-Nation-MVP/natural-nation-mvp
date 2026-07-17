# FOS-FOUNDATION-006 — Workflow and Action Registry

## Status
Implementation candidate

## Purpose
Allow each workspace to define its own workflows and executable actions without hard-coding Natural Nation or a universal five-task sequence into Founder OS.

## Workflow contract
A workflow declares:
- stable workflow ID and version
- owning workspace ID
- purpose, trigger, and supported project types
- ordered or dependency-based task graph
- role and capability requirements
- input and output contracts
- evidence and verification requirements
- retry and recovery policy
- approval gates
- completion and delivery rules

Every task node must include its own ID, dependencies, required role, required capabilities, expected output, evidence requirement, verification rule, approval class, and failure behavior.

## Action contract
An action declares:
- stable action ID and version
- owning workspace ID
- allowed actor types
- required inputs
- required capabilities and tools
- reversible or irreversible classification
- approval policy
- expected output
- evidence and audit behavior

Actions may start workflows, request approvals, generate deliverables, or perform workspace operations. Founder OS validates context and policy before execution.

## Compatibility
Existing Natural Nation task IDs such as `AI-TASK-001` through `AI-TASK-005` may continue through a compatibility mapping. Those IDs remain workflow-local and do not define Founder OS core architecture.

## Product-neutral proof
The Contractor Estimator workflow uses a different graph:
1. capture job scope
2. calculate materials and labor
3. review estimate
4. generate customer proposal

This proves that a workspace may use a different sequence, roles, outputs, and approval behavior without changing Founder OS schemas.

## Failure behavior
- missing dependencies block a task
- cross-workspace action or workflow references are rejected
- verification failure routes to retry or remediation according to policy
- approval-required actions cannot finalize without the required decision
- irreversible or externally consequential actions remain Founder-gated

## Protected boundary
This package does not modify authentication, authorization, identity, sessions, tokens, secrets handling, access controls, security middleware, preventative-security measures, or security-sensitive infrastructure.
