(() => {
  const discoveryPath = './config/natural-nation-discovery.json?v=1.2.0';
  let discovery = null;

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

  function ensureExplainDrawer() {
    if ($('[data-explain-drawer]')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div class="explain-backdrop" data-explain-backdrop hidden></div>
      <aside class="explain-drawer" data-explain-drawer hidden aria-label="Explain recommendation" aria-modal="true" role="dialog">
        <div class="explain-drawer-header">
          <div>
            <div class="eyebrow">Explain Recommendation</div>
            <h2 data-explain-title>Recommendation</h2>
          </div>
          <button class="explain-close" type="button" data-close-explain aria-label="Close Explain drawer">×</button>
        </div>
        <div class="explain-tabs" role="tablist" aria-label="Recommendation details">
          <button class="active" type="button" data-explain-tab="explain">Explain</button>
          <button type="button" data-explain-tab="sources">Sources</button>
          <button type="button" data-explain-tab="history">History</button>
        </div>
        <section data-explain-panel="explain">
          <div class="eyebrow">Road to this decision</div>
          <p data-explain-reasoning></p>
          <div class="discussion-summary">
            <span>Discussion summary</span>
            <p data-discussion-summary></p>
          </div>
          <div class="explain-summary-grid">
            <div class="explain-summary-card"><span>Confidence</span><strong data-explain-confidence></strong></div>
            <div class="explain-summary-card"><span>Estimated effort</span><strong data-explain-effort></strong></div>
          </div>
          <div class="explain-summary-card" style="margin-top:10px"><span>Project impact</span><strong data-explain-impact></strong></div>
        </section>
        <section data-explain-panel="sources" hidden>
          <div class="eyebrow">Canonical Sources Used</div>
          <div data-explain-sources></div>
          <article class="document-reader" data-document-reader hidden>
            <div class="document-reader-head">
              <div>
                <span data-document-authority></span>
                <h3 data-document-title></h3>
              </div>
              <button type="button" data-close-document>Back to sources</button>
            </div>
            <p class="document-purpose" data-document-purpose></p>
            <div class="document-text" data-document-text></div>
          </article>
        </section>
        <section data-explain-panel="history" hidden>
          <div class="eyebrow">Recommendation History</div>
          <div data-explain-history></div>
        </section>
      </aside>
    `);
  }

  function confidenceClass(value) {
    if (value >= 85) return 'high';
    if (value >= 60) return 'medium';
    return 'low';
  }

  function renderKnown() {
    const container = $('[data-discovery-known]');
    if (!container || !discovery) return;

    container.innerHTML = discovery.known.map((item) => `
      <article class="discovery-card">
        <div class="discovery-card-head">
          <div>
            <div class="eyebrow">${escapeHtml(item.label)}</div>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
          <span class="confidence-badge ${confidenceClass(item.confidence)}">${item.confidence}%</span>
        </div>
        <p>${escapeHtml(item.evidence)}</p>
      </article>
    `).join('');
  }

  function renderQuestions() {
    const container = $('[data-discovery-questions]');
    if (!container || !discovery) return;

    container.innerHTML = discovery.uncertainties.map((item) => `
      <article class="question-card" data-question-id="${escapeHtml(item.id)}">
        <div class="eyebrow">Needs Founder Confirmation · ${item.confidence}% confidence</div>
        <h3>${escapeHtml(item.question)}</h3>
        <p>${escapeHtml(item.reason)}</p>
        <div class="question-actions">
          <div class="question-options">
            ${item.options.map((option) => `<button type="button" data-discovery-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}
          </div>
          <button class="explain-link" type="button" data-open-explain>Explain</button>
        </div>
      </article>
    `).join('');
  }

  function renderReadiness() {
    const container = $('[data-blueprint-readiness]');
    if (!container || !discovery) return;

    container.innerHTML = discovery.blueprintReadiness.map((item) => `
      <div class="readiness-row">
        <div class="readiness-copy"><span>${escapeHtml(item.section)}</span><strong>${item.confidence}%</strong></div>
        <div class="readiness-track"><span class="${confidenceClass(item.confidence)}" style="width:${item.confidence}%"></span></div>
      </div>
    `).join('');
  }

  function closeDocumentReader() {
    const reader = $('[data-document-reader]');
    const sources = $('[data-explain-sources]');
    if (reader) reader.hidden = true;
    if (sources) sources.hidden = false;
  }

  function openDocumentReader(sourceId) {
    const source = discovery?.recommendation?.sources?.find((item) => item.id === sourceId);
    if (!source) return;

    const reader = $('[data-document-reader]');
    const sources = $('[data-explain-sources]');
    if (!reader || !sources) return;

    $('[data-document-title]').textContent = source.title;
    $('[data-document-authority]').textContent = source.authority;
    $('[data-document-purpose]').textContent = `Used for: ${source.usedFor}`;
    $('[data-document-text]').textContent = source.documentText;

    sources.hidden = true;
    reader.hidden = false;
    reader.scrollIntoView({ block: 'start' });
  }

  function renderExplainDrawer() {
    const recommendation = discovery?.recommendation;
    if (!recommendation) return;

    ensureExplainDrawer();

    $('[data-explain-title]').textContent = recommendation.title;
    $('[data-explain-reasoning]').textContent = recommendation.reasoning;
    $('[data-discussion-summary]').textContent = recommendation.discussionSummary;
    $('[data-explain-confidence]').textContent = `${recommendation.confidence}%`;
    $('[data-explain-impact]').textContent = recommendation.impact;
    $('[data-explain-effort]').textContent = recommendation.effort;

    const sources = $('[data-explain-sources]');
    if (sources) {
      sources.hidden = false;
      sources.innerHTML = recommendation.sources.map((source) => `
        <article class="source-card">
          <div class="source-card-head">
            <div>
              <strong>${escapeHtml(source.title)}</strong>
              <span>${escapeHtml(source.authority)}</span>
            </div>
            <button type="button" data-view-source="${escapeHtml(source.id)}">Open document</button>
          </div>
          <p><strong>Used for:</strong> ${escapeHtml(source.usedFor)}</p>
        </article>
      `).join('');
    }

    closeDocumentReader();

    const history = $('[data-explain-history]');
    if (history) {
      history.innerHTML = recommendation.history.map((item) => `
        <article class="history-item ${item.status === 'Current' ? 'current' : ''}">
          <span>${escapeHtml(item.status)}</span>
          <strong>${escapeHtml(item.state)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </article>
      `).join('');
    }
  }

  function showExplainTab(tabName) {
    $$('[data-explain-tab]').forEach((button) => {
      button.classList.toggle('active', button.dataset.explainTab === tabName);
    });
    $$('[data-explain-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.explainPanel !== tabName;
    });
    if (tabName === 'sources') closeDocumentReader();
  }

  function openExplainDrawer() {
    const drawer = $('[data-explain-drawer]');
    const backdrop = $('[data-explain-backdrop]');
    if (!drawer || !backdrop) return;

    renderExplainDrawer();
    showExplainTab('explain');
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add('open');
      backdrop.classList.add('open');
    });
    document.body.classList.add('drawer-open');
    $('[data-close-explain]')?.focus();
  }

  function closeExplainDrawer() {
    const drawer = $('[data-explain-drawer]');
    const backdrop = $('[data-explain-backdrop]');
    if (!drawer || !backdrop) return;

    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('drawer-open');
    window.setTimeout(() => {
      drawer.hidden = true;
      backdrop.hidden = true;
    }, 220);
  }

  function renderDiscovery() {
    const summary = $('[data-discovery-summary]');
    const confidence = $('[data-discovery-confidence]');
    const status = $('[data-discovery-status]');

    if (summary) summary.textContent = discovery.summary;
    if (confidence) confidence.textContent = `${discovery.overallConfidence}% understood`;
    if (status) status.textContent = 'Approved knowledge loaded. One Founder decision remains before blueprint generation.';

    renderKnown();
    renderQuestions();
    renderReadiness();
    renderExplainDrawer();
  }

  async function loadDiscovery() {
    try {
      ensureExplainDrawer();
      const response = await fetch(discoveryPath, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Discovery data returned ${response.status}`);
      discovery = await response.json();
      renderDiscovery();
    } catch (error) {
      const status = $('[data-discovery-status]');
      if (status) status.textContent = 'Workspace Discovery could not be loaded.';
      console.error(error);
    }
  }

  document.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-discovery-answer]');
    if (answer) {
      event.preventDefault();
      answer.closest('.question-options')?.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
      answer.classList.add('active');
      const status = $('[data-discovery-status]');
      if (status) status.textContent = `Founder answer selected: ${answer.dataset.discoveryAnswer}. Blueprint can now be prepared for review.`;
      return;
    }

    if (event.target.closest('[data-open-explain]')) {
      event.preventDefault();
      openExplainDrawer();
      return;
    }

    const sourceButton = event.target.closest('[data-view-source]');
    if (sourceButton) {
      event.preventDefault();
      openDocumentReader(sourceButton.dataset.viewSource);
      return;
    }

    if (event.target.closest('[data-close-document]')) {
      event.preventDefault();
      closeDocumentReader();
      return;
    }

    if (event.target.closest('[data-close-explain]') || event.target.closest('[data-explain-backdrop]')) {
      event.preventDefault();
      closeExplainDrawer();
      return;
    }

    const tab = event.target.closest('[data-explain-tab]');
    if (tab) {
      event.preventDefault();
      showExplainTab(tab.dataset.explainTab);
      return;
    }

    const generate = event.target.closest('[data-generate-blueprint]');
    if (generate) {
      event.preventDefault();
      const status = $('[data-discovery-status]');
      if (status) status.textContent = 'Draft blueprint preparation is the next implementation step. No repository changes were made.';
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('[data-explain-drawer]')?.classList.contains('open')) closeExplainDrawer();
  });

  loadDiscovery();
})();
