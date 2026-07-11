# Command Center UX v1.1

Status: Approved and Implemented for Founder Review

## Approved Experience

- Daily briefing on Command Center home
- Founder-focused metrics
- Living workspace cards
- Resume buttons named for each workspace
- Context-aware navigation generated from workspace definitions
- Subtle page, card, progress, and status motion
- Reduced-motion accessibility support

## Founder Metrics

- Active Workspaces
- Approvals Waiting
- Automations Running
- Blocked Items
- Deployments
- System Health

## Living Workspace Card Data

- Current stage
- Progress
- Last activity
- Health
- Next recommended action
- Pending approvals

## Context Navigation Rule

The Command Center home shows only the Workspaces navigation entry.

After a workspace is opened, the sidebar is generated from that workspace's module list and includes a return-to-workspaces action.

## Motion Principle

Motion communicates state and should not distract.

## Implemented Files

- docs/founder-os/config/workspace-registry.json
- docs/founder-os/js/workspace-registry.js
- docs/founder-os/css/command-center.css
- docs/founder-os/index.html

## Deferred

The phrase "an AI-guided product development operating system" is approved for future marketing consideration but remains outside the active marketing scope.

## Next

Founder validates Command Center UX v1.1 in the live GitHub Pages interface.
