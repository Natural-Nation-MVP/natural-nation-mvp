# Founder OS Gateway

Canonical source for the Cloudflare Worker deployed as `founder-os-gateway`.

## Current version

`0.1.0`

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

Deployment requires Cloudflare authentication through Wrangler or Cloudflare Builds.

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
