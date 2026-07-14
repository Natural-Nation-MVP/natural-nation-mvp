(() => {
  const blueprintPath = './config/natural-nation-blueprint.json?v=0.2.1';
  const gatewayBaseUrl = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const billingResolution = 'excluded-from-mvp';

  let blueprint = null;
  let founderApiKey = '';
  let approvalStage = 'idle';
  let approvalClientRequestId = createClientRequestId();

  const $ = (selector) => document.querySelector(selector);

  function createClientRequestId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `nn-blueprint-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  function badgeClass(classification) {
    const key = classification.toLowerCase();
    if (key.includes('required') && !key.includes('decision')) return 'required';
    if (key.includes('recommended')) return 'recommended';
    if (key.includes('later')) return 'later';
    return 'decision';
  }

  function renderList(selector, items) {
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
    const later = blueprint.components.filter((item) => item.classification === 'Later').length;

    const chart = $('[data-component-chart]');
    if (chart) {
      const requiredStop = (required / total) * 100;
      const recommendedStop = requiredStop + (recommended / total) * 100;
      const decisionStop = recommendedStop + (decision / total) * 100;
      chart.style.setProperty('--required-stop', `${requiredStop}%`);
      chart.style.setProperty('--recommended-stop', `${recommendedStop}%`);
      chart.style.setProperty('--decision-stop', `${decisionStop}%`);
      chart.setAttribute('aria-label', `${required} required, ${recommended} recommended, ${decision} decision required, ${later} later`);
    }
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

    setText('[data-blueprint-version]', blueprint.blueprintVersion);
    setText('[data-blueprint-status]', blueprint.status);
    setText('[data-blueprint-confidence]', `${blueprint.confidence}%`);
    setText('[data-blueprint-summary]', blueprint.summary);
    setText('[data-blueprint-mission]', blueprint.mission);
    setText('[data-blueprint-approval-effect]', 'Validate before canonical approval.');
    setText('[data-sticky-confidence]', `${blueprint.confidence}% confidence`);
    setText('[data-sticky-decisions]', 'Billing excluded');

    renderList('[data-blueprint-users]', blueprint.users);
    renderList('[data-blueprint-experience]', blueprint.coreUserExperience);
    renderSnapshot();
    renderBuildStreams();
    renderDeploymentPhases();
    renderComponents();
    renderOpenDecisions();
  }

  function openFounderKeyDialog() {
    return new Promise((resolve) => {
      const existing = document.querySelector('[data-founder-key-dialog]');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.dataset.founderKeyDialog = 'true';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'founder-key-title');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(4,12,8,.72);backdrop-filter:blur(8px);';
      overlay.innerHTML = `
        <form style="width:min(440px,100%);background:#fffaf0;border:1px solid rgba(75,94,67,.28);border-radius:14px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.35);">
          <div class="eyebrow">Protected Founder Action</div>
          <h2 id="founder-key-title" style="margin:6px 0 8px;">Enter Founder API Key</h2>
          <p class="muted" style="margin:0 0 14px;">The key is used only for this browser tab. It is not saved, logged, or committed.</p>
          <label style="display:block;font-weight:800;margin-bottom:6px;" for="founder-api-key-input">Founder API Key</label>
          <input id="founder-api-key-input" type="password" autocomplete="off" spellcheck="false" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid rgba(75,94,67,.35);border-radius:8px;font:inherit;" required />
          <p data-key-error style="display:none;color:#8b2525;margin:8px 0 0;font-size:13px;">Enter the temporary Founder API key.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">
            <button type="button" data-key-cancel>Cancel</button>
            <button class="generate" type="submit">Continue</button>
          </div>
        </form>
      `;

      const form = overlay.querySelector('form');
      const input = overlay.querySelector('input');
      const error = overlay.querySelector('[data-key-error]');

      function close(value) {
        document.removeEventListener('keydown', onKeydown);
        overlay.remove();
        resolve(value);
      }

      function onKeydown(event) {
        if (event.key === 'Escape') close('');
      }

      overlay.querySelector('[data-key-cancel]').addEventListener('click', () => close(''));
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) close('');
      });
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) {
          error.style.display = 'block';
          input.focus();
          return;
        }
        close(value);
      });

      document.addEventListener('keydown', onKeydown);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => input.focus());
    });
  }

  async function getFounderApiKey() {
    if (founderApiKey) return founderApiKey;
    founderApiKey = await openFounderKeyDialog();
    return founderApiKey;
  }

  function approvalPayload(dryRun) {
    return {
      workspaceId: blueprint.workspaceId,
      blueprintVersion: blueprint.blueprintVersion,
      decisionResolutions: {
        'billing-mvp': billingResolution
      },
      confirmation: {
        approved: true,
        effectAcknowledged: true
      },
      clientRequestId: approvalClientRequestId,
      dryRun
    };
  }

  async function requestApproval(dryRun) {
    const key = await getFounderApiKey();
    if (!key) throw new Error('Founder authentication was cancelled.');

    const version = encodeURIComponent(blueprint.blueprintVersion);
    const response = await fetch(
      `${gatewayBaseUrl}/v2/workspaces/natural-nation/blueprints/${version}/approve`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
          'x-client-request-id': approvalClientRequestId
        },
        body: JSON.stringify(approvalPayload(dryRun))
      }
    );

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      if (response.status === 401 || response.status === 403) founderApiKey = '';
      const blocker = result?.blockers?.[0]?.message;
      const errorMessage = result?.error?.message || blocker || `Gateway returned ${response.status}.`;
      throw new Error(errorMessage);
    }

    return result;
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
    window.alert(
      `Dry Run Passed\n\n${checked} checks passed.\n${result.plannedWrites?.length || 0} repository writes prepared.\nNo files were written.`
    );
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

    window.alert(
      `Blueprint Approved\n\nTransaction: ${result.transactionId}\nPackage: ${result.executionPackage?.id || 'NN-BUILD-001'}\nCommit: ${result.repository?.commitSha || 'verified'}`
    );

    if (typeof window.setWorkspace === 'function') window.setWorkspace('build');
    if (typeof window.NNOSShowExecutionBar === 'function') window.NNOSShowExecutionBar('build');
  }

  async function runApprovalAction(button) {
    if (!blueprint) {
      window.alert('The Blueprint is still loading.');
      return;
    }

    button.disabled = true;

    try {
      if (approvalStage === 'idle') {
        button.textContent = 'Running Dry Run…';
        const result = await requestApproval(true);
        showDryRunPassed(result);
        return;
      }

      if (approvalStage === 'dry-run-passed') {
        const confirmed = window.confirm(
          'Approve the Natural Nation Blueprint for real?\n\nThis will create the approval record, audit event, NN-BUILD-001, Blueprint lock, and workspace update in GitHub. Billing remains excluded from the MVP.'
        );

        if (!confirmed) {
          button.disabled = false;
          button.textContent = 'Approve Blueprint →';
          return;
        }

        button.textContent = 'Committing Approval…';
        const result = await requestApproval(false);
        showApprovalCommitted(result);
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = approvalStage === 'dry-run-passed'
        ? 'Approve Blueprint →'
        : 'Validate Approval →';
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
      if (status) status.textContent = 'Draft blueprint assembled from approved Natural Nation intelligence.';
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
