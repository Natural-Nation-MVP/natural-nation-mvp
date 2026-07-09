# Phase 4 Repository Strategy

Status: Approved

## Phase

Phase 4 — Automation Environment Foundation

## Decision

Founder approved a two-repository strategy with separate long-lived branches for the Natural Nation app and branding page.

## Repository 1

Natural-Nation-FounderOS

Purpose:

- Founder OS
- command center
- automation records
- knowledge base
- governance
- release management
- validation center
- decision ledger
- AI operations

This repository manages the work.

## Repository 2

Natural-Nation-App

Purpose:

- Natural Nation application
- branding page
- app screens
- product assets
- backend code
- release files

This repository ships the product.

## Natural-Nation-App Branches

main

- production-ready code only
- receives approved merges

feature/app

- Natural Nation app development lane
- app screens, Duey, protocols, progress, profile, dashboard

feature/branding-page

- Natural Nation branding page and marketing site lane
- landing page, brand content, sections, visual presentation

automation/founder-os-sync

- automation staging lane
- used by Founder OS workflows when appropriate

## Working Rule

Founder OS manages and automates.

Natural Nation App delivers and ships.

## Workflow

Build App command:

Founder OS -> Cloudflare Workers -> GitHub Actions -> feature/app -> Founder review -> main

Build Branding Page command:

Founder OS -> Cloudflare Workers -> GitHub Actions -> feature/branding-page -> Founder review -> main

## Recommended Practice

Use short-lived task branches under each lane when needed.

Examples:

- feature/dashboard-v1
- feature/duey-chat
- feature/homepage-redesign
- feature/pricing-section

Short-lived branches merge into the correct long-lived lane before final Founder review.

## Next

Proceed to 4.1.6 Founder Approval for the Phase 4.1 platform and repository foundation.
