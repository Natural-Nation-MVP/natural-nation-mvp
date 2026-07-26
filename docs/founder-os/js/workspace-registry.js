(() => {
  const managementRegistryPath = window.NNOSPaths.asset('config/workspace-registry.json?v=1.6.1');
  const canonicalRegistryPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.0.1');
  let registry = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

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
      ['Active areas', metrics.activeWorkspaces],
      ['Needs approval', metrics.approvalsWaiting],
      ['Blocked work', metrics.blockedItems],
      ['Gateway', metrics.systemHealth]
    ];
    container.innerHTML = items.map(([label, value]) => `<div class="metric metric-enter"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  }

  function renderHomeNavigation() {
    const nav = $('.nav');
    if (nav) nav.innerHTML = '<button class="nav-link active" type="button" data-command-center-home>Home</button>';
  }

  function renderWorkspaceNavigation(workspace) {
    const nav = $('.nav');
    if (!nav) return;
    const activeTarget = workspace.resumeWorkspace || 'mission';
    const groups = new Map();
    for (const module of workspace.modules || []) {
      const group = module.group || 'Workspace';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(module);
    }
    const groupedNavigation = [...groups.entries()].map(([group, modules]) => `
      <div class="nav-group">
        <div class="nav-group-label">${escapeHtml(group)}</div>
        ${modules.map((module) => `<button class="nav-link${module.target === activeTarget ? ' active' : ''}" type="button" data-context-module="${escapeHtml(module.target)}">${escapeHtml(module.label)}</button>`).join('')}
      </div>`).join('');
    nav.innerHTML = `
      <button class="nav-link back-link" type="button" data-command-center-home>← Founder OS Home</button>
      <div class="nav-context"><small>You are working in</small><strong>${escapeHtml(workspace.name)}</strong><span>${escapeHtml(workspace.roleLabel || workspace.type)}</span></div>
      ${groupedNavigation}`;
  }

  function pageLabels(workspace, target) {
    const common = {
      mission: workspace.id === 'natural-nation' ? ['Product Overview', 'See the current objective, live task, project health, and safest next action.'] : ['Workspace Overview', 'See the workspace foundation, current status, and recommended next action.'],
      knowledge: workspace.id === 'natural-nation' ? ['Product Records', 'Find approved Natural Nation decisions, plans, assets, and implementation records.'] : ['Workspace Records', 'Find approved workspace decisions, plans, assets, and implementation records.'],
      repo: ['Code Status', 'Check whether the repository, validation, and deployment records are healthy.'],
      ai: workspace.id === 'natural-nation' ? ['Assigned AI Team', 'See which AI role owns the current Natural Nation task and what happens next.'] : ['AI Team', 'See which AI roles are available, assigned, blocked, or waiting for approval.']
    };
    const naturalNation = {
      discovery: ['Confirmed Direction', 'Review what is known about Natural Nation and identify anything that still needs a decision.'],
      blueprint: ['Approved Plan', 'Review the approved Natural Nation product plan without mixing it with implementation status.'],
      build: ['Build Work', 'Review the current implementation package before dispatching work to the build team.']
    };
    return naturalNation[target] || common[target] || [workspace.name, workspace.nextAction];
  }

  function applyWorkspaceHeader(workspace, target) {
    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');
    const [pageTitle, pageSubtitle] = pageLabels(workspace, target);
    if (title) title.textContent = pageTitle;
    if (subtitle) subtitle.textContent = pageSubtitle;
    if (badge) badge.textContent = `${workspace.name} · ${workspace.stage}`;
  }

  function addHomeOrientation() {
    const registryView = $('[data-workspace="registry"]');
    const list = $('[data-workspace-registry-list]');
    if (!registryView || !list || registryView.querySelector('[data-home-orientation]')) return;
    const orientation = document.createElement('article');
    orientation.className = 'glass-panel workspace-orientation';
    orientation.dataset.homeOrientation = '';
    orientation.innerHTML = `<div><div class="eyebrow">How this system is organized</div><div class="section-title">Choose the kind of work you need to do</div><p class="muted">Founder OS manages the work. Product workspaces hold the products being built. They are connected, but they are not the same thing.</p></div><div class="orientation-grid"><div class="orientation-item"><strong>Founder OS</strong><span>Manage AI assignments, approvals, code health, records, and releases.</span></div><div class="orientation-arrow" aria-hidden="true">→</div><div class="orientation-item"><strong>Product Workspaces</strong><span>Review and build each independent product, including Natural Nation and founder-created workspaces.</span></div></div>`;
    list.parentNode.insertBefore(orientation, list);
  }

  function enableControlCenterCreation() {
    const createButton = $('[data-create-workspace]');
    if (!createButton) return;
    createButton.disabled = false;
    createButton.textContent = 'Create Workspace';
    createButton.title = 'Create a workspace from the Founder OS Control Center.';
  }

  function activateRegistry() {
    window.NNOSActiveWorkspace = null;
    $$('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === 'registry'));
    renderHomeNavigation();
    renderMetrics();
    addHomeOrientation();
    enableControlCenterCreation();
    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');
    if (title) title.textContent = `${greeting()}, Dewane`;
    if (subtitle) subtitle.textContent = 'Choose Founder OS to manage the system or open a product workspace.';
    if (badge) badge.textContent = 'Founder OS Home';
    showExecutionBar('none');
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', { detail: { workspace: null, target: 'registry' } }));
  }

  function openWorkspace(workspace) {
    window.NNOSActiveWorkspace = workspace;
    renderWorkspaceNavigation(workspace);
    const target = workspace.resumeWorkspace || 'mission';
    window.setWorkspace?.(target);
    applyWorkspaceHeader(workspace, target);
    showExecutionBar(target);
  }

  function deriveModules(workspaceId) {
    if (workspaceId === 'founder-os') return [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Operations' },
      { target: 'repo', label: 'Code Status', group: 'Operations' },
      { target: 'knowledge', label: 'System Records', group: 'Records' }
    ];
    if (workspaceId === 'natural-nation') return [
      { target: 'mission', label: 'Product Overview', group: 'Start' },
      { target: 'discovery', label: 'Confirmed Direction', group: 'Planning' },
      { target: 'blueprint', label: 'Approved Plan', group: 'Planning' },
      { target: 'build', label: 'Build Work', group: 'Execution' },
      { target: 'ai', label: 'Assigned AI Team', group: 'Execution' },
      { target: 'repo', label: 'Code Status', group: 'Execution' },
      { target: 'knowledge', label: 'Product Records', group: 'Records' }
    ];
    return [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Execution' },
      { target: 'repo', label: 'Code Status', group: 'Execution' },
      { target: 'knowledge', label: 'Workspace Records', group: 'Records' }
    ];
  }

  function mergeRegistries(management, canonical) {
    const managementById = new Map((management?.workspaces || []).map((item) => [item.id, item]));
    const canonicalWorkspaces = Array.isArray(canonical?.workspaces) ? canonical.workspaces : [];
    const merged = [];

    const founderOS = managementById.get('founder-os');
    if (founderOS) merged.push(founderOS);

    for (const item of canonicalWorkspaces) {
      const id = item.workspaceId;
      const base = managementById.get(id);
      if (base) {
        merged.push({ ...base, workspaceKey: item.workspaceKey || id });
        continue;
      }
      const isNaturalNation = id === 'natural-nation';
      const displayName = item.displayName || item.workspaceKey || id;
      merged.push({
        number: item.sequence ?? merged.length,
        id,
        workspaceKey: item.workspaceKey || id,
        name: displayName,
        description: item.description || 'Founder-created workspace registered through Founder OS.',
        purpose: isNaturalNation ? 'Use this area to decide what Natural Nation should become and move approved product work into production.' : 'Use this area to plan, review, and build this independent product workspace.',
        type: isNaturalNation ? 'Product Workspace' : 'Founder-Created Workspace',
        roleLabel: isNaturalNation ? 'Builds the product' : 'Builds an independent product',
        stage: item.status === 'active' ? 'Active' : 'Foundation',
        status: item.status || 'foundation',
        health: item.health?.summary || 'Workspace foundation initialized',
        version: item.lifecycleStatus || 'MVP',
        progress: item.status === 'active' ? 52 : 15,
        progressLabel: item.status === 'active' ? 'Active workspace' : 'Foundation initialized',
        lastActivity: item.updatedAt || item.createdAt || '',
        pendingApprovals: 0,
        nextAction: item.status === 'active' ? 'Review current product status' : 'Review the approved workspace foundation and define the first build package',
        primaryAction: `Open ${displayName}`,
        resumeWorkspace: 'mission',
        modules: deriveModules(id)
      });
    }

    const activeWorkspaces = merged.length;
    return {
      registryVersion: canonical?.schemaVersion || management?.registryVersion || '2.0.0',
      defaultWorkspaceId: management?.defaultWorkspaceId || 'founder-os',
      commandCenterMetrics: {
        ...(management?.commandCenterMetrics || {}),
        activeWorkspaces
      },
      workspaces: merged
    };
  }

  function renderRegistry() {
    const list = $('[data-workspace-registry-list]');
    const count = $('[data-workspace-registry-count]');
    const status = $('[data-workspace-registry-status]');
    if (!list || !registry) return;
    if (count) count.textContent = `${registry.workspaces.length} areas`;
    if (status) status.textContent = 'Select Founder OS or any registered product workspace.';
    list.innerHTML = registry.workspaces.map((workspace, index) => {
      const approvals = workspace.pendingApprovals > 0 ? `${workspace.pendingApprovals} awaiting approval` : 'No approvals waiting';
      const isProduct = workspace.id !== 'founder-os';
      return `<article class="workspace-card card-enter ${isProduct ? 'product-workspace-card' : 'platform-workspace-card'}" data-workspace-id="${escapeHtml(workspace.id)}" style="--card-order:${index}"><div class="workspace-card-purpose">${escapeHtml(workspace.roleLabel || workspace.type)}</div><div class="workspace-card-top"><div><div class="eyebrow">${escapeHtml(workspace.type)}</div><h2>${escapeHtml(workspace.name)}</h2></div><span class="status">${escapeHtml(workspace.stage)}</span></div><p>${escapeHtml(workspace.description)}</p><div class="workspace-use-case"><span>Use this area to</span><strong>${escapeHtml(workspace.purpose)}</strong></div><div class="workspace-progress" aria-label="${escapeHtml(workspace.progressLabel || `${workspace.progress}% complete`)}"><div class="workspace-progress-copy"><span>Current state</span><strong>${escapeHtml(workspace.progressLabel || `${workspace.progress}%`)}</strong></div><div class="workspace-progress-track"><span style="width:${Number(workspace.progress) || 0}%"></span></div></div><div class="workspace-next-step"><span>Recommended next step</span><strong>${escapeHtml(workspace.nextAction)}</strong></div><div class="workspace-card-footer"><span>${escapeHtml(approvals)}</span><span>${escapeHtml(workspace.health)}</span></div><button class="generate" type="button" data-resume-workspace="${escapeHtml(workspace.id)}">${escapeHtml(workspace.primaryAction || `Open ${workspace.name}`)}</button></article>`;
    }).join('');
  }

  async function loadRegistry() {
    const [managementResponse, canonicalResponse] = await Promise.all([
      fetch(`${managementRegistryPath}&verify=${Date.now()}`, { cache: 'no-store' }),
      fetch(`${canonicalRegistryPath}&verify=${Date.now()}`, { cache: 'no-store' })
    ]);
    if (!managementResponse.ok) throw new Error(`Management Workspace Registry returned ${managementResponse.status}`);
    if (!canonicalResponse.ok) throw new Error(`Canonical Workspace Registry returned ${canonicalResponse.status}`);
    const [management, canonical] = await Promise.all([managementResponse.json(), canonicalResponse.json()]);
    registry = mergeRegistries(management, canonical);
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

  window.addEventListener('founder-os:workspace-created', async () => {
    await loadRegistry();
    activateRegistry();
  });

  loadRegistry().then(activateRegistry).catch((error) => {
    console.error(error);
    const status = $('[data-workspace-registry-status]');
    if (status) status.textContent = 'Founder OS could not load your work areas. Refresh the page or check repository status.';
  });
})();
