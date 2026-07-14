(() => {
  const blueprintPath = './config/natural-nation-blueprint.json?v=0.2.1';
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
      gatewayReady = import('./gateway-client.js?v=0.1.0').then(() => {
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
    container.innerHTML = blueprint.openDecisions.map((item) => `
      <article class="blueprint-decision">
        <div class="eyebrow">Founder Decision Resolved</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>Subscription billing is excluded from the first MVP release.</p>
        <small>${escapeHtml(item.impact)}</small>
      </article>
    `).join('');
  }

  function renderBlueprint() {
    if (!blueprint) return;

    const canonicalApproved = blueprint.status === 'Approved' && blueprint.locked === true;
    approvalStage = canonicalApproved ? 'committed' : 'idle';

    setText('[data-blueprint-version]', blueprint.blueprintVersion);
    setText('[data-blueprint-status]', blueprint.status);
    setText('[data-blueprint-confidence]', `${blueprint.confidence}%`);
    setText('[data-blueprint-summary]', blueprint.summary);
    setText('[data-blueprint-mission]', blueprint.mission);
    setText('[data-blueprint-approval-effect]', canonicalApproved ? 'Canonical approval committed.' : 'Validate before canonical approval.');
    setText('[data-sticky-confidence]', `${blueprint.confidence}% confidence`);
    setText('[data-sticky-decisions]', canonicalApproved ? 'Approved' : 'Billing excluded');

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

    setText('[data-blueprint-approval-effect]', 'Dry run passed. Ready to commit.');
    setText('[data-sticky-decisions]', '0 blockers');

    const checked = result.checks?.filter((item) => item.status === 'passed').length || 0;
    window.alert(`Dry Run Passed\n\n${checked} checks passed.\n${result.plannedWrites?.length || 0} repository writes prepared.\nNo files were written.`);
  }

  function showApprovalCommitted(result) {
    approvalStage = 'committed';
    setText('[data-blueprint-status]', 'Approved');
    setText('[data-blueprint-approval-effect]', 'Canonical approval committed.');
    setText('[data-sticky-decisions]', 'Approved');

    const button = $('[data-approve-blueprint]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Blueprint Approved ✓';
    }

    setText('[data-selected-id]', result.executionPackage?.id || 'NN-BUILD-001');
    setText('[data-selected-title]', 'Natural Nation Blueprint Implementation');
    setText('[data-selected-meta]', 'Owner: Codex • Type: Implementation Package • Status: Ready');
    setText('[data-validation-status]', `Canonical transaction ${result.transactionId} committed.`);
    setText('[data-build-approval]', 'Founder Approval Complete');

    window.alert(`Blueprint Approved\n\nTransaction: ${result.transactionId}\nPackage: ${result.executionPackage?.id || 'NN-BUILD-001'}\nCommit: ${result.repository?.commitSha || 'verified'}`);

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
        'Approve the Natural Nation Blueprint for real?\n\nThis will create the approval record, audit event, NN-BUILD-001, Blueprint lock, and workspace update in GitHub. Billing remains excluded from the MVP.'
      );

      if (!confirmed) {
        button.disabled = false;
        button.textContent = 'Approve Blueprint →';
        return;
      }

      button.textContent = 'Committing Approval…';
      showApprovalCommitted(await requestApproval(false));
    } catch (error) {
      button.disabled = false;
      button.textContent = approvalStage === 'dry-run-passed' ? 'Approve Blueprint →' : 'Validate Approval →';
      window.alert(`Approval action blocked\n\n${error.message}`);
    }
  }

  async function loadBlueprint() {
    const status = $('[data-blueprint-load-status]');
    try {
      const response = await fetch(blueprintPath, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Blueprint returned ${response.status}`);
      blueprint = await response.json();
      renderBlueprint();
      if (status) status.textContent = blueprint.status === 'Approved'
        ? 'Canonical Founder-approved Blueprint loaded.'
        : 'Draft Blueprint assembled from approved Natural Nation intelligence.';
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
