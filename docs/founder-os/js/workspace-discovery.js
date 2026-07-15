(() => {
  const discoveryPath = './config/natural-nation-discovery.json?v=1.4.0';
  let discovery = null;

  const $ = (selector) => document.querySelector(selector);

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function confidenceClass(value) {
    if (value >= 85) return 'high';
    if (value >= 60) return 'medium';
    return 'low';
  }

  function renderKnown() {
    const container = $('[data-discovery-known]');
    if (!container || !discovery) return;
    container.innerHTML = (discovery.known || []).map((item) => `
      <article class="discovery-card">
        <div class="discovery-card-head">
          <div><div class="eyebrow">${escapeHtml(item.label)}</div><strong>${escapeHtml(item.value)}</strong></div>
          <span class="confidence-badge ${confidenceClass(item.confidence)}">${item.confidence}%</span>
        </div>
        <p>${escapeHtml(item.evidence)}</p>
      </article>
    `).join('');
  }

  function renderReadiness() {
    const container = $('[data-blueprint-readiness]');
    if (!container || !discovery) return;
    container.innerHTML = (discovery.blueprintReadiness || []).map((item) => `
      <div class="readiness-row">
        <div class="readiness-copy"><span>${escapeHtml(item.section)}</span><strong>${item.confidence}%</strong></div>
        <div class="readiness-track"><span class="${confidenceClass(item.confidence)}" style="width:${item.confidence}%"></span></div>
      </div>
    `).join('');
  }

  function renderQuestionsOrDecisions() {
    const container = $('[data-discovery-questions]');
    if (!container || !discovery) return;

    const uncertainties = discovery.uncertainties || [];
    if (uncertainties.length > 0) {
      container.innerHTML = uncertainties.map((item) => `
        <article class="question-card">
          <div class="eyebrow">Needs Founder Confirmation · ${item.confidence}% confidence</div>
          <h3>${escapeHtml(item.question)}</h3>
          <p>${escapeHtml(item.reason)}</p>
        </article>
      `).join('');
      return;
    }

    const decisions = discovery.approvedDecisions || [];
    container.innerHTML = decisions.length
      ? decisions.map((item) => `
          <article class="question-card approved-decision-card">
            <div class="eyebrow">Founder Approved</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p><strong>${escapeHtml(item.resolution)}</strong></p>
            <p class="muted">Transaction ${escapeHtml(item.transactionId)} · Commit ${escapeHtml(item.commitSha.slice(0, 8))}</p>
          </article>
        `).join('')
      : '<p class="muted">No unresolved Founder decisions remain.</p>';

    const heading = container.closest('.glass-panel')?.querySelector('.section-title');
    if (heading) heading.textContent = 'Approved Founder Decisions';
    const eyebrow = container.closest('.glass-panel')?.querySelector('.eyebrow');
    if (eyebrow) eyebrow.textContent = 'Direction Confirmed';
  }

  function renderAction() {
    const button = $('[data-review-blueprint]');
    if (!button || !discovery) return;
    const hasOpenQuestions = (discovery.uncertainties || []).length > 0;
    button.disabled = hasOpenQuestions;
    button.textContent = hasOpenQuestions ? 'Resolve Decisions to Continue' : 'Open Approved Plan →';
    const actionCopy = button.closest('.discovery-actions')?.querySelector('strong');
    if (actionCopy) actionCopy.textContent = hasOpenQuestions
      ? 'Resolve the remaining Founder decisions.'
      : 'Direction is confirmed. Review the approved plan before moving into live Build Work.';
  }

  function renderDiscovery() {
    if (!discovery) return;
    const summary = $('[data-discovery-summary]');
    const confidence = $('[data-discovery-confidence]');
    const status = $('[data-discovery-status]');
    if (summary) summary.textContent = discovery.summary;
    if (confidence) confidence.textContent = `${discovery.overallConfidence}% understood`;
    if (status) status.textContent = (discovery.uncertainties || []).length
      ? 'Founder input is still required before the approved plan can advance.'
      : 'Confirmed Direction is synchronized with the approved plan. No Founder decisions are pending.';
    renderKnown();
    renderReadiness();
    renderQuestionsOrDecisions();
    renderAction();
  }

  async function loadDiscovery() {
    try {
      const response = await fetch(`${discoveryPath}&verify=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Confirmed Direction data returned ${response.status}`);
      discovery = await response.json();
      renderDiscovery();
    } catch (error) {
      const status = $('[data-discovery-status]');
      if (status) status.textContent = 'Confirmed Direction could not be loaded.';
      console.error(error);
    }
  }

  window.NNOSDiscovery = { reload: loadDiscovery };
  window.addEventListener('founder-os:canonical-blueprint-approved', loadDiscovery);
  loadDiscovery();
})();