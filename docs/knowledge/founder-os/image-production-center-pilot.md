# Founder OS Image Production Center Pilot

Status: Pilot for Founder Review

## Purpose

Create the first Founder-facing workflow for turning approved product needs into controlled, reusable production-image jobs.

## Pilot Route

```text
/founder-os/image-production/
```

## Included

- production queue with four Natural Nation website asset jobs
- structured image brief editor
- controlled AI prompt generator
- Founder candidate-selection board
- pilot asset approval record
- responsive desktop, tablet, and mobile layout
- explicit boundary showing that no external AI image API is called yet

## Pilot Workflow

1. Select an asset job.
2. Review or revise the image brief.
3. Generate the AI-ready production prompt.
4. Copy the prompt for controlled image generation.
5. Select a candidate placeholder.
6. Approve the selected asset in the pilot session.
7. Review the generated asset-registration record.

## Current Boundary

This pilot is browser-local and does not persist changes to GitHub, Cloudflare, R2, Cloudflare Images, or an external image-generation service.

The candidate board uses placeholders so the Founder can validate the workflow before credentials, storage, generation adapters, or repository-changing actions are introduced.

## Proposed Next Vertical Slice

- add Image Production Center to the Natural Nation workspace navigation
- persist jobs as repository-backed JSON records
- connect the Founder OS Gateway to a protected image-generation adapter
- return generated candidates to the review board
- store approved masters and responsive variants in the approved asset store
- create `asset.json` metadata and an implementation package
- require Founder approval before permanent asset registration

## Governance

- no secrets in the browser
- no external generation without an approved brief
- no permanent asset status without Founder approval
- no overwriting approved assets; revisions receive versions
- Duey must remain an AI wellness robot and must not be rendered as human
