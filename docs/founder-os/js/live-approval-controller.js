(() => {
  const BILLING_KEY = 'nnos_billing_resolution';
  const BLUEPRINT_URL = './config/natural-nation-blueprint.json';
  let stage = 'idle';
  let blueprint = null;
  let requestId = createRequestId();

  function createRequestId() {
    if (globalThis.crypto?.randomUUID) return `nn-live-approval-${globalThis.crypto.randomUUID()}`;
    return `nn-live-approval-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function billingResolution() {
    return sessionStorage.getItem(BILLING_KEY) || 'excluded-from-mvp';
  }

  async function loadBlueprint() {
    const response = await fetch(`${BLUEPRINT_URL}?live=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Blueprint returned ${response.status}.`);
    blueprint = await response.json();
    return blueprint;
  }

  function getButton() {
    return document.querySelector('[data-approve-blueprint]');
  }

  function setButton(label, disabled = false) {
    const button = getButton();
    if (!button) return;
    button.textContent = label;
    button.disabled = disabled;
  }

  function removeLegacyApprovalUi(root = document) {
    root.querySelectorAll?.('[role="dialog"], dialog, .modal, .modal-backdrop, .approval-modal').forEach((node) => {
      const text = node.textContent || '';
      if (
        text.includes('Approve Natural Nation Blueprint') ||
        text.includes('Founder approval recorded locally') ||
        text.includes('GitHub synchronization pending gateway support')
      ) {
        const backdrop = node.previousElementSibling;
        node.remove();
        if (backdrop?.classList?.contains('modal-backdrop')) backdrop.remove();
        document.body.classList.remove('modal-open');
      }
    });
  }

  async function ensureReady() {
    if (!blueprint) await loadBlueprint();
    if (!window.FounderOSGateway?.approveBlueprint) {
      throw new Error('The live Gateway client did not load. Refresh Founder OS and try again.');
    }
    const resolution = billingResolution();
    if (resolution === 'unresolved') {
      throw new Error('Return to Discovery and resolve the MVP billing decision before approval.');
    }
    return resolution;
  }

  async function runLiveApproval() {
    const resolution = await ensureReady();

    if (stage === 'idle') {
      setButton('Running Live Dry Run…', true);
      const result = await window.FounderOSGateway.approveBlueprint({
        workspaceId: blueprint.workspaceId,
        blueprintVersion: blueprint.blueprintVersion,
        billingResolution: resolution,
        dryRun: true,
        clientRequestId: requestId
      });
      stage = 'dry-run-passed';
      setButton('Approve Blueprint →');
      const passed = result.checks?.filter((item) => item.status === 'passed').length || 0;
      window.alert(`Dry Run Passed\n\n${passed} checks passed.\nNo repository files were written.\n\nPress Approve Blueprint to create the canonical GitHub transaction.`);
      return;
    }

    if (stage === 'dry-run-passed') {
      const confirmed = window.confirm(
        'Approve the Natural Nation Blueprint for real?\n\nThis will create the canonical GitHub approval, audit, transaction, locked Blueprint, workspace update, and NN-BUILD-001.'
      );
      if (!confirmed) return;

      setButton('Committing to GitHub…', true);
      const result = await window.FounderOSGateway.approveBlueprint({
        workspaceId: blueprint.workspaceId,
        blueprintVersion: blueprint.blueprintVersion,
        billingResolution: resolution,
        dryRun: false,
        clientRequestId: requestId
      });

      stage = 'committed';
      setButton('Blueprint Approved ✓', true);
      window.alert(
        `Blueprint Approved and Verified\n\nTransaction: ${result.transactionId}\nCommit: ${result.repository?.commitSha || 'verified'}\nPackage: NN-BUILD-001\n\nFounder OS will reload from canonical repository state.`
      );
      window.location.reload();
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-approve-blueprint]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    removeLegacyApprovalUi();

    runLiveApproval().catch((error) => {
      stage = 'idle';
      setButton('Validate Approval →');
      window.FounderOSGateway?.clearSessionCredential?.();
      window.alert(`Approval action blocked\n\n${error.message}`);
    });
  }, true);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) removeLegacyApprovalUi(node);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  removeLegacyApprovalUi();
  loadBlueprint().catch(() => {});

  window.NNOSLiveApproval = {
    reset() {
      stage = 'idle';
      requestId = createRequestId();
      window.FounderOSGateway?.clearSessionCredential?.();
      setButton('Validate Approval →');
    }
  };
})();