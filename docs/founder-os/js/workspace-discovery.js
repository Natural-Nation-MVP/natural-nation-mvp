(() => {
  const discoveryPath = './config/natural-nation-discovery.json?v=1.0.0';
  let discovery = null;

  const $ = (selector) => document.querySelector(selector);

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
            <div class="eyebrow">${item.label}</div>
            <strong>${item.value}</strong>
          </div>
          <span class="confidence-badge ${confidenceClass(item.confidence)}">${item.confidence}%</span>
        </div>
        <p>${item.evidence}</p>
      </article>
    `).join('');
  }

  function renderQuestions() {
    const container = $('[data-discovery-questions]');
    if (!container || !discovery) return;

    container.innerHTML = discovery.uncertainties.map((item) => `
      <article class="question-card" data-question-id="${item.id}">
        <div class="eyebrow">Needs Founder Confirmation · ${item.confidence}% confidence</div>
        <h3>${item.question}</h3>
        <p>${item.reason}</p>
        <div class="question-options">
          ${item.options.map((option) => `<button type="button" data-discovery-answer="${option}">${option}</button>`).join('')}
        </div>
      </article>
    `).join('');
  }

  function renderReadiness() {
    const container = $('[data-blueprint-readiness]');
    if (!container || !discovery) return;

    container.innerHTML = discovery.blueprintReadiness.map((item) => `
      <div class="readiness-row">
        <div class="readiness-copy"><span>${item.section}</span><strong>${item.confidence}%</strong></div>
        <div class="readiness-track"><span class="${confidenceClass(item.confidence)}" style="width:${item.confidence}%"></span></div>
      </div>
    `).join('');
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
  }

  async function loadDiscovery() {
    try {
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

    const generate = event.target.closest('[data-generate-blueprint]');
    if (generate) {
      event.preventDefault();
      const status = $('[data-discovery-status]');
      if (status) status.textContent = 'Draft blueprint preparation is the next implementation step. No repository changes were made.';
    }
  });

  loadDiscovery();
})();
