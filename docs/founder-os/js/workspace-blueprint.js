(() => {
  const blueprintPath = './config/natural-nation-blueprint.json?v=0.2.0';
  let blueprint = null;

  const $ = (selector) => document.querySelector(selector);

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
        <div class="eyebrow">Founder Decision Required</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.question)}</p>
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
    setText('[data-blueprint-approval-effect]', blueprint.approvalEffect);
    setText('[data-sticky-confidence]', `${blueprint.confidence}% confidence`);
    setText('[data-sticky-decisions]', `${blueprint.snapshot.openDecisions} pending`);

    renderList('[data-blueprint-users]', blueprint.users);
    renderList('[data-blueprint-experience]', blueprint.coreUserExperience);
    renderSnapshot();
    renderBuildStreams();
    renderDeploymentPhases();
    renderComponents();
    renderOpenDecisions();
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
      const status = $('[data-blueprint-action-status]');
      if (status) status.textContent = 'Resolve the MVP billing decision before final Blueprint approval can be recorded.';
      approve.textContent = 'Billing Decision Required';
    }
  });

  loadBlueprint();
})();
