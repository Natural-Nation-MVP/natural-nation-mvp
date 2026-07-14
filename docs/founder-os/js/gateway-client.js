(() => {
  const GATEWAY_ORIGIN = 'https://founder-os-gateway.dmoseley1024.workers.dev';

  // Keep the bootstrap credential only in this JavaScript runtime.
  // Refreshing or reopening Founder OS requires explicit re-entry.
  let founderKey = '';

  function requestFounderKey({ force = false } = {}) {
    if (!force && founderKey) return founderKey;

    const key = window.prompt(
      'Enter the temporary Founder API key to authorize this protected Founder action. The key remains only in this open page and is never written to GitHub or browser storage.'
    );

    if (!key?.trim()) throw new Error('Founder authentication was cancelled.');
    founderKey = key.trim();
    return founderKey;
  }

  async function request(path, options = {}) {
    const response = await fetch(`${GATEWAY_ORIGIN}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${requestFounderKey()}`,
        ...(options.headers || {})
      }
    });

    const payload = await response.json().catch(() => ({
      ok: false,
      error: { message: `Gateway returned ${response.status}.` }
    }));

    if (!response.ok) {
      const error = new Error(
        payload?.error?.message ||
        payload?.blockers?.map((item) => item.message).join(' ') ||
        `Gateway returned ${response.status}.`
      );
      error.status = response.status;
      error.payload = payload;

      if (response.status === 401 || response.status === 403) founderKey = '';
      throw error;
    }

    return payload;
  }

  function clientRequestId(prefix = 'nn-blueprint') {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function approveBlueprint({ workspaceId, blueprintVersion, billingResolution, dryRun, clientRequestId: requestId }) {
    const payload = await request(
      `/v2/workspaces/${encodeURIComponent(workspaceId)}/blueprints/${encodeURIComponent(blueprintVersion)}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          blueprintVersion,
          decisionResolutions: {
            'billing-mvp': billingResolution
          },
          confirmation: {
            approved: true,
            effectAcknowledged: true
          },
          clientRequestId: requestId || clientRequestId(dryRun ? 'nn-blueprint-dry-run' : 'nn-blueprint-approval'),
          dryRun: Boolean(dryRun)
        })
      }
    );

    // Do not retain the bootstrap key after a real canonical transaction.
    if (!dryRun) founderKey = '';
    return payload;
  }

  window.FounderOSGateway = {
    approveBlueprint,
    requestFounderKey,
    clearSessionCredential() {
      founderKey = '';
    },
    hasSessionCredential() {
      return Boolean(founderKey);
    }
  };
})();
