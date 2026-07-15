(() => {
  const registryPath = './config/workspace-registry.json?v=1.5.0';
  let registry = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function transition(action) {
    const main = $('.main');
    if (!main || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return action();
    main.classList.add('view-transition-out');
    setTimeout(() => {
      action();
      main.classList.remove('view-transition-out');
      main.classList.add('view-transition-in');
      setTimeout(() => main.classList.remove('view-transition-in'), 250);
    }, 140);
  }

  function showExecutionBar(target) {
    $$('[data-execution-bar]').forEach((bar) => {
      const allowed = window.NNOSActiveWorkspace?.id === 'natural-nation';
      bar.hidden = !allowed || bar.dataset.executionBar !== target;
    });
  }

  window.NNOSShowExecutionBar = showExecutionBar;

  function renderMetrics() {
    const metrics = registry?.commandCenterMetrics;
    const container = $('[data-system-metrics]');
    if (!metrics || !container) return;

    const items = [
      ['Workspaces', metrics.activeWorkspaces],
      ['Waiting for You', metrics.approvalsWaiting],
      ['Blocked', metrics.blockedItems],
      ['System', metrics.systemHealth]
    ];

    container.innerHTML = items
      .map(([label, value]) => `<div class="metric metric-enter"><span>${label}</span><strong>${value}</strong></div>`)
      .join('');
  }

  function renderHomeNavigation() {
    const nav = $('.nav');
    if (nav) nav.innerHTML = '<button class="nav-link active" type="button" data-command-center-home>All Workspaces</button>';
  }

  function renderWorkspaceNavigation(workspace) {
    const nav = $('.nav');
    if (!nav) return;
    const activeTarget = workspace.resumeWorkspace || 'mission';

    nav.innerHTML = `
      <button class="nav-link back-link" type="button" data-command-center-home>← All Workspaces</button>
      <div class="nav-context"><small>Working in</small><strong>${workspace.name}</strong></div>
      ${(workspace.modules || [])
        .map((module) => `<button class="nav-link${module.target === activeTarget ? ' active' : ''}" type="button" data-context-module="${module.target}">${module.label}</button>`)
        .join('')}
    `;
  }

  function applyWorkspaceHeader(workspace, target) {
    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');

    const labels = {
      discovery: ['What We Know', 'See what is confirmed and whether anything still needs your decision.'],
      blueprint: ['Build Plan', 'Review what will be built, what comes later, and what has been approved.'],
      mission: ['What Needs Attention', 'See progress, priorities, risks, and your next action.'],
      build: ['Build Package', 'Review the work package that is ready for the build team.'],
      knowledge: ['Project Records', 'Find approved decisions, plans, and project information.'],
      repo: ['Code & Deployments', 'See whether the code, deployment, and source records are healthy.'],
      ai: ['Build Team', 'See who is assigned, what they are doing, and what is waiting.']
    };

    const [pageTitle, pageSubtitle] = labels[target] || [workspace.name, workspace.nextAction];
    if (title) title.textContent = pageTitle;
    if (subtitle) subtitle.textContent = pageSubtitle;
    if (badge) badge.textContent = `${workspace.name} · ${workspace.stage}`;
  }

  function activateRegistry() {
    window.NNOSActiveWorkspace = null;
    $$('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === 'registry'));
    renderHomeNavigation();
    renderMetrics();

    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');
    if (title) title.textContent = `${greeting()}, Dewane`;
    if (subtitle) subtitle.textContent = 'Choose a workspace and continue from its recommended next step.';
    if (badge) badge.textContent = 'Founder OS';

    showExecutionBar('none');
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';

    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', {
      detail: { workspace: null, target: 'registry' }
    }));
  }

  function openWorkspace(workspace) {
    window.NNOSActiveWorkspace = workspace;
    renderWorkspaceNavigation(workspace);
    const target = workspace.resumeWorkspace || 'mission';
    window.setWorkspace?.(target);
    applyWorkspaceHeader(workspace, target);
    showExecutionBar(target);
  }

  function renderRegistry() {
    const list = $('[data-workspace-registry-list]');
    const count = $('[data-workspace-registry-count]');
    if (!list || !registry) return;

    if (count) count.textContent = `${registry.workspaces.length} workspaces`;

    list.innerHTML = registry.workspaces.map((workspace, index) => {
      const approvals = workspace.pendingApprovals > 0
        ? `${workspace.pendingApprovals} waiting for you`
        : 'Nothing waiting for you';

      return `
        <article class="workspace-card card-enter" data-workspace-id="${workspace.id}" style="--card-order:${index}">
          <div class="workspace-card-top">
            <div><div class="eyebrow">${workspace.type}</div><h2>${workspace.name}</h2></div>
            <span class="status">${workspace.stage}</span>
          </div>
          <p>${workspace.description}</p>
          <div class="workspace-progress" aria-label="${workspace.progress}% complete">
            <div class="workspace-progress-copy"><span>Progress</span><strong>${workspace.progress}%</strong></div>
            <div class="workspace-progress-track"><span style="width:${workspace.progress}%"></span></div>
          </div>
          <div class="workspace-next-step">
            <span>Next step</span>
            <strong>${workspace.nextAction}</strong>
          </div>
          <div class="workspace-card-footer">
            <span>${approvals}</span>
            <span>${workspace.health}</span>
          </div>
          <button class="generate" type="button" data-resume-workspace="${workspace.id}">Open ${workspace.name}</button>
        </article>
      `;
    }).join('');
  }

  async function loadRegistry() {
    const response = await fetch(`${registryPath}&verify=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Workspace Registry returned ${response.status}`);
    registry = await response.json();
    renderRegistry();
    return registry;
  }

  document.addEventListener('click', (event) => {
    const homeButton = event.target.closest('[data-command-center-home]');
    if (homeButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      transition(activateRegistry);
      return;
    }

    const moduleButton = event.target.closest('[data-context-module]');
    if (moduleButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const target = moduleButton.dataset.contextModule;
      transition(() => {
        window.setWorkspace?.(target);
        if (window.NNOSActiveWorkspace) applyWorkspaceHeader(window.NNOSActiveWorkspace, target);
        showExecutionBar(target);
      });
      return;
    }

    const resumeButton = event.target.closest('[data-resume-workspace]');
    if (resumeButton && registry) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const workspace = registry.workspaces.find((item) => item.id === resumeButton.dataset.resumeWorkspace);
      if (workspace) transition(() => openWorkspace(workspace));
    }
  }, true);

  window.addEventListener('founder-os:canonical-blueprint-approved', async () => {
    await loadRegistry();
    const workspace = registry.workspaces.find((item) => item.id === 'natural-nation');
    if (workspace) openWorkspace(workspace);
  });

  loadRegistry().then(activateRegistry).catch((error) => {
    console.error(error);
    const status = $('[data-workspace-registry-status]');
    if (status) status.textContent = 'Founder OS could not load your workspaces.';
  });
})();