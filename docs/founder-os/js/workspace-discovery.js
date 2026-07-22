(() => {
  const discoveryPath = './founder-os/config/natural-nation-discovery.json?v=1.4.0';
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
        <div><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.status)}</span></div>
        <div class="readiness-track"><span style="width:${Number(item.percent) || 0}%"></span></div>
      </div>
    `).join('');
  }

  function renderQuestions() {
    const container = $('[data-discovery-questions]');
    if (!container || !discovery) return;
    container.innerHTML = (discovery.questions || []).map((item) => `
      <article class="decision-card">
        <div><div class="eyebrow">${escapeHtml(item.status)}</div><strong>${escapeHtml(item.question)}</strong></div>
        <p>${escapeHtml(item.answer || item.guidance || '')}</p>
      </article>
    `).join('');
  }

  function renderSummary() {
    const summary = $('[data-discovery-summary]');
    const status = $('[data-discovery-status]');
    const confidence = $('[data-discovery-confidence]');
    if (summary) summary.textContent = discovery?.summary || 'Founder OS has loaded the confirmed product direction.';
    if (status) status.textContent = discovery?.statusMessage || 'Review the confirmed information and continue to the approved build plan.';
    if (confidence) confidence.textContent = `${Number(discovery?.confidence) || 0}%`;
  }

  async function loadDiscovery() {
    const response = await fetch(`${discoveryPath}&verify=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Discovery returned ${response.status}`);
    discovery = await response.json();
    renderSummary();
    renderKnown();
    renderReadiness();
    renderQuestions();
  }

  loadDiscovery().catch((error) => {
    console.error(error);
    const status = $('[data-discovery-status]');
    if (status) status.textContent = 'Founder OS could not load the confirmed Natural Nation direction.';
  });
})();