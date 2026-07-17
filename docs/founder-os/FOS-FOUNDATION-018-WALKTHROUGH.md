# FOS-FOUNDATION-018 — Cost, Budget, Usage, and Resource Intelligence

Founder OS now records provider usage in normalized units, allocates costs to one workspace or a documented shared-cost method, separates estimates from actual charges, tracks reservations, reconciles final charges, and forecasts 7-, 30-, and 90-day spending.

## Natural Nation
The workspace budget combines OpenAI, Google AI, Cloudflare, and Firebase usage without exposing prompts, tokens, API keys, or user data. Warning and critical thresholds route attention to the Founder.

## Contractor Estimator
Supplier-data, email, and AI costs are tracked separately. Forecasts may recommend a less expensive provider or schedule, but cannot change billing or purchase capacity.

## Financial authority
Crossing the approved threshold blocks new discretionary spending until the Founder approves the exact amount, provider, workspace, and time period. Approval does not permit unrelated purchases.

## Data quality
Stale pricing is labeled stale and cannot be presented as current. Estimated costs remain visibly estimated until reconciled against provider evidence.

## Validation
```bash
node scripts/validate-cost-engine.mjs
```
