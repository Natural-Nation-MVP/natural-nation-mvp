# FOS-FOUNDATION-015 — Knowledge and Artifact Registry

## Founder outcome
Founder OS now distinguishes drafts, active references, locked decisions, superseded versions, deprecated material, and archived records. Every artifact keeps its workspace owner, immutable identity, version, provenance, evidence references, sensitivity, retention rule, and content hash.

## Natural Nation example
`DUEY-SPEC-001` is locked and marked as the source of truth. An AI may propose version 1.2, but it cannot overwrite version 1.1 or silently change Duey's identity. The proposal is recorded as a new artifact and routed for Founder approval.

## Contractor Estimator example
The approved estimate template is registered to the Contractor Estimator workspace. Natural Nation cannot mutate or supersede it.

## Conflict behavior
Two active sources of truth for the same subject block downstream use. Founder OS presents both versions, their provenance, and a difference summary.

## Protected boundaries
The registry stores references and hashes, never raw secrets. Knowledge can inform a workflow but cannot grant approval, connector access, model authority, or execution permission.

## Validation
```bash
node scripts/validate-artifact-registry.mjs
```
