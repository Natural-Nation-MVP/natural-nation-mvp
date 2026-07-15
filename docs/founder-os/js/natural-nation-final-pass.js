(() => {
  const GATEWAY_URL = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  async function fetchJson(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  function roleName(id) {
    return ({ art: 'Art', codex: 'Codex', gemini: 'Gemini', gpose: 'GPose', founder: 'Founder' })[id] || id || 'None';
  }

  async function refineConfirmedDirection() {
    const workspace = window.NNOSActiveWorkspace;
    if (workspace?.id !== 'natural-nation') return;
    const [discovery, blueprint] = await Promise.all([
      fetchJson('./config/natural-nation-discovery.json'),
      fetchJson('./config/natural-nation-blueprint.json')
    ]);

    const known = $('[data-discovery-known]');
    const readiness = $('[data-blueprint-readiness]');
    const decisions = $('[data-discovery-questions]');
    const action = $('[data-review-blueprint]');

    if (known) {
      const map = Object.fromEntries((discovery.known || []).map((item) => [item.label, item.value]));
      known.innerHTML = `
        <article class="module-card"><div class="eyebrow">Mission</div><strong>Help people turn holistic wellness goals into clear daily action.</strong></article>
        <article class="module-card"><div class="eyebrow">Product</div><strong>${esc(map.Products || 'Brand website and mobile-first application')}</strong></article>
        <article class="module-card"><div class="eyebrow">Audience</div><strong>${esc(map.Audience || 'Adults seeking practical holistic wellness support')}</strong></article>
        <article class="module-card"><div class="eyebrow">Core promise</div><strong>${esc(map['Core Experience'] || 'Personalized blueprint, daily protocol, progress, and Duey guidance')}</strong></article>`;
    }

    if (readiness) {
      const included = ['Onboarding and first-session breakthrough', 'Day 1 dashboard', 'Duey wellness mentor', 'Daily protocols', 'Wellness and Rejuvenation Scores', 'Progress tracking', 'Guest-first authentication path'];
      const deferred = ['Subscription billing', 'Wearables and biomarkers', 'Predictive analytics', 'Coaching marketplace', 'Advanced AI automation'];
      readiness.innerHTML = `
        <div class="grid-2">
          <article class="module-card"><div class="eyebrow">Included in MVP</div>${included.map((item) => `<div class="record-row"><span>${esc(item)}</span><strong>Included</strong></div>`).join('')}</article>
          <article class="module-card"><div class="eyebrow">Deferred</div>${deferred.map((item) => `<div class="record-row"><span>${esc(item)}</span><strong>Later</strong></div>`).join('')}</article>
        </div>`;
    }

    if (decisions) {
      const locked = ['Navigation architecture', 'Duey mentor identity', 'Guest First', 'Protocol Library v1', 'Assignment Matrix v1', 'Wellness Score', 'Rejuvenation Score', 'Gateway v1 architecture'];
      decisions.innerHTML = `
        <article class="module-card"><div class="eyebrow">Founder direction</div><div class="record-row"><span>Status</span><strong>Approved</strong></div><div class="record-row"><span>Open decisions</span><strong>${blueprint.openDecisions?.length || 0}</strong></div><div class="record-row"><span>Current build</span><strong>NN-BUILD-001</strong></div></article>
        <div class="modules-grid">${locked.map((item) => `<article class="module-card"><strong>${esc(item)}</strong><span class="status">Locked</span></article>`).join('')}</div>`;
    }

    const summary = $('[data-discovery-summary]');
    if (summary) summary.textContent = 'Natural Nation has an approved product direction, locked MVP rules, and a canonical build package ready for execution.';
    const status = $('[data-discovery-status]');
    if (status) status.textContent = 'No Founder decisions are currently blocking the approved MVP direction.';
    if (action) action.textContent = 'Open Approved Plan →';
  }

  async function refineApprovedPlan() {
    const workspace = window.NNOSActiveWorkspace;
    if (workspace?.id !== 'natural-nation') return;
    const blueprint = await fetchJson('./config/natural-nation-blueprint.json');
    const streams = $('[data-blueprint-build-streams]');
    const phases = $('[data-blueprint-phases]');
    const snapshot = $('[data-blueprint-snapshot]');

    if (snapshot) snapshot.innerHTML = `
      <article class="snapshot-metric"><span>Status</span><strong>${esc(blueprint.status)}</strong></article>
      <article class="snapshot-metric"><span>Confidence</span><strong>${esc(blueprint.confidence)}%</strong></article>
      <article class="snapshot-metric"><span>Open decisions</span><strong>${blueprint.openDecisions?.length || 0}</strong></article>
      <article class="snapshot-metric"><span>Build package</span><strong>NN-BUILD-001</strong></article>`;

    if (streams) streams.innerHTML = (blueprint.buildStreams || []).map((stream) => `
      <article class="build-stream-card"><div><div class="build-stream-head"><strong>${esc(stream.name)}</strong><span class="blueprint-badge required">Approved</span></div><p>${esc(stream.purpose)}</p></div></article>`).join('');

    if (phases) phases.innerHTML = (blueprint.deploymentPhases || []).map((phase) => `
      <article class="phase-card ${esc(String(phase.status || '').toLowerCase())}"><div><span>${esc(phase.phase)}</span><strong>${esc(phase.title)}</strong></div><p>${esc(phase.description)}</p></article>`).join('');
  }

  async function refineCodeStatus() {
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace) return;
    const status = $('[data-repo-status]');
    const checklist = $('[data-repo-checklist]');
    if (!status || !checklist) return;
    try {
      const [health, configuration, providers] = await Promise.all([
        fetchJson(`${GATEWAY_URL}/health`),
        fetchJson(`${GATEWAY_URL}/configuration`),
        fetchJson(`${GATEWAY_URL}/v1/ai/providers`)
      ]);
      const connected = Object.entries(providers.providers || {}).filter(([name, ready]) => ['openai', 'google'].includes(name) && ready).length;
      status.innerHTML = `
        <article class="module-card"><strong>Repository</strong><span class="status">Connected</span><p>GitHub main is the production source.</p></article>
        <article class="module-card"><strong>Gateway</strong><span class="status">Online</span><p>v${esc(health.version || '0.5.3')}</p></article>
        <article class="module-card"><strong>AI providers</strong><span class="status">${connected} connected</span><p>OpenAI and Google readiness is checked live.</p></article>
        <article class="module-card"><strong>Configuration</strong><span class="status">${configuration.configured ? 'Ready' : 'Needs attention'}</span><p>Direct-provider deployment readiness.</p></article>`;
      checklist.innerHTML = '<div class="ux-checklist"><p><strong>Customer release still requires:</strong> member authentication, saved data, full user journeys, accessibility, responsive QA, and production application deployment.</p></div>';
    } catch (error) {
      status.innerHTML = `<article class="module-card"><strong>Live technical status unavailable</strong><p>${esc(error.message)}</p></article>`;
    }
  }

  function refineAiTeam() {
    const workspace = window.NNOSActiveWorkspace;
    if (workspace?.id !== 'natural-nation') return;
    window.setTimeout(() => {
      const roles = $('[data-ai-roles]');
      if (!roles) return;
      roles.querySelectorAll('.module-card').forEach((card) => {
        if (card.querySelector('[data-role-identity-note]')) return;
        const note = document.createElement('p');
        note.className = 'muted';
        note.dataset.roleIdentityNote = '';
        note.textContent = 'Role identity is permanent. The execution provider may change per request.';
        card.appendChild(note);
      });
      const handoffs = $('[data-ai-handoffs]');
      if (handoffs && !handoffs.querySelector('[data-routing-note]')) {
        handoffs.insertAdjacentHTML('afterbegin', '<article class="module-card" data-routing-note><strong>Routing standard</strong><p>Preferred provider first. Approved failures may use a fallback provider that temporarily assumes the same role for one request, then releases it.</p></article>');
      }
    }, 850);
  }

  function refineProductRecords() {
    const workspace = window.NNOSActiveWorkspace;
    if (workspace?.id !== 'natural-nation') return;
    const count = $('[data-knowledge-count]');
    if (count) count.textContent = 'Natural Nation Records';
    const search = $('[data-knowledge-search]');
    if (search) search.placeholder = 'Search Natural Nation decisions, plans, Duey, protocols, design, releases...';
  }

  function apply(workspace, target) {
    if (workspace?.id !== 'natural-nation') return;
    if (target === 'discovery') refineConfirmedDirection().catch(console.error);
    if (target === 'blueprint') refineApprovedPlan().catch(console.error);
    if (target === 'repo') refineCodeStatus().catch(console.error);
    if (target === 'ai') refineAiTeam();
    if (target === 'knowledge') refineProductRecords();
  }

  window.addEventListener('founder-os:workspace-view-changed', (event) => apply(event.detail?.workspace, event.detail?.target));
  if (window.NNOSActiveWorkspace) apply(window.NNOSActiveWorkspace, document.body.dataset.activeView);
})();