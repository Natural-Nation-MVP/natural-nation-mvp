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

  function currentWorkspace() {
    return window.NNOSActiveWorkspace || null;
  }

  function scopedTasks() {
    const workspace = currentWorkspace();
    if (!workspace) return tasks();
    if (orchestration?.workspaceId && orchestration.workspaceId !== workspace.id) return [];
    return tasks();
  }

  function scopedApprovals() {
    const ids = new Set(scopedTasks().map((task) => task.id));
    return approvals().filter((task) => ids.has(task.id));
  }

  function scopedBlockers() {
    const ids = new Set(scopedTasks().map((task) => task.id));
    return blockers().filter((task) => ids.has(task.id));
  }

  function metricDefinitions() {
    const workspace = currentWorkspace();
    if (!workspace) {
      return [
        { id: 'active', label: 'Active workspaces', value: registry?.workspaces?.filter((item) => item.status === 'active').length ?? 0, description: 'Open a workspace and continue its real work.' },
        { id: 'approvals', label: 'Needs approval', value: approvals().length, description: 'Review decisions requiring Founder approval across the portfolio.' },
        { id: 'blocked', label: 'Blocked work', value: blockers().length, description: 'Review blocked portfolio work.' },
        { id: 'gateway', label: 'System health', value: health ? 'Online' : 'Check', description: 'Open live repository and deployment status.' }
      ];
    }
    const values = scopedTasks();
    const completed = values.filter((task) => ['complete', 'completed', 'founder-approved'].includes(String(task.status || '').toLowerCase())).length;
    const progress = values.length ? Math.round((completed / values.length) * 100) : 0;
    return [
      { id: 'current', label: 'Current objective', value: workspace.stage || 'In progress', description: workspace.nextAction || 'Open Product Overview for the current objective.' },
      { id: 'approvals', label: 'Needs your decision', value: scopedApprovals().length, description: `Review ${workspace.name} decisions requiring Founder authority.` },
      { id: 'progress', label: 'Build progress', value: `${progress}%`, description: `${completed} of ${values.length} tasks complete.` },
      { id: 'blocked', label: 'Risks & blockers', value: scopedBlockers().length, description: scopedBlockers().length ? `Review blockers affecting ${workspace.name}.` : 'No blockers.' }
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
    const workspace = currentWorkspace();
    const taskRecords = scopedTasks().map((task) => ({
      at: task.updatedAt || orchestration?.updatedAt || '',
      title: task.title || task.id || 'AI team task',
      detail: `${task.owner || 'AI team'} · ${task.providerStatus || task.status || 'updated'}`
    }));
    const workspaceRecords = workspace ? [] : (registry?.workspaces || []).map((item) => ({
      at: item.updatedAt || item.createdAt || '',
      title: item.name || item.id,
      detail: `Workspace · ${item.status || item.stage || 'available'}`
    }));
    return [...taskRecords, ...workspaceRecords].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 6);
  }

  function ensureMobileWorkspaceChrome() {
    let header = $('[data-mobile-workspace-header]');
    let navigation = $('[data-mobile-workspace-navigation]');
    if (!header) {
      header = document.createElement('header');
      header.className = 'mobile-workspace-header';
      header.dataset.mobileWorkspaceHeader = '';
      document.body.prepend(header);
    }
    if (!navigation) {
      navigation = document.createElement('nav');
      navigation.className = 'mobile-workspace-navigation';
      navigation.dataset.mobileWorkspaceNavigation = '';
      navigation.setAttribute('aria-label', 'Workspace navigation');
      document.body.appendChild(navigation);
    }
    const workspace = currentWorkspace();
    const name = workspace?.name || 'Founder OS';
    header.innerHTML = `
      <button type="button" class="mobile-header-menu" data-nav-home aria-label="All workspaces"><span></span><span></span><span></span></button>
      <div class="mobile-header-brand"><span aria-hidden="true">☘</span><strong>${escapeHtml(name)}</strong></div>
      <button type="button" class="mobile-workspace-selector" data-nav-home>${escapeHtml(name)} <span aria-hidden="true">⌄</span></button>`;
    navigation.innerHTML = workspace ? `
      <button type="button" data-action-center-action="workspace:${escapeHtml(workspace.id)}:mission"><span aria-hidden="true">⌂</span><small>Overview</small></button>
      <button type="button" data-action-center-action="inbox"><span aria-hidden="true">▣</span><small>Approvals</small></button>
      <button type="button" data-action-center-action="workspace:${escapeHtml(workspace.id)}:build"><span aria-hidden="true">⌁</span><small>Build</small></button>
      <button type="button" data-action-center-action="workspace:${escapeHtml(workspace.id)}:ai"><span aria-hidden="true">♙</span><small>Team</small></button>` : '';
    header.hidden = !workspace;
    navigation.hidden = !workspace;
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
    ensureMobileWorkspaceChrome();
    const workspace = currentWorkspace();
    const activity = recentActivity();
    if (workspace) {
      const waiting = scopedApprovals();
      const nextLabel = waiting.length ? 'Review Decision' : 'Open Product Overview';
      const nextAction = waiting.length ? (waiting[0]?.title || 'Review the next Founder approval') : (workspace.nextAction || 'Continue the current objective');
      const nextRoute = waiting.length ? 'inbox' : `workspace:${workspace.id}:mission`;
      dashboard.dataset.dashboardScope = workspace.id;
      dashboard.innerHTML = `
        <article class="glass-panel command-center-section workspace-dashboard-intro" data-command-center-section="workspace">
          <div class="eyebrow">${escapeHtml(workspace.name)} Workspace</div><h2>Founder Dashboard</h2><p class="muted">Here’s what needs your attention in this workspace.</p>
        </article>
        <article class="glass-panel command-center-section workspace-next-action" data-command-center-section="next-action">
          <div><div class="eyebrow">Your Next Action</div><h2>${escapeHtml(nextAction)}</h2><p class="muted">${waiting.length ? 'A Founder decision is needed to keep the work moving.' : 'Continue the currently approved workspace objective.'}</p></div>
          ${actionButton(nextLabel, nextRoute, 'primary')}
        </article>
        <details class="glass-panel command-center-section workspace-activity" data-command-center-section="activity"><summary>Recent Activity</summary><div class="command-center-activity">${activity.length ? activity.map((item) => `<div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>`).join('') : '<p class="muted">No recent activity is available yet.</p>'}</div></details>
        <article class="glass-panel command-center-section command-center-quick-actions" data-command-center-section="quick-actions">
          <div><div class="eyebrow">Workspace Actions</div><h2>Continue ${escapeHtml(workspace.name)}</h2></div>
          <div class="command-center-action-grid">${actionButton('Approvals', 'inbox')}${actionButton('Build', `workspace:${workspace.id}:build`)}${actionButton('AI Team', `workspace:${workspace.id}:ai`)}</div>
        </article>`;
      return;
    }
    const team = teamSummary();
    const workspaces = registry?.workspaces || [];
    const activeWorkspaces = workspaces.filter((item) => item.status === 'active').length;
    dashboard.dataset.dashboardScope = 'global';
    dashboard.innerHTML = `
      <article class="glass-panel command-center-section" data-command-center-section="workspace"><div class="command-center-heading"><div><div class="eyebrow">Workspace Manager</div><h2>Portfolio</h2></div><span class="pill">${activeWorkspaces} active · ${workspaces.length} total</span></div><p class="muted">Open a workspace below to continue its approved work or manage its lifecycle.</p></article>
      <article class="glass-panel command-center-section" data-command-center-section="ai"><div class="command-center-heading"><div><div class="eyebrow">AI Team Monitor</div><h2>Current workload</h2></div>${actionButton('Open AI Team', 'workspace:natural-nation:ai')}</div><div class="command-center-stat-grid"><div><strong>${team.ready}</strong><span>Ready</span></div><div><strong>${team.working}</strong><span>Working</span></div><div><strong>${team.blocked}</strong><span>Blocked</span></div><div><strong>${team.review}</strong><span>Founder review</span></div></div></article>
      <article class="glass-panel command-center-section" data-command-center-section="gateway"><div class="command-center-heading"><div><div class="eyebrow">Gateway Status</div><h2>${health ? 'Online' : 'Needs attention'}</h2></div>${actionButton('Open Code Status', 'workspace:founder-os:repo')}</div></article>
      <article class="glass-panel command-center-section" data-command-center-section="activity"><div class="command-center-heading"><div><div class="eyebrow">Activity Feed</div><h2>Recent work</h2></div><button type="button" data-action-center-refresh>Refresh</button></div><div class="command-center-activity">${activity.length ? activity.map((item) => `<div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>`).join('') : '<p class="muted">No recent activity is available yet.</p>'}</div></article>
      <article class="glass-panel command-center-section command-center-quick-actions" data-command-center-section="quick-actions"><div><div class="eyebrow">Quick Actions</div><h2>Start here</h2></div><div class="command-center-action-grid">${actionButton('Create Workspace', 'create', 'primary')}${actionButton('Approval Inbox', 'inbox')}${actionButton('Build Studio', 'workspace:natural-nation:build')}${actionButton('AI Team', 'workspace:natural-nation:ai')}${actionButton('Gateway Status', 'workspace:founder-os:repo')}</div></article>`;
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
    const workspace = currentWorkspace();
    const icons = { current: '◎', approvals: '♙', progress: '↗', blocked: '⬡' };
    const definitions = metricDefinitions();
    container.classList.toggle('workspace-metrics', Boolean(workspace));
    container.innerHTML = workspace ? definitions.map((metric) => `
      <button class="metric metric-action workspace-metric workspace-metric-${metric.id}" type="button" data-action-center-filter="${metric.id}" aria-expanded="${activeFilter === metric.id}">
        <span class="workspace-metric-icon" aria-hidden="true">${icons[metric.id] || '•'}</span>
        <span class="workspace-metric-label">${escapeHtml(metric.label)}</span>
        <strong>${escapeHtml(metric.value)}</strong>
        <p>${escapeHtml(metric.description)}</p>
        ${metric.id === 'progress' ? `<span class="workspace-progress" aria-hidden="true"><i style="width:${escapeHtml(metric.value)}"></i></span>` : ''}
      </button>`).join('') : definitions.map((metric) => `
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
    const workspace = currentWorkspace();
    const workspaces = workspace ? [workspace] : (registry?.workspaces || []).filter((item) => item.status === 'active');
    return workspaces.map((item) => `
      <article class="action-center-record"><div><span class="status">${escapeHtml(item.stage)}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.nextAction)}</p></div>${actionButton(`Open ${item.name}`, `workspace:${item.id}:${item.resumeWorkspace || 'mission'}`, 'primary')}</article>`).join('');
  }

  function renderCurrentWorkspace() {
    const workspace = currentWorkspace();
    if (!workspace) return renderActiveItems();
    return `<article class="action-center-record"><div><span class="status">${escapeHtml(workspace.stage || 'Current')}</span><h3>${escapeHtml(workspace.name)}</h3><p>${escapeHtml(workspace.nextAction || 'Continue the current objective.')}</p></div>${actionButton('Open Product Overview', `workspace:${workspace.id}:mission`, 'primary')}</article>`;
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
      if (filter === 'current' || filter === 'progress') list.innerHTML = renderCurrentWorkspace();
      if (filter === 'approvals') list.innerHTML = renderTaskItems(currentWorkspace() ? scopedApprovals() : approvals(), 'The live workflow reports no Founder approvals waiting.', 'approval');
      if (filter === 'blocked') list.innerHTML = renderTaskItems(currentWorkspace() ? scopedBlockers() : blockers(), 'The live workflow reports no blocked tasks.', 'blocked');
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

  window.addEventListener('founder-os:workspace-view-changed', () => {
    activeFilter = null;
    const panel = $('[data-founder-action-center]');
    if (panel) panel.hidden = true;
    window.setTimeout(() => { renderMetrics(); renderDashboard(); ensurePanel(); }, 0);
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
