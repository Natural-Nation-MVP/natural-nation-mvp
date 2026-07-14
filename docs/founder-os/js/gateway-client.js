(() => {
  const GATEWAY_ORIGIN = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const SESSION_KEY = 'nnos_founder_api_key';

  function getFounderKey() {
    let key = sessionStorage.getItem(SESSION_KEY);
    if (key) return key;

    key = window.prompt(
      'Enter the temporary Founder API key for this browser session. It will not be saved to GitHub or localStorage.'
    );

    if (!key) throw new Error('Founder authentication was cancelled.');
    sessionStorage.setItem(SESSION_KEY, key.trim());
    return key.trim();
  }

  async function request(path, options = {}) {
    const response = await fetch(`${GATEWAY_ORIGIN}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${getFounderKey()}`,
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

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem(SESSION_KEY);
      }

      throw error;
    }

    return payload;
  }

  function clientRequestId(prefix = 'nn-blueprint') {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function approveBlueprint({ workspaceId, blueprintVersion, billingResolution, dryRun, clientRequestId: requestId }) {
    return request(
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
  }

  window.FounderOSGateway = {
    approveBlueprint,
    clearSessionCredential() {
      sessionStorage.removeItem(SESSION_KEY);
    }
  };
})();
