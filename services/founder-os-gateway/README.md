# Founder OS Gateway

Canonical source for the Cloudflare Worker deployed as `founder-os-gateway`.

## Current version

`0.2.0`

Version `0.2.0` marks the transition from a manually managed Cloudflare Worker to a GitHub-managed canonical deployment.

## Live routes

- `GET /`
- `GET /health`
- `GET /version`

## Local development

```bash
cd services/founder-os-gateway
npm install
npm run dev
```

## Dry-run validation

```bash
npm run check
```

## Deployment

```bash
npm run deploy
```

Cloudflare Builds is connected to:

- repository: `Natural-Nation-MVP/natural-nation-mvp`
- production branch: `main`
- root directory: `services/founder-os-gateway`
- deploy command: `npx wrangler deploy`

Pushing a commit that changes this directory triggers the repository-driven Cloudflare build and deployment flow.

## Secrets

Do not commit secrets.

Use local `.dev.vars` for development and Cloudflare secrets for deployment:

```bash
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put FOUNDER_API_KEY
```

## Canonical source rule

All future Gateway changes must be committed here before deployment. The Cloudflare dashboard is not the source of truth.

## Next implementation

Implement the authenticated Blueprint approval transaction defined in:

`docs/architecture/GATEWAY-API-V2-BLUEPRINT-APPROVAL.md`
