# KB-API-002 — API Catalog v1

Status: Draft Foundation

## Purpose

This record tracks the Natural Nation API areas that should be documented as the implementation matures.

## API Groups

- Health Check
- Authentication
- User Context
- Profile
- Progress
- Protocol
- Dashboard
- Duey

## Auth Context

Authentication supports guest, email, Google, and Apple flows. Guest upgrade should preserve the user UUID.

## Safety and Isolation

Cross-user isolation must be validated. A user should not access another user's private records.

## Related

- docs/knowledge/api/README.md
- docs/knowledge/testing/qa-standard-v1.md
