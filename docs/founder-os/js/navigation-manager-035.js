(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const managementPath = window.NNOSPaths.asset('config/workspace-registry.json?v=1.6.1');
  const canonicalPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.1.0');

  let directory = null;
  let directoryPromise = null;
  let routeInFlight = false;

  const modulesFor = (workspaceId) => {
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
  };

  const trace = (action, detail = {}) => {
    const entry = { action, detail, at: new Date().toISOString() };
    window.NNOSNavigationTrace = [...(window.NNOSNavigationTrace || []).slice(-49), entry];
    console.info('[Founder OS navigation]', action, detail);
    window.dispatchEvent(new CustomEvent('founder-os:navigation-trace', { detail: entry }));
  };

  function mergeDirectory(management, canonical) {
    const managementById = new Map((management?.workspaces || []).map((item) => [item.id, item]));
    const merged = [];
    const founder = managementById.get('founder-os');
    if (founder) merged.push({ ...founder, modules: modulesFor('founder-os') });
    for (const item of canonical?.workspaces || []) {
      const id = item.workspaceId;
      const base = managementById.get(id);
      if (base) {
        if (!merged.some((workspace) => workspace.id === id)) merged.push({ ...base, workspaceKey: item.workspaceKey || id, modules: modulesFor(id) });
        continue;
      }
      const displayName = item.displayName || item.workspaceKey || id;
      merged.push({
        id,
        workspaceKey: item.workspaceKey || id,
        name: displayName,
        description: item.description || 'Founder-created workspace registered through Founder OS.',
        purpose: id === 'natural-nation' ? 'Build and review the Natural Nation product.' : 'Plan, review, and build this independent product workspace.',
        type: id === 'natural-nation' ? 'Product Workspace' : 'Founder-Created Workspace',
        roleLabel: id === 'natural-nation' ? 'Builds the product' : 'Builds an independent product',
        stage: item.status === 'active' ? 'Active' : 'Foundation',
        status: item.status || 'foundation',
        health: item.health?.summary || 'Workspace foundation initialized',
        progress: item.status === 'active' ? 52 : 15,
        progressLabel: item.status === 'active' ? 'Active workspace' : 'Foundation initialized',
        nextAction: item.status === 'active' ? 'Review current product status' : 'Review the workspace foundation',
        resumeWorkspace: 'mission',
        modules: modulesFor(id)
      });
    }
    return merged;
  }

  async function loadDirectory() {
    if (directory) return directory;
    if (directoryPromise) return directoryPromise;
    directoryPromise = Promise.all([
      fetch(`${managementPath}&navigation=036`, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(`Management registry returned ${response.status}`);
        return response.json();
      }),
      fetch(`${canonicalPath}&navigation=036`, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(`Canonical registry returned ${response.status}`);
        return response.json();
      })
    ]).then(([management, canonical]) => {
      directory = mergeDirectory(management, canonical);
      trace('directory-loaded', { workspaceIds: directory.map((item) => item.id) });
      return directory;
    }).finally(() => { directoryPromise = null; });
    return directoryPromise;
  }

  function renderWorkspaceNavigation(workspace, activeTarget) {
    const nav = $('.nav');
    if (!nav) return;
    const groups = new Map();
    for (const module of workspace.modules || []) {
      if (!$(`[data-workspace="${module.target}"]`)) continue;
      const group = module.group || 'Workspace';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(module);
    }
    nav.innerHTML = `<button class="nav-link back-link" type="button" data-nav-home>← Founder OS Home</button>
      <div class="nav-context"><small>You are working in</small><strong>${workspace.name}</strong><span>${workspace.roleLabel || workspace.type || 'Workspace'}</span></div>
      ${[...groups.entries()].map(([group, modules]) => `<div class="nav-group"><div class="nav-group-label">${group}</div>${modules.map((module) => `<button class="nav-link${module.target === activeTarget ? ' active' : ''}" type="button" data-nav-view="${module.target}" aria-current="${module.target === activeTarget ? 'page' : 'false'}">${module.label}</button>`).join('')}</div>`).join('')}`;
  }

  async function openWorkspace(workspaceId, source = 'unknown') {
    if (!workspaceId || routeInFlight) return false;
    routeInFlight = true;
    trace('workspace-requested', { workspaceId, source });
    try {
      const workspaces = await loadDirectory();
      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (!workspace) throw new Error(`Workspace ${workspaceId} is not registered.`);
      window.NNOSActiveWorkspace = workspace;
      const target = workspace.resumeWorkspace || 'mission';
      renderWorkspaceNavigation(workspace, target);
      window.setWorkspace?.(target);
      $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
      trace('workspace-opened', { workspaceId, target, source });
      return true;
    } catch (error) {
      console.error(error);
      const status = $('[data-workspace-registry-status]');
      if (status) status.textContent = `Unable to open workspace: ${error.message}`;
      trace('workspace-failed', { workspaceId, source, error: error.message });
      return false;
    } finally {
      routeInFlight = false;
    }
  }

  function openHome(source = 'unknown') {
    trace('home-requested', { source });
    window.NNOSActiveWorkspace = null;
    window.setWorkspace?.('registry');
    window.dispatchEvent(new CustomEvent('founder-os:navigation-home-render-requested'));
    $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
    trace('home-opened', { source });
    return true;
  }

  function openView(target, source = 'unknown') {
    const workspace = window.NNOSActiveWorkspace;
    if (!target) return false;
    if (target === 'registry') return openHome(source);
    if (!workspace || !(workspace.modules || []).some((module) => module.target === target)) {
      trace('view-rejected', { target, source, workspaceId: workspace?.id || null });
      return false;
    }
    window.setWorkspace?.(target);
    $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
    trace('view-opened', { target, source, workspaceId: workspace.id });
    return true;
  }

  function normalizeControls() {
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      const workspaceId = card.dataset.workspaceId;
      card.dataset.navWorkspace = workspaceId;
      card.classList.remove('is-unavailable');
      card.setAttribute('aria-disabled', 'false');
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
      card.querySelectorAll('[data-resume-workspace], [data-page-link-workspace]').forEach((control) => {
        control.removeAttribute('data-resume-workspace');
        control.removeAttribute('data-page-link-workspace');
        control.hidden = true;
        control.tabIndex = -1;
        control.setAttribute('aria-hidden', 'true');
      });
    });
    $$('[data-page-link-home], [data-command-center-home], [data-founder-home-tag], [data-workspace-button="registry"]').forEach((control) => control.dataset.navHome = '');
    $$('[data-page-link-view], [data-context-module], [data-workspace-button]:not([data-workspace-button="registry"])').forEach((control) => {
      control.dataset.navView = control.dataset.pageLinkView || control.dataset.contextModule || control.dataset.workspaceButton || '';
    });
  }

  function routeFromClick(event) {
    if (event.defaultPrevented) return;
    if (event.target.closest?.('[data-open-founder-settings], input, textarea, select, summary, details')) return;

    const home = event.target.closest?.('[data-nav-home]');
    if (home) {
      event.preventDefault();
      openHome('click');
      return;
    }

    const view = event.target.closest?.('[data-nav-view]');
    if (view) {
      event.preventDefault();
      openView(view.dataset.navView, 'click');
      return;
    }

    const card = event.target.closest?.('.workspace-card[data-nav-workspace]');
    if (!card || event.target.closest('button,a')) return;
    const track = card.closest('[data-workspace-registry-list]');
    if (window.NNOSCarousel?.shouldSuppressClick?.(track)) {
      trace('card-click-suppressed-after-drag', { workspaceId: card.dataset.navWorkspace });
      event.preventDefault();
      return;
    }
    event.preventDefault();
    openWorkspace(card.dataset.navWorkspace, 'card-click');
  }

  function routeFromKeyboard(event) {
    if (!['Enter', ' '].includes(event.key)) return;
    const home = event.target.closest?.('[data-nav-home]');
    if (home) {
      event.preventDefault();
      openHome('keyboard');
      return;
    }
    const view = event.target.closest?.('[data-nav-view]');
    if (view) {
      event.preventDefault();
      openView(view.dataset.navView, 'keyboard');
      return;
    }
    const card = event.target.closest?.('.workspace-card[data-nav-workspace]');
    if (!card) return;
    event.preventDefault();
    openWorkspace(card.dataset.navWorkspace, 'card-keyboard');
  }

  document.addEventListener('click', routeFromClick);
  document.addEventListener('keydown', routeFromKeyboard);

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed', 'founder-os:workspace-lifecycle-changed'].forEach((name) => {
    window.addEventListener(name, () => requestAnimationFrame(normalizeControls));
  });
  new MutationObserver(() => requestAnimationFrame(normalizeControls)).observe(document.body, { childList: true, subtree: true });

  window.NNOSNavigationManager = {
    openWorkspace,
    openHome,
    openView,
    audit: normalizeControls,
    reloadDirectory: () => { directory = null; return loadDirectory(); },
    getTrace: () => [...(window.NNOSNavigationTrace || [])]
  };

  loadDirectory().catch((error) => trace('directory-preload-failed', { error: error.message }));
  normalizeControls();
})();