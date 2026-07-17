# FOS-FOUNDATION-007 — AI Role, Capability, Provider, Model, and Tool Registry

## Status
Implementation candidate

## Purpose
Separate responsibility, ability, intelligence supply, model selection, and executable tooling so workspaces can compose AI teams without treating a provider name as a job role.

## Canonical distinctions
- **Role** — responsibility and expected outcomes, such as Architect, Builder, Reviewer, Estimator, or Proposal Writer.
- **Capability** — an ability required by a task, such as architecture design, code implementation, estimate calculation, evidence review, or document generation.
- **Provider** — an external or internal intelligence service. A provider has no independent authority.
- **Model** — a provider-hosted intelligence option with declared modalities, constraints, and routing characteristics.
- **Tool** — an executable mechanism that performs an action. Tools do not grant themselves permission.

## Team composition
Each workspace declares role assignments. Every assignment references one role, required capabilities, routing policy, permitted tools, and an authority class. Provider and model selection remains replaceable and may be resolved at execution time.

## Routing flow
1. Load workspace and task context.
2. Resolve the assigned role.
3. Confirm required capabilities.
4. Filter eligible providers and models by policy, availability, modality, quality, cost, and data constraints.
5. Confirm permitted tools.
6. Select a primary route and ordered fallbacks.
7. Execute within the role's authority.
8. Record provider, model, tool, evidence, and routing outcome.

## Authority rules
- Roles receive authority only from Founder OS governance and workspace policy.
- Providers and models never receive independent approval authority.
- Tool availability does not imply permission to use the tool.
- Strategic, destructive, financial, security-sensitive, and externally consequential actions remain Founder-gated.
- A fallback may replace a provider or model but may not change the role, required capabilities, task contract, evidence requirements, or approval boundary.

## Product neutrality
Natural Nation may use Mentor, Product Architect, Builder, Experience Reviewer, and Governance Reviewer roles. Contractor Estimator may use Scope Analyst, Estimator, Estimate Reviewer, and Proposal Writer roles. Both use the same registry contract.

## Failure behavior
Execution is blocked when no eligible route satisfies required capabilities, policy, tool permissions, or evidence requirements. Founder OS returns the reason and allowed remediation rather than silently weakening the contract.

## Protected boundary
This package does not modify authentication, authorization, identity, sessions, tokens, secrets handling, access controls, security middleware, preventative-security measures, or security-sensitive infrastructure.