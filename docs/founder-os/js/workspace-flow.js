(() => {
  const BILLING_KEY = 'nnos_billing_resolution';
  const LEGACY_FOUNDER_KEY = 'nnos_founder_api_key';
  const BLUEPRINT_URL = './founder-os/config/natural-nation-blueprint.json';
  const PACKAGE_URL = './execution-packages/NN-BUILD-001.json';

  let state = {
    billingResolution: sessionStorage.getItem(BILLING_KEY) || 'excluded-from-mvp',
    blueprintApproved: false,
    packageReady: false,
    transactionId: ''
  };

  sessionStorage.removeItem(LEGACY_FOUNDER_KEY);

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  async function fetchJson(url) {
    const response = await fetch(`${url}?flow=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
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
      pkg?.sourceTransactionId === transactionId
    );
  }

  function activateWorkspace(target) {
    if (typeof window.setWorkspace === 'function') window.setWorkspace(target);
    if (typeof window.NNOSShowExecutionBar === 'function') window.NNOSShowExecutionBar(target);
    $$('[data-context-module]').forEach((button) => {
      button.classList.toggle('active', button.dataset.contextModule === target);
    });
  }

  function setIfChanged(node, property, value) {
    if (!node) return;
    if (property === 'textContent') {
      if (node.textContent !== value) node.textContent = value;
      return;
    }
    if (property === 'disabled') {
      if (node.disabled !== value) node.disabled = value;
      return;
    }
    if (node.getAttribute(property) !== value) node.setAttribute(property, value);
  }

  function renderFlowState() {
    const buildNav = $('[data-context-module="build"]');
    if (buildNav) {
      const locked = state.packageReady ? 'false' : 'true';
      setIfChanged(buildNav, 'data-flow-locked', locked);
      setIfChanged(buildNav, 'aria-disabled', locked);
      setIfChanged(
        buildNav,
        'title',
        state.packageReady
          ? 'Open the canonical NN-BUILD-001 package.'
          : 'Build Studio unlocks after canonical Blueprint approval creates NN-BUILD-001.'
      );
      setIfChanged(buildNav, 'textContent', state.packageReady ? 'Build Studio' : 'Build Studio · Locked');
    }

    const reviewButton = $('[data-review-blueprint]');
    if (reviewButton) {
      const decisionResolved = state.billingResolution !== 'unresolved';
      setIfChanged(reviewButton, 'disabled', !decisionResolved);
      setIfChanged(
        reviewButton,
        'textContent',
        state.packageReady
          ? 'Open Build Studio →'
          : decisionResolved
            ? 'Continue to Blueprint →'
            : 'Resolve Billing to Continue'
      );
    }

    document.body.dataset.nnosFlowStage = state.packageReady
      ? 'build-ready'
      : state.blueprintApproved
        ? 'publishing-package'
        : 'blueprint-review';
  }

  async function refreshFlowState() {
    let blueprint = null;
    let pkg = null;

    try {
      blueprint = await fetchJson(BLUEPRINT_URL);
    } catch {
      // Blueprint loader displays its own error state.
    }

    state.blueprintApproved = isApproved(blueprint);
    state.transactionId = blueprint?.approvalTransactionId || '';
    state.billingResolution = blueprint?.decisionResolutions?.['billing-mvp'] || sessionStorage.getItem(BILLING_KEY) || 'excluded-from-mvp';
    sessionStorage.setItem(BILLING_KEY, state.billingResolution);

    if (state.blueprintApproved) {
      try {
        pkg = await fetchJson(PACKAGE_URL);
      } catch {
        pkg = null;
      }
    }

    state.packageReady = isPackageReady(pkg, state.transactionId);
    renderFlowState();
    return { ...state };
  }

  document.addEventListener('click', (event) => {
    const resumeButton = event.target.closest('[data-resume-workspace]');
    if (resumeButton) window.setTimeout(renderFlowState, 250);

    const buildButton = event.target.closest('[data-context-module="build"]');
    if (buildButton && !state.packageReady) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      activateWorkspace('blueprint');
      window.alert('Build Studio is locked until the Gateway commits the approved Blueprint and GitHub publishes NN-BUILD-001.');
      return;
    }

    const reviewButton = event.target.closest('[data-review-blueprint]');
    if (!reviewButton) return;

    if (state.packageReady) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      activateWorkspace('build');
      window.NNOSCanonicalBuild?.reload?.();
      return;
    }

    if (state.billingResolution === 'unresolved') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      window.alert('Choose whether billing belongs in Phase 1 or Phase 2 before continuing to Blueprint.');
    }
  }, true);

  window.addEventListener('founder-os:discovery-decision-changed', (event) => {
    state.billingResolution = event.detail?.billingResolution || 'unresolved';
    sessionStorage.setItem(BILLING_KEY, state.billingResolution);
    renderFlowState();
  });

  window.addEventListener('founder-os:canonical-blueprint-approved', async () => {
    await refreshFlowState();
    if (state.packageReady) window.NNOSCanonicalBuild?.reload?.();
  });

  window.NNOSWorkspaceFlow = {
    refresh: refreshFlowState,
    get state() { return { ...state }; }
  };

  refreshFlowState();
})();