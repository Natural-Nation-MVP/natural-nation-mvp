(() => {
  const blueprintPath = './config/natural-nation-blueprint.json';
  const billingResolution = 'excluded-from-mvp';

  let blueprint = null;
  let approvalStage = 'idle';
  let approvalClientRequestId = createClientRequestId();
  let gatewayReady = null;

  const $ = (selector) => document.querySelector(selector);

  function createClientRequestId() {
    if (globalThis.crypto?.randomUUID) return `nn-blueprint-${globalThis.crypto.randomUUID()}`;
    return `nn-blueprint-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function loadGatewayClient() {
    if (window.FounderOSGateway) return window.FounderOSGateway;
    if (!gatewayReady) {
      gatewayReady = import('./gateway-client.js?v=0.1.1').then(() => {
        if (!window.FounderOSGateway) throw new Error('Founder OS Gateway client failed to initialize.');
        return window.FounderOSGateway;
      });
    }
    return gatewayReady;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function badgeClass(classification = '') {
    const key = classification.toLowerCase();
    if (key.includes('required') && !key.includes('decision')) return 'required';
    if (key.includes('recommended')) return 'recommended';
    if (key.includes('later')) return 'later';
    return 'decision';
  }

  function canonicalApprovedState(value = blueprint) {
    return Boolean(
      value &&
      value.status === 'Approved' &&
      value.locked === true &&
      value.decisionResolutions?.['billing-mvp'] === billingResolution &&
      Array.isArray(value.openDecisions) &&
      value.openDecisions.length === 0 &&
      value.snapshot?.openDecisions === 0 &&
      value.approvalTransactionId
    );
  }

  function renderList(selector, items = []) {
    const container = $(selector);
    if (!container) return;
    container.innerHTML = items.map((item) => `<div class="experience-line">${escapeHtml(item)}</div>`).join('');
  }

  function renderSnapshot() {
    const container = $('[data-blueprint-snapshot]');
    if (!container || !blueprint) return;

    const metrics = [
      ['Build Streams', blueprint.snapshot.buildStreams],
      ['Required Components', blueprint.snapshot.requiredComponents],
      ['Recommended', blueprint.snapshot.recommendedComponents],
      ['Open Decisions', blueprint.snapshot.openDecisions],
      ['Deployment Phases', blueprint.snapshot.deploymentPhases]
    ];

    container.innerHTML = metrics.map(([label, value]) => `
      <article class="snapshot-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${value}</strong>
      </article>
    `).join('');

    const total = blueprint.components.length;
    const required = blueprint.components.filter((item) => item.classification === 'Required').length;
    const recommended = blueprint.components.filter((item) => item.classification === 'Recommended').length;
    const decision = blueprint.components.filter((item) => item.classification.includes('Decision')).length;

    const chart = $('[data-component-chart]');
    if (!chart || !total) return;

    const requiredStop = (required / total) * 100;
    const recommendedStop = requiredStop + (recommended / total) * 100;
    const decisionStop = recommendedStop + (decision / total) * 100;
    chart.style.setProperty('--required-stop', `${requiredStop}%`);
    chart.style.setProperty('--recommended-stop', `${recommendedStop}%`);
    chart.style.setProperty('--decision-stop', `${decisionStop}%`);
  }

  function renderBuildStreams() {
    const container = $('[data-blueprint-build-streams]');
    if (!container || !blueprint) return;
    container.innerHTML = blueprint.buildStreams.map((item) => `
      <article class="build-stream-card">
        <div class="build-stream-icon" aria-hidden="true">${escapeHtml(item.shortName.charAt(0))}</div>
        <div>
          <div class="build-stream-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="blueprint-badge ${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
          </div>
          <p>${escapeHtml(item.purpose)}</p>
        </div>
      </article>
    `).join('');
  }

  function renderDeploymentPhases() {
    const container = $('[data-blueprint-phases]');
    if (!container || !blueprint) return;
    container.innerHTML = blueprint.deploymentPhases.map((item) => `
      <article class="phase-card ${item.status.toLowerCase()}">
        <div>
          <span>${escapeHtml(item.phase)} · ${escapeHtml(item.status)}</span>
          <strong>${escapeHtml(item.title)}</strong>
        </div>
        <p>${escapeHtml(item.description)}</p>
      </article>
    `).join('');
  }

  function renderComponents() {
    const groups = {
      required: blueprint.components.filter((item) => item.classification === 'Required'),
      recommended: blueprint.components.filter((item) => item.classification === 'Recommended'),
      decision: blueprint.components.filter((item) => item.classification.includes('Decision')),
      later: blueprint.components.filter((item) => item.classification === 'Later')
    };

    Object.entries(groups).forEach(([key, items]) => {
      const container = $(`[data-components-${key}]`);
      if (!container) return;
      container.innerHTML = items.map((item) => `
        <article class="component-card">
          <div class="component-card-head">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="blueprint-badge ${badgeClass(item.classification)}">${escapeHtml(item.classification)}</span>
          </div>
          <p>${escapeHtml(item.supports)}</p>
          <small>${escapeHtml(item.reason)}</small>
        </article>
      `).join('');
    });
  }

  function renderOpenDecisions() {
    const container = $('[data-blueprint-decisions]');
    if (!container || !blueprint) return;

    if (canonicalApprovedState()) {
      container.innerHTML = `
        <article class="blueprint-decision">
          <div class="eyebrow">Founder Decision Committed</div>
          <h3>MVP subscription billing</h3>
          <p>Subscription billing is excluded from the first MVP release and recorded in GitHub.</p>
          <small>Transaction: ${escapeHtml(blueprint.approvalTransactionId)}</small>
        </article>
      `;
      return;
    }

    container.innerHTML = (blueprint.openDecisions || []).map((item) => `
      <article class="blueprint-decision">
        <div class="eyebrow">Founder Decision Pending Commit</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>Selected resolution: subscription billing excluded from the first MVP release.</p>
        <small>This decision remains pending until the Gateway commits it to GitHub.</small>
      </article>
    `).join('') || '<p class="muted">No decision data is available.</p>';
  }

  function renderBlueprint() {
    if (!blueprint) return;

    const canonicalApproved = canonicalApprovedState();
    approvalStage = canonicalApproved ? 'committed' : 'idle';

    setText('[data-blueprint-version]', blueprint.blueprintVersion);
    setText('[data-blueprint-status]', blueprint.status);
    setText('[data-blueprint-confidence]', `${blueprint.confidence}%`);
    setText('[data-blueprint-summary]', blueprint.summary);
    setText('[data-blueprint-mission]', blueprint.mission);
    setText('[data-blueprint-approval-effect]', canonicalApproved ? 'Verified in GitHub. Ready for Build Studio.' : 'Validate before canonical approval.');
    setText('[data-sticky-confidence]', `${blueprint.confidence}% confidence`);
    setText('[data-sticky-decisions]', canonicalApproved ? 'Committed' : 'Pending commit');

    const button = $('[data-approve-blueprint]');
    if (button) {
      button.disabled = canonicalApproved;
      button.textContent = canonicalApproved ? 'Blueprint Approved ✓' : 'Validate Approval →';
    }

    renderList('[data-blueprint-users]', blueprint.users);
    renderList('[data-blueprint-experience]', blueprint.coreUserExperience);
    renderSnapshot();
    renderBuildStreams();
    renderDeploymentPhases();
    renderComponents();
    renderOpenDecisions();
  }

  async function fetchCanonicalBlueprint(cacheKey = Date.now()) {
    const response = await fetch(`${blueprintPath}?verify=${encodeURIComponent(cacheKey)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Canonical Blueprint returned ${response.status}.`);
    return response.json();
  }

  async function requestApproval(dryRun) {
    const gateway = await loadGatewayClient();
    return gateway.approveBlueprint({
      workspaceId: blueprint.workspaceId,
      blueprintVersion: blueprint.blueprintVersion,
      billingResolution,
      dryRun,
      clientRequestId: approvalClientRequestId
    });
  }

  function showDryRunPassed(result) {
    approvalStage = 'dry-run-passed';
    const button = $('[data-approve-blueprint]');
    if (button) {
      button.disabled = false;
      button.textContent = 'Approve Blueprint →';
    }

    setText('[data-blueprint-approval-effect]', 'Dry run passed. No repository files changed.');
    setText('[data-sticky-decisions]', 'Ready to commit');

    const checked = result.checks?.filter((item) => item.status === 'passed').length || 0;
    window.alert(`Dry Run Passed\n\n${checked} checks passed.\n${result.plannedWrites?.length || 0} repository writes prepared.\nNo files were written.`);
  }

  async function verifyCanonicalCommit(result) {
    const verified = await fetchCanonicalBlueprint(result.repository?.commitSha || result.transactionId || Date.now());

    if (!canonicalApprovedState(verified)) {
      throw new Error('GitHub did not return a fully approved and locked Blueprint after the transaction.');
    }

    if (verified.approvalTransactionId !== result.transactionId) {
      throw new Error('The canonical Blueprint transaction ID does not match the Gateway response.');
    }

    blueprint = verified;
    renderBlueprint();
    window.dispatchEvent(new CustomEvent('founder-os:canonical-blueprint-approved', {
      detail: {
        transactionId: result.transactionId,
        executionPackageId: result.executionPackage?.id || 'NN-BUILD-001',
        commitSha: result.repository?.commitSha || ''
      }
    }));

    return verified;
  }

  async function showApprovalCommitted(result) {
    const button = $('[data-approve-blueprint]');
    if (button) button.textContent = 'Verifying GitHub…';
    setText('[data-blueprint-approval-effect]', 'Commit returned. Verifying canonical repository state…');
    setText('[data-sticky-decisions]', 'Verifying');

    await verifyCanonicalCommit(result);

    window.alert(`Blueprint Approved and Verified\n\nTransaction: ${result.transactionId}\nPackage: ${result.executionPackage?.id || 'NN-BUILD-001'}\nCommit: ${result.repository?.commitSha || 'verified'}\n\nGitHub now contains the resolved billing decision and locked Blueprint.`);

    if (typeof window.setWorkspace === 'function') window.setWorkspace('build');
    if (typeof window.NNOSShowExecutionBar === 'function') window.NNOSShowExecutionBar('build');
  }

  async function runApprovalAction(button) {
    if (!blueprint) {
      window.alert('The Blueprint is still loading.');
      return;
    }

    if (approvalStage === 'committed') return;
    button.disabled = true;

    try {
      if (approvalStage === 'idle') {
        button.textContent = 'Running Dry Run…';
        showDryRunPassed(await requestApproval(true));
        return;
      }

      const confirmed = window.confirm(
        'Approve the Natural Nation Blueprint for real?\n\nFounder OS will remain on this page until GitHub confirms the approval record, resolved billing decision, NN-BUILD-001, Blueprint lock, and workspace update.'
      );

      if (!confirmed) {
        button.disabled = false;
        button.textContent = 'Approve Blueprint →';
        return;
      }

      button.textContent = 'Committing Approval…';
      const result = await requestApproval(false);
      await showApprovalCommitted(result);
    } catch (error) {
      approvalStage = canonicalApprovedState() ? 'committed' : 'idle';
      button.disabled = approvalStage === 'committed';
      button.textContent = approvalStage === 'committed' ? 'Blueprint Approved ✓' : 'Validate Approval →';
      setText('[data-blueprint-approval-effect]', 'Canonical approval not verified. Blueprint remains in review.');
      setText('[data-sticky-decisions]', 'Pending commit');
      window.alert(`Approval action blocked\n\n${error.message}`);
    }
  }

  async function loadBlueprint() {
    const status = $('[data-blueprint-load-status]');
    try {
      blueprint = await fetchCanonicalBlueprint();
      renderBlueprint();
      if (status) status.textContent = canonicalApprovedState()
        ? 'Canonical Founder-approved Blueprint loaded from GitHub Pages.'
        : 'Founder Review Blueprint loaded. No canonical approval has been committed.';
    } catch (error) {
      if (status) status.textContent = 'Workspace Blueprint could not be loaded.';
      console.error(error);
    }
  }

  document.addEventListener('click', (event) => {
    const review = event.target.closest('[data-review-blueprint]');
    if (review) {
      event.preventDefault();
      if (typeof window.setWorkspace === 'function') window.setWorkspace('blueprint');
      if (typeof window.NNOSShowExecutionBar === 'function') window.NNOSShowExecutionBar('blueprint');
      document.querySelectorAll('[data-context-module]').forEach((button) => {
        button.classList.toggle('active', button.dataset.contextModule === 'blueprint');
      });
      return;
    }

    const approve = event.target.closest('[data-approve-blueprint]');
    if (approve) {
      event.preventDefault();
      runApprovalAction(approve);
    }
  });

  loadBlueprint();
})();