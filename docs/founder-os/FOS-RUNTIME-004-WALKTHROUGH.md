# FOS-RUNTIME-004 Founder Walkthrough

The governed connector gateway now enforces registered providers, active workspace-scoped connections, declared capabilities, secret references, approval binding for consequential actions, redaction, fallback routing, health reporting, and audit/observability/cost emissions.

The fixtures cover OpenAI, Google AI, GitHub, Cloudflare, Firebase, email, and notifications without storing or exposing live credentials.

## Validate

```bash
node scripts/validate-connector-gateway.mjs
```

Live adapters must resolve secret references only inside the protected runtime and must never return secret values to evidence or logs.