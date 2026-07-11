(() => {
  const blueprintPath = './config/natural-nation-blueprint.json?v=0.1.0';
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
    container.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function renderProducts() {
    const container = $('[data-blueprint-products]');
    if (!container || !blueprint) return;
    container.innerHTML = blueprint.products.map((item) => `
      <article class="blueprint-card">
        <div class="blueprint-card-head">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="blueprint-badge ${badgeClass(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <p>${escapeHtml(item.purpose)}</p>
      </article>
    `).join('');
  }

  function renderCapabilities() {
    const container = $('[data-blueprint-capabilities]');
    if (!container || !blueprint) return;
    container.innerHTML = blueprint.capabilities.map((item) => `
      <article class="blueprint-row">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.reason)}</p>
        </div>
        <span class="blueprint-badge ${badgeClass(item.classification)}">${escapeHtml(item.classification)}</span>
      </article>
    `).join('');
  }

  function renderApplications() {
    const container = $('[data-blueprint-applications]');
    if (!container || !blueprint) return;
    container.innerHTML = blueprint.applications.map((item) => `
      <article class="blueprint-app">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>Supports: ${escapeHtml(item.supports)}</p>
        </div>
        <span class="blueprint-badge ${badgeClass(item.classification)}">${escapeHtml(item.classification)}</span>
      </article>
    `).join('');
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

    $('[data-blueprint-version]').textContent = blueprint.blueprintVersion;
    $('[data-blueprint-status]').textContent = blueprint.status;
    $('[data-blueprint-confidence]').textContent = `${blueprint.confidence}%`;
    $('[data-blueprint-summary]').textContent = blueprint.summary;
    $('[data-blueprint-problem]').textContent = blueprint.problem;
    $('[data-blueprint-approval-effect]').textContent = blueprint.approvalEffect;

    renderList('[data-blueprint-users]', blueprint.users);
    renderList('[data-blueprint-journeys]', blueprint.coreJourneys);
    renderList('[data-blueprint-included]', blueprint.mvpBoundaries.included);
    renderList('[data-blueprint-later]', blueprint.mvpBoundaries.excludedOrLater);
    renderProducts();
    renderCapabilities();
    renderApplications();
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
      document.querySelectorAll('[data-context-module]').forEach((button) => {
        button.classList.toggle('active', button.dataset.contextModule === 'blueprint');
      });
      return;
    }

    const approve = event.target.closest('[data-approve-blueprint]');
    if (approve) {
      event.preventDefault();
      const status = $('[data-blueprint-action-status]');
      if (status) status.textContent = 'Approval is not yet recorded. Resolve the MVP billing decision before final blueprint approval.';
    }
  });

  loadBlueprint();
})();
