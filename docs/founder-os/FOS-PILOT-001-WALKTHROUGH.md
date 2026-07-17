# FOS-PILOT-001 Founder Walkthrough

This package runs the first complete Natural Nation workflow across the executable runtime, persistence repository, and governed connector gateway.

The pilot proves:

- Natural Nation workspace context enforcement
- AI provider routing through a registered connection
- retry and recovery after a simulated transient failure
- idempotent replay
- exact approval binding and changed-payload denial
- successful approval-gated pilot publication
- cross-workspace denial
- evidence, audit, observability, and cost emissions
- workspace-scoped persistence and recovery checkpoints

## Execute and validate

```bash
node founder-os/pilot/natural-nation/run-pilot.mjs
node scripts/validate-natural-nation-pilot.mjs
```

## Evidence classification

The generated report is **local simulated runtime evidence**. It does not claim live OpenAI, Google AI, Cloudflare, Firebase, email, notification, database, or production deployment evidence. Production certification remains conditional until live credentials, infrastructure, backups, recovery drills, and deployment verification are executed through their governed connectors and approval gates.