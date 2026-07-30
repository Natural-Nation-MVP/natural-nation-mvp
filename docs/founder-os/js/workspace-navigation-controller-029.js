(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const ROUTES = {
    founderOS: [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Operations' },
      { target: 'repo', label: 'Code Status', group: 'Operations' },
      { target: 'knowledge', label: 'System Records', group: 'Records' }
    ],
    naturalNation: [
      { target: 'mission', label: 'Product Overview', group: 'Start' },
      { target: 'discovery', label: 'Confirmed Direction', group: 'Planning' },
      { target: 'blueprint', label: 'Approved Plan', group: 'Planning' },
      { target: 'build', label: 'Build Work', group: 'Execution' },
      { target: 'ai', label: 'Assigned AI Team', group: 'Execution' },
      { target: 'repo', label: 'Code Status', group: 'Execution' },
      { target: 'knowledge', label: 'Product Records', group: 'Records' }
    ],
    generic: [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Execution' },
      { target: 'repo', label: 'Code Status', group: 'Execution' },
      { target: 'knowledge', label: 'Workspace Records', group: 'Records' }
    ]
  };

  const PAGE_LABELS = {
    founderOS: {
      mission: ['Founder OS Overview', 'Review system priorities, current operations, and the safest next action.'],
      ai: ['AI Team', 'See role ownership, active handoffs, readiness, and work waiting for review.'],
      repo: ['Code Status', 'Review repository health, validation, deployment, and synchronization.'],
      knowledge: ['System Records', 'Search approved Founder OS architecture, operations, governance, and system records.']
    },
    naturalNation: {
      mission: ['Product Overview', 'See the current objective, live task, product health, and safest next action.'],
      discovery: ['Confirmed Direction', 'Review what is confirmed and identify anything that still needs a Founder decision.'],
      blueprint: ['Approved Plan', 'Review the approved product plan, phases, scope, and locked decisions.'],
      build: ['Build Work', 'Review current implementation work, ownership, validation, and the next handoff.'],
      ai: ['Assigned AI Team', 'See which AI role owns the current Natural Nation work and what happens next.'],
      repo: ['Code Status', 'Review Natural Nation repository health, checks, deployment, and synchronization.'],
      knowledge: ['Product Records', 'Search approved Natural Nation decisions, plans, assets, protocols, and product records.']
    },
    generic: {
      mission: ['Workspace Overview', 'Review the workspace foundation, current status, and recommended next action.'],
      ai: ['AI Team', 'See assigned AI roles, active work, handoffs, and readiness.'],
      repo: ['Code Status', 'Review repository health, validation, deployment, and synchronization.'],
      knowledge: ['Workspace Records', 'Search approved records belonging only to this workspace.']
    }
  };

  function workspaceKind(workspace) {
    if (workspace?.id === 'founder-os') return 'founderOS';
    if (workspace?.id === 'natural-nation') return 'naturalNation';
    return 'generic';
  }

  function availableRoutes(workspace) {
    return ROUTES[workspaceKind(workspace)].filter((route) => $(`[data-workspace="${route.target}"]`));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function syncHeader(workspace, target) {
    const kind = workspaceKind(workspace);
    const fallback = [workspace?.name || 'Workspace', workspace?.nextAction || 'Review the current workspace status.'];
    const [title, subtitle] = PAGE_LABELS[kind][target] || fallback;
    const titleNode = $('[data-workspace-title]');
    const subtitleNode = $('[data-workspace-subtitle]');
    const badgeNode = $('[data-workspace-badge]');
    if (titleNode) titleNode.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle;
    if (badgeNode) {
      badgeNode.hidden = false;
      badgeNode.textContent = `${workspace?.name || 'Workspace'} · ${workspace?.stage || 'Active'}`;
    }
  }

  function renderNavigation(workspace, activeTarget) {
    const nav = $('.nav');
    if (!nav || !workspace) return;
    const groups = new Map();
    availableRoutes(workspace).forEach((route) => {
      if (!groups.has(route.group)) groups.set(route.group, []);
      groups.get(route.group).push(route);
    });
    nav.innerHTML = `<button class="nav-link back-link" type="button" data-command-center-home>← Founder OS Home</button>
      <div class="nav-context"><small>You are working in</small><strong>${escapeHtml(workspace.name)}</strong><span>${escapeHtml(workspace.roleLabel || workspace.type || 'Workspace')}</span></div>
      ${[...groups.entries()].map(([group, items]) => `<div class="nav-group"><div class="nav-group-label">${escapeHtml(group)}</div>${items.map((item) => `<button class="nav-link${item.target === activeTarget ? ' active' : ''}" type="button" data-context-module="${escapeHtml(item.target)}" aria-current="${item.target === activeTarget ? 'page' : 'false'}">${escapeHtml(item.label)}</button>`).join('')}</div>`).join('')}`;
  }

  function auditNavigation(workspace = window.NNOSActiveWorkspace, target = document.body.dataset.activeView || 'mission') {
    if (!workspace) return;
    const expected = availableRoutes(workspace);
    const current = $$('[data-context-module]').map((button) => ({ target: button.dataset.contextModule, label: button.textContent.trim() }));
    const isCorrect = expected.length === current.length && expected.every((route, index) => route.target === current[index]?.target && route.label === current[index]?.label);
    if (!isCorrect) renderNavigation(workspace, target);
    syncHeader(workspace, target);
    $$('[data-context-module]').forEach((button) => {
      const active = button.dataset.contextModule === target;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
      button.disabled = !$(`[data-workspace="${button.dataset.contextModule}"]`);
    });
  }

  // Do not capture or cancel click events here. The canonical registry controller owns routing.
  // This controller now only audits link correctness and synchronizes labels/accessibility.
  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    const workspace = event.detail?.workspace;
    if (!workspace) return;
    auditNavigation(workspace, event.detail?.target || document.body.dataset.activeView || 'mission');
  });

  window.addEventListener('founder-os:workspace-registry-rendered', () => {
    if (window.NNOSActiveWorkspace) auditNavigation();
  });

  window.NNOSWorkspaceNavigation = {
    audit: auditNavigation,
    routesFor: availableRoutes
  };
})();