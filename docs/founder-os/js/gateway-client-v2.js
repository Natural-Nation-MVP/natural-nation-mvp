(() => {
  const GATEWAY_ORIGIN = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const BLUEPRINT_URL = './config/natural-nation-blueprint.json';
  const PACKAGE_URL = '../execution-packages/NN-BUILD-001.json';

  // Bootstrap credential is intentionally memory-only.
  // A page refresh always requires explicit Founder authentication again.
  let founderKey = '';

  function sleep(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function getFounderKey({ force = false } = {}) {
    if (!force && founderKey) return founderKey;

    const key = window.prompt(
      'Enter the temporary Founder API key to authorize this protected action. It remains only in this open page and is never written to GitHub or browser storage.'
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
        authorization: `Bearer ${getFounderKey()}`,
        ...(options.headers || {})
      }
    });

    const payload = await response.json().catch(() => ({
      ok: false,
      error: { message: `Gateway returned ${response.status}.` }
    }));

    if (!response.ok || payload?.ok === false) {
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

  async function fetchJson(url) {
    const response = await fetch(`${url}?verify=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}.`);
    return response.json();
  }

  function canonicalMatches(blueprint, pkg, transactionId, billingResolution) {
    return Boolean(
      blueprint?.status === 'Approved' &&
      blueprint?.locked === true &&
      blueprint?.decisionResolutions?.['billing-mvp'] === billingResolution &&
      Array.isArray(blueprint?.openDecisions) &&
      blueprint.openDecisions.length === 0 &&
      blueprint?.snapshot?.openDecisions === 0 &&
      blueprint?.approvalTransactionId === transactionId &&
      pkg?.packageId === 'NN-BUILD-001' &&
      pkg?.sourceTransactionId === transactionId &&
      pkg?.workspaceId === 'natural-nation' &&
      pkg?.status === 'ready'
    );
  }

  async function waitForCanonicalPublication(transactionId, billingResolution) {
    let lastError = null;

    for (let attempt = 1; attempt <= 30; attempt += 1) {
      try {
        const [blueprint, pkg] = await Promise.all([
          fetchJson(BLUEPRINT_URL),
          fetchJson(PACKAGE_URL)
        ]);

        if (canonicalMatches(blueprint, pkg, transactionId, billingResolution)) {
          return { blueprint, executionPackage: pkg, attempts: attempt };
        }

        lastError = new Error('Published repository files do not yet match the committed transaction.');
      } catch (error) {
        lastError = error;
      }

      await sleep(2000);
    }

    throw new Error(`GitHub commit succeeded, but GitHub Pages did not publish the verified transaction within 60 seconds. ${lastError?.message || ''}`.trim());
  }

  function createClientRequestId(prefix = 'nn-blueprint') {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function approveBlueprint({ workspaceId, blueprintVersion, billingResolution, dryRun, clientRequestId }) {
    const payload = await request(
      `/v2/workspaces/${encodeURIComponent(workspaceId)}/blueprints/${encodeURIComponent(blueprintVersion)}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          blueprintVersion,
          decisionResolutions: { 'billing-mvp': billingResolution },
          confirmation: { approved: true, effectAcknowledged: true },
          clientRequestId: clientRequestId || createClientRequestId(dryRun ? 'nn-blueprint-dry-run' : 'nn-blueprint-approval'),
          dryRun: Boolean(dryRun)
        })
      }
    );

    if (dryRun) {
      return {
        ...payload,
        checks: Object.entries(payload.verification || {}).map(([name, value]) => ({
          name,
          status: value === true || (typeof value === 'number' && value > 0) ? 'passed' : 'review'
        }))
      };
    }

    const transactionId = payload.transactionId || payload.transaction?.transactionId;
    if (!transactionId) throw new Error('Gateway did not return a transaction ID.');

    const canonical = await waitForCanonicalPublication(transactionId, billingResolution);
    founderKey = '';

    return {
      ...payload,
      transactionId,
      canonicalVerified: true,
      canonical
    };
  }

  window.FounderOSGateway = {
    approveBlueprint,
    requestFounderKey: getFounderKey,
    clearSessionCredential() {
      founderKey = '';
    },
    hasSessionCredential() {
      return Boolean(founderKey);
    }
  };
})();
