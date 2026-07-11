# Workspace Discovery and Blueprint Engine

Status: Approved Architecture

## Purpose

Determine what a workspace needs before applications, repositories, automation, or infrastructure are created.

The Founder describes the desired outcome. Founder OS translates that outcome into a workspace blueprint, required capabilities, and recommended applications.

## Core Flow

1. Founder describes the outcome
2. Founder OS runs guided discovery
3. Founder OS creates a Workspace Blueprint
4. Founder OS identifies required capabilities
5. Founder OS recommends applications
6. Founder reviews the recommendations
7. Founder approves the blueprint
8. Founder OS installs and configures approved applications

## Workspace Blueprint

Every workspace blueprint must define:

- workspace name
- workspace type
- problem being solved
- intended users
- primary outcome
- website, application, API, automation, or mixed delivery
- essential user journeys
- data that must be stored
- identity and account requirements
- AI requirements
- external integrations
- security and privacy needs
- revenue model
- MVP boundaries
- future capabilities
- approved applications

The blueprint becomes the canonical definition of the workspace.

## Discovery Questions

Founder OS should ask only questions that materially affect the architecture:

- What are you creating?
- Who is it for?
- What must users be able to do?
- Does it require user accounts?
- Will it collect or store data?
- Does it need AI?
- Will users pay?
- Where should it run?
- What must exist in the first working release?

Follow-up questions are asked only when needed.

## Recommendation Sources

Founder OS uses four sources when recommending applications:

1. Guided discovery answers
2. Workspace templates
3. Capability-to-application rules
4. Existing workspace intelligence

Existing intelligence includes approved requirements, locked decisions, designs, assets, repositories, architecture, and build history.

## Application Recommendation Classes

### Required

The workspace cannot deliver its core outcome without the application.

### Recommended

The application improves the planned release but is not essential.

### Later

The application may be useful in the future but is deliberately excluded from the current phase.

## Explanation Rule

Every recommendation must include:

- why the application is needed
- which capability it supports
- what happens if it is removed
- whether it is required now or can wait

## Example Capability Mapping

- user sign-in -> identity capability -> Authentication application
- saved progress -> persistent data capability -> Database application
- public content -> web publishing capability -> Website Builder
- personalized AI guidance -> AI orchestration capability -> AI Team and Knowledge applications
- paid access -> commerce capability -> Billing and Subscription applications

## Change Detection

When the Founder adds a new outcome later, Founder OS evaluates whether new capabilities and applications are required.

No new application is installed without Founder approval.

## Natural Nation Validation

Natural Nation is the first real validation workspace.

Founder OS must produce a draft Natural Nation blueprint and application recommendation, then compare it against the existing approved Natural Nation architecture and product requirements.

## Acceptance Criteria

The engine succeeds when it can:

- understand the requested outcome
- recommend the correct applications
- avoid unnecessary applications
- explain every recommendation
- separate MVP needs from future needs
- assemble an approved workspace configuration

## Strategic Backlog

Founder OS may later evolve into a Digital Company Builder.

This positioning is approved as a strategic direction but remains outside the active build and marketing scope.
