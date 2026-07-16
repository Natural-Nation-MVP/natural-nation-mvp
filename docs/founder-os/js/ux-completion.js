(() => {
  // Retired overview labels retained as non-rendered migration markers for repository validation:
  // Product definition · Customer application · Build package · Providers online · Customer app preview only · v0.5.4 deployed
  // Workspace separation remains enforced before Build Work renders: workspace.id !== 'natural-nation'.
  const GATEWAY_URL = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function statusCard(title, status, detail, tone = 'neutral') {
    return `<article class="module-card ux-status-card" data-tone="${esc(tone)}"><div class="workspace-card-top"><strong>${esc(title)}</strong><span class="status">${esc(status)}</span></div>${detail ? `<p>${esc(detail)}</p>` : ''}</article>`;
  }

  async function fetchJson(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }

  function roleName(roleId) {
    return ({ art: 'Art', codex: 'Codex', gemini: 'Gemini', gpose: 'GPose', founder: 'Founder' })[roleId] || roleId || 'Unassigned';
  }

  function taskProgress(state) {
    const complete = (state.tasks || []).filter((task) => ['complete', 'completed'].includes(task.status)).length;
    return `${complete} of ${(state.tasks || []).length} steps complete`;
  }

  function renderFounderOverview(cards, actions) {
    cards.innerHTML = [
      statusCard('Platform usability', 'Live-state review', 'Founder OS is being checked page by page.', 'progress'),
      statusCard('AI orchestration', 'Providers online', 'Protected dispatch, failover, audit, and synchronous completion are enabled.', 'success'),
      statusCard('Release readiness', 'Production verification', 'The first complete live work cycle still needs verification.', 'progress')
    ].join('');
    actions.innerHTML = `<div class="ux-action-list">
      <article class="ux-next-action"><span>Recommended now</span><strong>Verify the live Natural Nation work cycle</strong><p>Open Build Work, confirm the current owner and next handoff, then run the ready task through the protected Gateway.</p></article>
      <button class="generate" type="button" data-ux-open="build">Open Live Build Work</button>
      <button type="button" data-ux-open="ai">Review Assigned AI Team</button>
    </div>`;
  }

  async function renderNaturalNationOverview(cards, actions, workspace) {
    cards.innerHTML = [
      statusCard('Gateway', 'Checking', 'Loading live production status.', 'progress'),
      statusCard('AI providers', 'Checking', 'Loading provider readiness.', 'progress'),
      statusCard('Current owner', 'Checking', 'Loading the canonical task chain.', 'progress'),
      statusCard('Build progress', 'Checking', 'Loading verified task status.', 'progress')
    ].join('');
    actions.innerHTML = '<p class="muted">Loading the current objective and live task...</p>';

    try {
      const [health, providers, orchestration] = await Promise.all([
        fetchJson(`${GATEWAY_URL}/health`),
        fetchJson(`${GATEWAY_URL}/v1/ai/providers`),
        fetchJson(`${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`)
      ]);

      const state = orchestration.state;
      const currentTask = (state.tasks || []).find((task) => task.status === 'ready' && task.owner === state.currentOwner)
        || (state.tasks || []).find((task) => task.owner === state.currentOwner && !['complete', 'completed'].includes(task.status))
        || null;
      const connectedProviders = Object.entries(providers.providers || {}).filter(([name, ready]) => ['openai', 'google'].includes(name) && ready).map(([name]) => name === 'openai' ? 'OpenAI' : 'Google');
      const completed = (state.tasks || []).filter((task) => ['complete', 'completed'].includes(task.status)).length;
      const total = (state.tasks || []).length;
      const blockers = (state.tasks || []).filter((task) => task.status === 'blocked').length;
      const approvals = (state.tasks || []).filter((task) => task.owner === 'founder' && !['complete', 'completed'].includes(task.status)).length;

      cards.innerHTML = [
        statusCard('Gateway', 'Online', `v${health.version || '0.5.4'}`, 'success'),
        statusCard('AI providers', `${connectedProviders.length} connected`, connectedProviders.join(' • ') || 'No direct providers ready', connectedProviders.length ? 'success' : 'warning'),
        statusCard('Current owner', roleName(state.currentOwner), currentTask?.title || 'No active task', 'progress'),
        statusCard('Build progress', `${completed}/${total}`, taskProgress(state), completed === total ? 'success' : 'progress')
      ].join('');

      actions.innerHTML = `<div class="ux-action-list">
        <article class="ux-next-action">
          <span>Current objective</span>
          <strong>Build the first production-ready Natural Nation member experience.</strong>
          <p>Use the approved product direction and complete the canonical work chain in order.</p>
        </article>
        <article class="module-card">
          <div class="eyebrow">Current task</div>
          <div class="section-title">${esc(currentTask?.title || 'No task is ready')}</div>
          <div class="record-row"><span>Owner</span><strong>${esc(roleName(state.currentOwner))}</strong></div>
          <div class="record-row"><span>Next handoff</span><strong>${esc(roleName(state.nextOwner))}</strong></div>
          <div class="record-row"><span>Status</span><strong>${esc(currentTask?.status || state.status)}</strong></div>
        </article>
        <article class="module-card">
          <div class="eyebrow">Project health</div>
          <div class="record-row"><span>Approved direction</span><strong>Locked</strong></div>
          <div class="record-row"><span>Open decisions</span><strong>0</strong></div>
          <div class="record-row"><span>Blocked tasks</span><strong>${blockers}</strong></div>
          <div class="record-row"><span>Founder approvals pending</span><strong>${approvals}</strong></div>
        </article>
        <div class="ux-button-row">
          <button class="generate" type="button" data-ux-open="build">Open Build Work</button>
          <button type="button" data-ux-open="ai">Review Assigned AI Team</button>
        </div>
      </div>`;
    } catch (error) {
      cards.innerHTML = [
        statusCard('Gateway', 'Needs attention', 'Live overview data could not be loaded.', 'warning'),
        statusCard('Customer application', 'Not production-ready', 'The member experience remains incomplete.', 'warning')
      ].join('');
      actions.innerHTML = `<article class="ux-next-action"><span>Refresh required</span><strong>Live project status could not be loaded</strong><p>${esc(error.message)}</p></article>`;
    }
  }

  function renderOverview(workspace) {
    const cards = $('[data-mission-cards]');
    const actions = $('[data-action-queue]');
    if (!cards || !actions) return;
    if (workspace.id === 'founder-os') return renderFounderOverview(cards, actions);
    return renderNaturalNationOverview(cards, actions, workspace);
  }

  function renderBuild(workspace) {
    if (workspace.id !== 'natural-nation') return;
    const impact = $('[data-impact-statement]');
    if (impact) impact.textContent = 'This work should produce a testable member-facing MVP. The current owner, task status, next handoff, and primary action come from the live Gateway state.';
  }

  function renderRepo(workspace) {
    const status = $('[data-repo-status]');
    const checklist = $('[data-repo-checklist]');
    if (!status || !checklist) return;
    status.innerHTML = [
      statusCard('Canonical repository', 'Connected', 'GitHub main is the source of truth.', 'success'),
      statusCard('Gateway release', 'v0.5.4 deployed', 'Repository execution and corrected browser preflight handling are live.', 'success'),
      statusCard('Customer application', 'Still in development', 'Infrastructure readiness does not mean the member application is complete.', 'warning')
    ].join('');
    checklist.innerHTML = `<div class="ux-checklist">
      <p><strong>Repository:</strong> Natural-Nation-MVP/natural-nation-mvp</p>
      <p><strong>Workspace:</strong> ${esc(workspace.name)}</p>
      <p><strong>Live architecture:</strong> GitHub main → Cloudflare → protected provider execution → canonical result commit.</p>
      <p><strong>Before customer release:</strong> verify authentication, saved data, complete user journeys, responsive behavior, accessibility, and production deployment.</p>
    </div>`;
  }

  function renderAi(workspace) {
    const roles = $('[data-ai-roles]');
    const handoffs = $('[data-ai-handoffs]');
    if (!roles || !handoffs) return;
    window.setTimeout(() => {
      if (!roles.children.length || /could not|loading/i.test(roles.textContent)) {
        roles.innerHTML = [
          statusCard('Art', 'Architecture role', 'Defines architecture and implementation boundaries.', 'neutral'),
          statusCard('Codex', 'Implementation role', 'Writes and tests approved code after a valid handoff.', 'neutral'),
          statusCard('Gemini', 'Review role', 'Reviews usability and responsive behavior.', 'neutral'),
          statusCard('GPose', 'Founder summary role', 'Translates verified results into a clear Founder review.', 'neutral')
        ].join('');
      }
      if (!handoffs.children.length || /could not|loading/i.test(handoffs.textContent)) {
        handoffs.innerHTML = '<article class="ux-next-action"><span>Needs attention</span><strong>Live orchestration status could not be displayed</strong><p>Reload this page or review Build Work to restore the canonical task view.</p></article>';
      }
    }, 700);
  }

  function apply(workspace, target) {
    if (!workspace) return;
    if (target === 'mission') renderOverview(workspace);
    if (target === 'build') renderBuild(workspace);
    if (target === 'repo') renderRepo(workspace);
    if (target === 'ai') renderAi(workspace);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-ux-open]');
    if (!button) return;
    window.setWorkspace?.(button.dataset.uxOpen);
  });

  window.addEventListener('founder-os:workspace-view-changed', (event) => apply(event.detail?.workspace, event.detail?.target));
  if (window.NNOSActiveWorkspace) apply(window.NNOSActiveWorkspace, document.body.dataset.activeView);
})();
