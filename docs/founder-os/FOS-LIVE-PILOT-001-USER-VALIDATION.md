# FOS-LIVE-PILOT-001 — Founder User Validation

## Purpose

This guide verifies the GitHub Pages Founder OS pilot, the Cloudflare runtime connection, workspace isolation, approval binding, evidence capture, retry behavior, database persistence, and provider health.

## Evidence labels

- **Live** means the browser received results from the configured Cloudflare runtime.
- **Review mode** means the browser is running the safe local simulation. Those records are not production evidence.

## Open the pilot

1. Open the repository Actions tab.
2. Open **Deploy Founder OS Live Pilot**.
3. Confirm the latest `main` run is green.
4. Open the deployment URL shown in the `github-pages` environment.
5. Confirm the page title says **Live Founder Review Pilot**.

## Connect the governed runtime

1. In **Runtime Connection**, enter the public Cloudflare Worker base URL. Do not enter any API key or secret.
2. Select **Connect**.
3. Confirm the top badge changes from **Review mode** to **Live runtime connected**.
4. Confirm the checklist marks runtime API, database, and providers according to the health response.

Expected health contract:

```json
{
  "status": "healthy",
  "database": true,
  "providers": { "openai": true, "googleAI": true }
}
```

## Run the Natural Nation pilot

1. Select **Natural Nation — Workspace #1**.
2. Select **Run Pilot** once.
3. Confirm a new run appears.
4. Confirm the run includes an evidence record and cost record.
5. Confirm a consequential publication creates a pending approval rather than publishing automatically.
6. Select **Review & Approve**.
7. Compare the displayed payload hash with the approval record returned by the runtime.
8. Select **Approve Exact Action**.
9. Confirm the approval leaves the queue and the release status changes.

## Verify idempotency and retry

1. Run the same pilot request again using the same server-provided idempotency key when available.
2. Confirm the runtime returns the existing run instead of creating a duplicate.
3. Confirm the run history shows no more than the configured bounded retry count.
4. Confirm a transient provider failure is recorded before a successful retry or a safe terminal failure.

## Verify workspace isolation

1. Keep Natural Nation selected.
2. Select **Test Isolation**.
3. Confirm the API denies access to Contractor Estimator data.
4. Confirm the checklist marks cross-workspace denial as verified.
5. Confirm no Contractor Estimator run, evidence, approval, or cost appears in Natural Nation.

## Verify database persistence

1. Note the newest run ID.
2. Refresh the browser.
3. Reconnect to the runtime if necessary.
4. Confirm the same run, approval state, evidence, and cost record reload from the server.
5. Open the pilot in a second browser or private window and confirm server-backed records are still available after authorized access.

## Verify safe failure behavior

1. Temporarily use an invalid Worker URL.
2. Confirm the UI switches to **Review mode** and clearly labels new records as local review evidence.
3. Confirm no secret appears in the page, URL, browser console, network request body, or local storage.
4. Restore the correct Worker URL and reconnect.

## Acceptance checklist

The pilot passes Founder validation only when:

- GitHub Pages deployment is green.
- Cloudflare runtime reports healthy.
- Database persistence is verified after refresh.
- OpenAI and Google AI health are verified server-side.
- Natural Nation remains Workspace #1.
- A consequential action cannot execute without exact approval.
- Evidence, audit, observability, and cost records are created.
- Retry is bounded and observable.
- Idempotent replay does not duplicate work.
- Cross-workspace access is denied.
- Browser code contains no provider keys or protected secrets.

## Production certification boundary

A successful Founder review pilot is not production certification. Production certification additionally requires deployment security review, backup and restore evidence, incident response verification, monitoring alerts, live rollback testing, and approved release governance.
