(() => {
  const BLUEPRINT_URL = window.NNOSPaths.asset('config/natural-nation-blueprint.json');
  let blueprint = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

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

  function approved(value = blueprint) {
    return Boolean(
      value?.status === 'Approved' &&
      value?.locked === true &&
      value?.approvalTransactionId &&
      Array.isArray(value?.openDecisions) &&
      value.openDecisions.length === 0 &&
      value?.snapshot?.openDecisions === 0
    );
  }

  function badgeClass(value = '') {
    const key = value.toLowerCase();
    if (key.includes('required') && !key.includes('decision')) return 'required';
    if (key.includes('recommended')) return 'recommended';
    if (key.includes('later')) return 'later';
    return 'decision';
  }

  function renderList(selector, items = []) {
    const node = $(selector);
    if (node) node.innerHTML = items.map((item) => `<div class="experience-line">${escapeHtml(item)}</div>`).join('');
  }

  function renderSnapshot() {
    const node = $('[data-blueprint-snapshot]');
    if (!node || !blueprint?.snapshot) return;
    const metrics = [
      ['Build Streams', blueprint.snapshot.buildStreams],
      ['Required Components', blueprint.snapshot.requiredComponents],
      ['Recommended', blueprint.snapshot.recommendedComponents],
      ['Open Decisions', blueprint.snapshot.openDecisions],
      ['Deployment Phases', blueprint.snapshot.deploymentPhases]
    ];
    node.innerHTML = metrics.map(([label, value]) => `<article class="snapshot-metric"><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`).join('');
  }

  function renderStreams() {
    const node = $('[data-blueprint-build-streams]');
    if (!node) return;
    node.innerHTML = (blueprint.buildStreams || []).map((item) => `
      <article class="build-stream-card">
        <div class="build-stream-icon" aria-hidden="true">${escapeHtml(item.shortName?.charAt(0) || '')}</div>
        <div><div class="build-stream-head"><strong>${escapeHtml(item.name)}</strong><span class="blueprint-badge ${badgeClass(item.status)}">${escapeHtml(item.status)}</span></div><p>${escapeHtml(item.purpose)}</p></div>
      </article>`).join('');
  }

  function renderPhases() {
    const node = $('[data-blueprint-phases]');
    if (!node) return;
    node.innerHTML = (blueprint.deploymentPhases || []).map((item) => `
      <article class="phase-card ${escapeHtml(item.status.toLowerCase())}">
        <div><span>${escapeHtml(item.phase)} · ${escapeHtml(item.status)}</span><strong>${escapeHtml(item.title)}</strong></div>
        <p>${escapeHtml(item.description)}</p>
      </article>`).join('');
  }

  function renderComponents() {
    const groups = {
      required: (blueprint.components || []).filter((item) => item.classification === 'Required'),
      recommended: (blueprint.components || []).filter((item) => item.classification === 'Recommended'),
      decision: (blueprint.components || []).filter((item) => item.classification.includes('Decision')),
      later: (blueprint.components || []).filter((item) => item.classification === 'Later')
    };
    Object.entries(groups).forEach(([key, items]) => {
      const node = $(`[data-components-${key}]`);
      if (!node) return;
      node.innerHTML = items.map((item) => `
        <article class="component-card">
          <div class="component-card-head"><strong>${escapeHtml(item.name)}</strong><span class="blueprint-badge ${badgeClass(item.classification)}">${escapeHtml(item.classification)}</span></div>
          <p>${escapeHtml(item.supports)}</p><small>${escapeHtml(item.reason)}</small>
        </article>`).join('');
    });
  }

  function renderDecisions() {
    const node = $('[data-blueprint-decisions]');
    if (!node) return;
    if (approved()) {
      node.innerHTML = `<article class="blueprint-decision"><div class="eyebrow">Founder Decision Committed</div><h3>MVP subscription billing</h3><p>Subscription billing is excluded from the first MVP release and recorded in GitHub.</p><small>Transaction: ${escapeHtml(blueprint.approvalTransactionId)}</small></article>`;
      return;
    }
    const resolution = sessionStorage.getItem('nnos_billing_resolution');
    const selected = resolution === 'included-in-mvp' ? 'included in Phase 1' : resolution === 'excluded-from-mvp' ? 'moved to Phase 2' : 'not resolved';
    node.innerHTML = (blueprint.openDecisions || []).map((item) => `<article class="blueprint-decision"><div class="eyebrow">Founder Decision Pending Commit</div><h3>${escapeHtml(item.title)}</h3><p>Selected resolution: ${selected}.</p><small>This decision remains pending until the Gateway commits it to GitHub.</small></article>`).join('') || '<p class="muted">No decision data is available.</p>';
  }

  function render() {
    if (!blueprint) return;
    const isApproved = approved();
    setText('[data-blueprint-version]', blueprint.blueprintVersion);
    setText('[data-blueprint-status]', blueprint.status);
    setText('[data-blueprint-confidence]', `${blueprint.confidence}%`);
    setText('[data-blueprint-summary]', blueprint.summary);
    setText('[data-blueprint-mission]', blueprint.mission);
    setText('[data-blueprint-load-status]', isApproved ? 'Canonical Founder-approved Blueprint loaded from GitHub.' : 'Founder Review Blueprint loaded from GitHub.');
    setText('[data-blueprint-approval-effect]', isApproved ? 'Verified in GitHub. Ready for Build Studio.' : 'Validate before canonical approval.');
    setText('[data-sticky-confidence]', `${blueprint.confidence}% confidence`);
    setText('[data-sticky-decisions]', isApproved ? 'Committed' : 'Pending commit');
    const action = $('[data-approve-blueprint]');
    if (action && isApproved) {
      action.textContent = 'Blueprint Approved ✓';
      action.disabled = true;
    }
    renderList('[data-blueprint-users]', blueprint.users);
    renderList('[data-blueprint-experience]', blueprint.coreUserExperience);
    renderSnapshot();
    renderStreams();
    renderPhases();
    renderComponents();
    renderDecisions();
  }

  async function load() {
    const response = await fetch(`${BLUEPRINT_URL}?render=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Blueprint returned ${response.status}.`);
    blueprint = await response.json();
    render();
    return blueprint;
  }

  document.addEventListener('click', (event) => {
    const review = event.target.closest?.('[data-review-blueprint]');
    if (!review) return;
    event.preventDefault();
    if (typeof window.setWorkspace === 'function') window.setWorkspace('blueprint');
    if (typeof window.NNOSShowExecutionBar === 'function') window.NNOSShowExecutionBar('blueprint');
    $$('[data-context-module]').forEach((button) => button.classList.toggle('active', button.dataset.contextModule === 'blueprint'));
  });

  window.NNOSBlueprintView = { reload: load, get data() { return blueprint; } };
  load().catch((error) => {
    setText('[data-blueprint-load-status]', `Workspace Blueprint could not be loaded: ${error.message}`);
  });
})();
