(() => {
  const BLUEPRINT_URL = window.NNOSPaths.asset('config/natural-nation-blueprint.json');
  const PACKAGE_URL = window.NNOSPaths.site('execution-packages/NN-BUILD-001.json');
  const GATEWAY_URL = 'https://founder-os-gateway.dmoseley1024.workers.dev';

  let snapshot = {
    loaded: false,
    blueprintApproved: false,
    packageReady: false,
    orchestrationReady: false,
    buildAvailable: false,
    transactionId: '',
    packageId: 'NN-BUILD-001',
    orchestration: null,
    error: null,
    updatedAt: null
  };

  async function fetchJson(url) {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}state=${Date.now()}`, { cache: 'no-store' });
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    const text = await response.text();
    if (!contentType.includes('application/json')) {
      throw new Error(`Invalid JSON response from ${new URL(url, window.location.href).hostname}.`);
    }
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { throw new Error('A runtime state response contained unreadable JSON.'); }
    if (!response.ok) throw new Error(body?.error?.message || `${url} returned ${response.status}.`);
    return body;
  }

  function isApproved(blueprint) {
    return Boolean(
      blueprint?.status === 'Approved' &&
      blueprint?.locked === true &&
      blueprint?.approvalTransactionId &&
      blueprint?.decisionResolutions?.['billing-mvp'] &&
      Array.isArray(blueprint?.openDecisions) &&
      blueprint.openDecisions.length === 0 &&
      blueprint?.snapshot?.openDecisions === 0
    );
  }

  function isPackageReady(pkg, transactionId) {
    return Boolean(
      pkg?.packageId === 'NN-BUILD-001' &&
      pkg?.status === 'ready' &&
      pkg?.workspaceId === 'natural-nation' &&
      pkg?.sourceTransactionId === transactionId
    );
  }

  function emit() {
    window.dispatchEvent(new CustomEvent('founder-os:runtime-state-changed', { detail: { ...snapshot } }));
  }

  async function refresh() {
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace || workspace.id !== 'natural-nation') {
      snapshot = { ...snapshot, loaded: true, buildAvailable: false, error: null, updatedAt: new Date().toISOString() };
      emit();
      return { ...snapshot };
    }

    try {
      const blueprint = await fetchJson(BLUEPRINT_URL);
      const blueprintApproved = isApproved(blueprint);
      const transactionId = blueprint?.approvalTransactionId || '';
      let pkg = null;
      let orchestration = null;

      if (blueprintApproved) pkg = await fetchJson(PACKAGE_URL);
      const packageReady = isPackageReady(pkg, transactionId);

      if (packageReady) {
        const stateUrl = `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(pkg.packageId)}/orchestration`;
        const orchestrationBody = await fetchJson(stateUrl);
        if (orchestrationBody?.state?.workspaceId !== workspace.id || orchestrationBody?.state?.packageId !== pkg.packageId) {
          throw new Error('The Gateway returned orchestration state for a different workspace or package.');
        }
        orchestration = orchestrationBody.state;
      }

      snapshot = {
        loaded: true,
        blueprintApproved,
        packageReady,
        orchestrationReady: Boolean(orchestration),
        buildAvailable: blueprintApproved && packageReady && Boolean(orchestration),
        transactionId,
        packageId: pkg?.packageId || 'NN-BUILD-001',
        orchestration,
        error: null,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      snapshot = {
        ...snapshot,
        loaded: true,
        orchestrationReady: false,
        buildAvailable: false,
        orchestration: null,
        error: error?.message || 'Canonical runtime state could not be loaded.',
        updatedAt: new Date().toISOString()
      };
    }

    emit();
    return { ...snapshot };
  }

  window.NNOSRuntimeState = {
    refresh,
    get snapshot() { return { ...snapshot }; }
  };

  window.addEventListener('founder-os:workspace-view-changed', refresh);
  window.addEventListener('founder-os:canonical-blueprint-approved', refresh);
  refresh();
})();
