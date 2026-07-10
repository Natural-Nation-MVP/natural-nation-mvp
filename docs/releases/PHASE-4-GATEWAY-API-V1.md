# Founder OS Gateway API v1

Status: Approved Architecture

## Purpose

Define the secure API structure used by Founder OS to communicate with automation services, AI providers, repositories, databases, and future integrations.

## Gateway

Service: Founder OS Gateway

Platform: Cloudflare Workers

Environment: development

Current version: 0.1.0

Base URL:

https://founder-os-gateway.dmoseley1024.workers.dev

## Confirmed Live Endpoints

### GET /

Purpose: basic service response.

Returns service name, status, version, and gateway message.

### GET /health

Purpose: live health check.

Returns service name, online status, version, and response time.

### GET /version

Purpose: deployed version discovery.

Returns service name, version, and environment.

## Planned API Groups

### Information

- GET /
- GET /health
- GET /version
- GET /status

### Project Discovery

- GET /projects
- GET /projects/:projectId
- GET /commands

### Planning

- POST /plans
- GET /plans/:planId
- POST /plans/:planId/approve

### Execution

- POST /command
- POST /build
- POST /deploy

### AI Services

- POST /ai/openai
- POST /ai/gemini
- POST /ai/codex

### Administration

- GET /logs
- GET /metrics
- GET /executions/:executionId

## Security Rules

- No secrets are stored in the browser.
- Permanent actions require authorization and approval checks.
- Read-only health and version routes may remain public.
- Repository-changing routes must not be enabled until authentication, validation, audit logging, and approval gates are implemented.
- CORS is restricted to approved Founder OS origins.

## Implementation Rule

The planned routes define the architecture only. Routes are implemented one at a time and validated before the next route is added.

## Next

Connect the Founder OS UI to GET /health and verify live gateway status in the interface.
