(() => {
  const paths = window.NNOSPaths;
  const GATEWAY_URL = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const registryUrl = paths.asset('config/workspace-registry.json');
  let registry = null;
  let orchestration = null;
  let health = null;
  let activeFilter = null;
  let loading = false;

  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function loadStyles() {
    if (document.querySelector('[data-founder-action-center-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = paths.asset('css/founder-action-center.css?v=section-2');
    link.dataset.founderActionCenterStyles = 'true';
    document.head.appendChild(link);
  }

  async function fetchJson(url) {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}v=${Date.now()}`, { cache: 'no-store' });
    const text = await response.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }
    if (!response.ok) throw new Error(body?.error?.message || `${url} returned ${response.status}`);
    return body;
  }

  function naturalNationWorkspace() {
    return registry?.workspaces?.find((workspace) => workspace.id === 'natural-nation') || null;
  }

  async function loadLiveState() {
    if (loading) return;
    loading = true;
    try {
      registry = await fetchJson(registryUrl);
      const workspace = naturalNationWorkspace();
      const requests = [fetchJson(`${GATEWAY_URL}/health`).catch(() => null)];
      if (workspace?.activePackageId) {
        requests.push(fetchJson(`${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`).catch(() => null));
      }
      const [healthBody, orchestrationBody] = await Promise.all(requests);
      health = healthBody;
      orchestration = orchestrationBody?.state || null;
    } finally {
      loading = false;
    }
  }

  function tasks() {
    return Array.isArray(orchestration?.tasks) ? orchestration.tasks : [];
  }

  function approvals() {
    return tasks().filter((task) => task.owner === 'founder' && !['complete', 'completed', 'founder-approved', 'rejected'].includes(task.status));
  }

  function blockers() {
    return tasks().filter((task) => task.status === 'blocked' || task.providerStatus === 'verification-failed');
  }

  function metricDefinitions() {
    return [
      { id: 'active', label: 'Active areas', value: registry?.workspaces?.filter((workspace) => workspace.status === 'active').length ?? 0, description: 'Open a workspace and continue its real work.' },
      { id: 'approvals', label: 'Needs approval', value: approvals().length, description: 'Review live workflow decisions that require Founder approval.' },
      { id: 'blocked', label: 'Blocked work', value: blockers().length, description: 'Open blocked work and use the protected recovery action.' },
      { id: 'gateway', label: 'Gateway', value: health ? 'Online' : 'Check', description: 'Open the live repository and deployment status.' }
    ];
  }

  function teamSummary() {
    const values = tasks();
    const count = (statuses) => values.filter((task) => statuses.includes(String(task.status || task.providerStatus || '').toLowerCase())).length;
    return {
      ready: count(['ready', 'queued']),
      working: count(['running', 'in-progress', 'dispatched']),
      blocked: blockers().length,
      review: approvals().length
    };
  }

  function recentActivity() {
    const taskRecords = tasks().map((task) => ({
      at: task.updatedAt || orchestration?.updatedAt || '',
      title: task.title || task.id || 'AI team task',
      detail: `${task.owner || 'AI team'} · ${task.providerStatus || task.status || 'updated'}`
    }));
    const workspaceRecords = (registry?.workspaces || []).map((workspace) => ({
      at: workspace.updatedAt || workspace.createdAt || '',
      title: workspace.name || workspace.id,
      detail: `Workspace · ${workspace.status || workspace.stage || 'available'}`
    }));
    return [...taskRecords, ...workspaceRecords]
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, 6);
  }

  function ensureDashboard() {
    const metrics = $('[data-system-metrics]');
    if (!metrics) return null;
    let dashboard = $('[data-founder-command-center]');
    if (dashboard) return dashboard;
    dashboard = document.createElement('section');
    dashboard.className = 'founder-command-center';
    dashboard.dataset.founderCommandCenter = '';
    metrics.insertAdjacentElement('afterend', dashboard);
    return dashboard;
  }

  function renderDashboard() {
    const dashboard = ensureDashboard();
    if (!dashboard || !registry) return;
    const team = teamSummary();
    const workspaces = registry?.workspaces || [];
    const activeWorkspaces = workspaces.filter((workspace) => workspace.status === 'active').length;
    const activity = recentActivity();
    dashboard.innerHTML = `
      <article class="glass-panel command-center-section" data-command-center-section="workspace">
        <div class="command-center-heading"><div><div class="eyebrow">Workspace Manager</div><h2>Portfolio</h2></div><span class="pill">${activeWorkspaces} active · ${workspaces.length} total</span></div>
        <p class="muted">Open a workspace card below to continue its approved work or manage its lifecycle.</p>
      </article>
      <article class="glass-panel command-center-section" data-command-center-section="ai">
        <div class="command-center-heading"><div><div class="eyebrow">AI Team Monitor</div><h2>Current workload</h2></div>${actionButton('Open AI Team', 'workspace:natural-nation:ai')}</div>
        <div class="command-center-stat-grid">
          <div><strong>${team.ready}</strong><span>Ready</span></div>
          <div><strong>${team.working}</strong><span>Working</span></div>
          <div><strong>${team.blocked}</strong><span>Blocked</span></div>
          <div><strong>${team.review}</strong><span>Founder review</span></div>
        </div>
      </article>
      <article class="glass-panel command-center-section" data-command-center-section="gateway">
        <div class="command-center-heading"><div><div class="eyebrow">Gateway Status</div><h2>${health ? 'Online' : 'Needs attention'}</h2></div>${actionButton('Open Code Status', 'workspace:founder-os:repo')}</div>
        <p class="muted">${health ? `Gateway ${escapeHtml(health.version || 'current')} responded successfully.` : 'Live status is unavailable. Open Code Status for recovery information.'}</p>
      </article>
      <article class="glass-panel command-center-section" data-command-center-section="activity">
        <div class="command-center-heading"><div><div class="eyebrow">Activity Feed</div><h2>Recent work</h2></div><button type="button" data-action-center-refresh>Refresh</button></div>
        <div class="command-center-activity">${activity.length ? activity.map((item) => `<div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>`).join('') : '<p class="muted">No recent activity is available yet.</p>'}</div>
      </article>
      <article class="glass-panel command-center-section command-center-quick-actions" data-command-center-section="quick-actions">
        <div><div class="eyebrow">Quick Actions</div><h2>Start here</h2></div>
        <div class="command-center-action-grid">
          ${actionButton('Create Workspace', 'create', 'primary')}
          ${actionButton('Approval Inbox', 'inbox')}
          ${actionButton('Build Studio', 'workspace:natural-nation:build')}
          ${actionButton('AI Team', 'workspace:natural-nation:ai')}
          ${actionButton('Gateway Status', 'workspace:founder-os:repo')}
        </div>
      </article>`;
  }

  function ensurePanel() {
    const metrics = $('[data-system-metrics]');
    if (!metrics) return null;
    let panel = $('[data-founder-action-center]');
    if (panel) return panel;
    panel = document.createElement('section');
    panel.className = 'glass-panel founder-action-center';
    panel.dataset.founderActionCenter = '';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="founder-action-center-header"><div><div class="eyebrow">Founder Action Center</div><h2 data-action-center-title tabindex="-1">Actions</h2><p class="muted" data-action-center-description></p></div><button type="button" class="action-center-close" data-action-center-close aria-label="Close Founder Action Center">Close</button></div>
      <div class="action-center-list" data-action-center-list aria-live="polite"></div>
      <div class="action-center-footer"><button type="button" data-action-center-refresh>Refresh live status</button></div>`;
    metrics.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function renderMetrics() {
    const container = $('[data-system-metrics]');
    if (!container || !registry) return;
    container.innerHTML = metricDefinitions().map((metric) => `
      <button class="metric metric-action" type="button" data-action-center-filter="${metric.id}" aria-expanded="${activeFilter === metric.id}"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong><small>Open actions →</small></button>`).join('');
    renderDashboard();
  }

  async function openWorkspace(workspaceId, target) {
    const manager = window.NNOSNavigationManager;
    if (!manager?.openWorkspace) throw new Error('Founder OS navigation is unavailable.');
    const opened = await manager.openWorkspace(workspaceId, 'founder-action-center');
    if (!opened) throw new Error('The selected workspace could not be opened.');
    if (target && target !== 'mission') manager.openView(target, 'founder-action-center');
    closePanel();
  }

  function actionButton(label, action, tone = '') {
    return `<button type="button" class="action-center-item ${tone}" data-action-center-action="${escapeHtml(action)}">${escapeHtml(label)}<span aria-hidden="true">→</span></button>`;
  }

  function renderActiveItems() {
    return (registry?.workspaces || []).filter((workspace) => workspace.status === 'active').map((workspace) => `
      <article class="action-center-record"><div><span class="status">${escapeHtml(workspace.stage)}</span><h3>${escapeHtml(workspace.name)}</h3><p>${escapeHtml(workspace.nextAction)}</p></div>${actionButton(`Open ${workspace.name}`, `workspace:${workspace.id}:${workspace.resumeWorkspace || 'mission'}`, 'primary')}</article>`).join('');
  }

  function renderTaskItems(items, emptyMessage, mode) {
    if (!items.length) return `<article class="action-center-empty"><strong>Nothing requires action right now.</strong><p>${escapeHtml(emptyMessage)}</p>${actionButton(mode === 'approval' ? 'Open Approval Inbox' : 'Open Natural Nation Build Work', mode === 'approval' ? 'inbox' : 'workspace:natural-nation:build')}</article>`;
    return items.map((task) => `
      <article class="action-center-record"><div><span class="status">${escapeHtml(task.providerStatus || task.status || 'Waiting')}</span><h3>${escapeHtml(task.title || task.id)}</h3><p>Owner: ${escapeHtml(task.owner || 'Unassigned')} · Task: ${escapeHtml(task.id || 'Unknown')}</p></div>${actionButton(mode === 'approval' ? 'Review approval' : 'Open live task', mode === 'approval' ? `approval:${task.id}` : 'workspace:natural-nation:build', 'primary')}</article>`).join('');
  }

  function renderGateway() {
    const detail = health ? `Gateway version ${escapeHtml(health.version || 'current')} responded successfully.` : 'The live Gateway did not respond. Open Code Status for recovery information.';
    return `<article class="action-center-record"><div><span class="status">${health ? 'Online' : 'Needs attention'}</span><h3>Founder OS Gateway</h3><p>${detail}</p></div>${actionButton('Open Code Status', 'workspace:founder-os:repo', 'primary')}</article>`;
  }

  function showFilter(filter) {
    activeFilter = filter;
    const panel = ensurePanel();
    if (!panel) return;
    const definition = metricDefinitions().find((metric) => metric.id === filter);
    const title = panel.querySelector('[data-action-center-title]');
    const description = panel.querySelector('[data-action-center-description]');
    const list = panel.querySelector('[data-action-center-list]');
    if (title) title.textContent = definition?.label || 'Actions';
    if (description) description.textContent = definition?.description || '';
    if (list) {
      if (filter === 'active') list.innerHTML = renderActiveItems();
      if (filter === 'approvals') list.innerHTML = renderTaskItems(approvals(), 'The live workflow reports no Founder approvals waiting.', 'approval');
      if (filter === 'blocked') list.innerHTML = renderTaskItems(blockers(), 'The live workflow reports no blocked tasks.', 'blocked');
      if (filter === 'gateway') list.innerHTML = renderGateway();
    }
    panel.hidden = false;
    renderMetrics();
    panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    title?.focus?.();
  }

  function closePanel() {
    activeFilter = null;
    const panel = $('[data-founder-action-center]');
    if (panel) panel.hidden = true;
    renderMetrics();
  }

  function showActionError(error) {
    const list = $('[data-action-center-list]');
    if (list) list.innerHTML = `<article class="action-center-empty"><strong>Action could not be completed.</strong><p>${escapeHtml(error?.message || String(error))}</p></article>`;
  }

  async function refresh() {
    const list = $('[data-action-center-list]');
    if (list) list.innerHTML = '<p class="muted">Refreshing live Founder OS status…</p>';
    await loadLiveState();
    renderMetrics();
    if (activeFilter) showFilter(activeFilter);
  }

  document.addEventListener('click', (event) => {
    const metric = event.target.closest('[data-action-center-filter]');
    if (metric) { event.preventDefault(); showFilter(metric.dataset.actionCenterFilter); return; }
    if (event.target.closest('[data-action-center-close]')) { event.preventDefault(); closePanel(); return; }
    if (event.target.closest('[data-action-center-refresh]')) { event.preventDefault(); refresh().catch(showActionError); return; }
    const action = event.target.closest('[data-action-center-action]');
    if (!action) return;
    event.preventDefault();
    const value = action.dataset.actionCenterAction;
    if (value === 'create') {
      const createControl = document.querySelector('[data-launch-action="create"]') || document.querySelector('[data-create-workspace]');
      if (createControl) createControl.click();
      else showActionError(new Error('Workspace creation is unavailable.'));
      return;
    }
    if (value === 'inbox') { window.NNOSApprovalInbox?.open(); return; }
    if (value.startsWith('approval:')) {
      const taskId = value.slice('approval:'.length);
      if (window.NNOSApprovalInbox?.open) window.NNOSApprovalInbox.open(taskId);
      else window.dispatchEvent(new CustomEvent('founder-os:approval-requested', { detail: { taskId } }));
      return;
    }
    const [type, workspaceId, target] = value.split(':');
    if (type === 'workspace') openWorkspace(workspaceId, target).catch(showActionError);
  });

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (!event.detail?.workspace && event.detail?.target === 'registry') window.setTimeout(() => { renderMetrics(); renderDashboard(); ensurePanel(); }, 0);
  });
  window.addEventListener('founder-os:approval-recorded', refresh);

  loadStyles();
  loadLiveState().then(() => { renderMetrics(); renderDashboard(); ensurePanel(); }).catch((error) => {
    console.error('Founder Action Center could not load live state.', error);
    registry = { workspaces: [] };
    renderMetrics();
    ensurePanel();
  });
})();
