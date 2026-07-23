(() => {
  const BILLING_KEY = 'nnos_billing_resolution';
  const LEGACY_FOUNDER_KEY = 'nnos_founder_api_key';

  let state = {
    billingResolution: sessionStorage.getItem(BILLING_KEY) || 'excluded-from-mvp',
    blueprintApproved: false,
    packageReady: false,
    orchestrationReady: false,
    buildAvailable: false,
    transactionId: '',
    error: null
  };

  sessionStorage.removeItem(LEGACY_FOUNDER_KEY);

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

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
      const locked = state.buildAvailable ? 'false' : 'true';
      setIfChanged(buildNav, 'data-flow-locked', locked);
      setIfChanged(buildNav, 'aria-disabled', locked);
      setIfChanged(buildNav, 'title', state.buildAvailable
        ? 'Open live Build Work for NN-BUILD-001.'
        : state.error || 'Build Work unlocks when the canonical runtime state is fully available.');
      setIfChanged(buildNav, 'textContent', state.buildAvailable ? 'Build Work' : 'Build Work · Locked');
    }

    const reviewButton = $('[data-review-blueprint]');
    if (reviewButton) {
      const decisionResolved = state.billingResolution !== 'unresolved';
      setIfChanged(reviewButton, 'disabled', !decisionResolved);
      setIfChanged(reviewButton, 'textContent', state.buildAvailable
        ? 'Open Build Work →'
        : decisionResolved
          ? 'Continue to Blueprint →'
          : 'Resolve Billing to Continue');
    }

    document.body.dataset.nnosFlowStage = state.buildAvailable
      ? 'build-ready'
      : state.packageReady
        ? 'waiting-for-orchestration'
        : state.blueprintApproved
          ? 'publishing-package'
          : 'blueprint-review';
  }

  function applyRuntimeSnapshot(snapshot) {
    state = {
      ...state,
      blueprintApproved: Boolean(snapshot?.blueprintApproved),
      packageReady: Boolean(snapshot?.packageReady),
      orchestrationReady: Boolean(snapshot?.orchestrationReady),
      buildAvailable: Boolean(snapshot?.buildAvailable),
      transactionId: snapshot?.transactionId || '',
      error: snapshot?.error || null
    };
    renderFlowState();
    return { ...state };
  }

  async function refreshFlowState() {
    if (!window.NNOSRuntimeState?.refresh) {
      state = { ...state, error: 'Canonical runtime state is still loading.', buildAvailable: false };
      renderFlowState();
      return { ...state };
    }
    const snapshot = await window.NNOSRuntimeState.refresh();
    return applyRuntimeSnapshot(snapshot);
  }

  document.addEventListener('click', (event) => {
    const resumeButton = event.target.closest('[data-resume-workspace]');
    if (resumeButton) window.setTimeout(refreshFlowState, 250);

    const buildButton = event.target.closest('[data-context-module="build"]');
    if (buildButton && !state.buildAvailable) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      activateWorkspace('blueprint');
      window.alert(state.error
        ? `Build Work is unavailable.\n\n${state.error}`
        : 'Build Work is locked until the approved Blueprint, NN-BUILD-001, and live Gateway orchestration state are all verified.');
      return;
    }

    const reviewButton = event.target.closest('[data-review-blueprint]');
    if (!reviewButton) return;

    if (state.buildAvailable) {
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

  window.addEventListener('founder-os:runtime-state-changed', (event) => {
    applyRuntimeSnapshot(event.detail || {});
  });

  window.addEventListener('founder-os:discovery-decision-changed', (event) => {
    state.billingResolution = event.detail?.billingResolution || 'unresolved';
    sessionStorage.setItem(BILLING_KEY, state.billingResolution);
    renderFlowState();
  });

  window.addEventListener('founder-os:canonical-blueprint-approved', refreshFlowState);

  window.NNOSWorkspaceFlow = {
    refresh: refreshFlowState,
    get state() { return { ...state }; }
  };

  if (window.NNOSRuntimeState?.snapshot?.loaded) applyRuntimeSnapshot(window.NNOSRuntimeState.snapshot);
  else refreshFlowState();
})();