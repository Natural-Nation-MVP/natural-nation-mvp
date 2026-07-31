(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const managementPath = window.NNOSPaths.asset('config/workspace-registry.json?v=1.6.1');
  const canonicalPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.1.0');

  let directory = null;
  let directoryPromise = null;
  let routeInFlight = false;
  let pointerAction = null;
  let ignoreSyntheticClickUntil = 0;

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

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const trace = (action, detail = {}) => {
    const entry = { action, detail, at: new Date().toISOString() };
    window.NNOSNavigationTrace = [...(window.NNOSNavigationTrace || []).slice(-99), entry];
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
        if (!merged.some((workspace) => workspace.id === id)) {
          merged.push({ ...base, workspaceKey: item.workspaceKey || id, modules: modulesFor(id) });
        }
        continue;
      }
      merged.push({
        id,
        workspaceKey: item.workspaceKey || id,
        name: item.displayName || item.workspaceKey || id,
        description: item.description || 'Founder-created workspace registered through Founder OS.',
        type: id === 'natural-nation' ? 'Product Workspace' : 'Founder-Created Workspace',
        roleLabel: id === 'natural-nation' ? 'Builds the product' : 'Builds an independent product',
        status: item.status || 'foundation',
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
      fetch(`${managementPath}&navigation=038`, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(`Management registry returned ${response.status}`);
        return response.json();
      }),
      fetch(`${canonicalPath}&navigation=038`, { cache: 'no-store' }).then((response) => {
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
      <div class="nav-context"><small>You are working in</small><strong>${escapeHtml(workspace.name)}</strong><span>${escapeHtml(workspace.roleLabel || workspace.type || 'Workspace')}</span></div>
      ${[...groups.entries()].map(([group, modules]) => `<div class="nav-group"><div class="nav-group-label">${escapeHtml(group)}</div>${modules.map((module) => `<button class="nav-link${module.target === activeTarget ? ' active' : ''}" type="button" data-nav-view="${escapeHtml(module.target)}" aria-current="${module.target === activeTarget ? 'page' : 'false'}">${escapeHtml(module.label)}</button>`).join('')}</div>`).join('')}`;
  }

  async function openWorkspace(workspaceId, source = 'api') {
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
      const message = error instanceof Error ? error.message : String(error);
      const status = $('[data-workspace-registry-status]');
      if (status) status.textContent = `Unable to open workspace: ${message}`;
      trace('workspace-failed', { workspaceId, source, error: message });
      return false;
    } finally {
      routeInFlight = false;
    }
  }

  function openHome(source = 'api') {
    window.NNOSActiveWorkspace = null;
    window.setWorkspace?.('registry');
    window.dispatchEvent(new CustomEvent('founder-os:navigation-home-render-requested'));
    $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
    trace('home-opened', { source });
    return true;
  }

  function openView(target, source = 'api') {
    const workspace = window.NNOSActiveWorkspace;
    if (target === 'registry') return openHome(source);
    if (!target || !workspace || !(workspace.modules || []).some((module) => module.target === target)) {
      trace('view-rejected', { target: target || null, source, workspaceId: workspace?.id || null });
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
      card.tabIndex = card.hidden || card.dataset.launchStatus === 'deleted' ? -1 : 0;
      card.setAttribute('role', 'link');
      card.setAttribute('aria-disabled', String(card.tabIndex < 0));
      const title = $('.workspace-launch-card-title h3, .workspace-card-top h2', card)?.textContent?.trim() || workspaceId;
      card.setAttribute('aria-label', `Open ${title} workspace`);
    });

    // Only navigation controls inside the navigation regions are normalized.
    $$('.nav [data-context-module], .nav [data-workspace-button]:not([data-workspace-button="registry"])').forEach((control) => {
      control.dataset.navView = control.dataset.contextModule || control.dataset.workspaceButton || '';
    });
    $$('.nav [data-command-center-home], .nav [data-workspace-button="registry"], [data-founder-home-tag]').forEach((control) => {
      control.dataset.navHome = '';
    });
  }

  function isInteractiveChild(target) {
    return Boolean(target.closest?.('button,a,input,textarea,select,summary,details,label'));
  }

  function beginPointerAction(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const card = event.target.closest?.('.workspace-card[data-nav-workspace]');
    if (!card || isInteractiveChild(event.target) || card.hidden || card.getAttribute('aria-disabled') === 'true') return;
    pointerAction = { pointerId: event.pointerId, card, x: event.clientX, y: event.clientY };
    trace('card-pointer-down', { workspaceId: card.dataset.navWorkspace, pointerType: event.pointerType || 'unknown' });
  }

  function finishPointerAction(event) {
    if (!pointerAction || pointerAction.pointerId !== event.pointerId) return;
    const action = pointerAction;
    pointerAction = null;
    const distance = Math.hypot(event.clientX - action.x, event.clientY - action.y);
    const track = action.card.closest('[data-workspace-registry-list]');

    if (distance > 8 || window.NNOSCarousel?.shouldSuppressClick?.(track)) {
      trace('card-pointer-cancelled', { workspaceId: action.card.dataset.navWorkspace, distance });
      return;
    }

    event.preventDefault();
    ignoreSyntheticClickUntil = performance.now() + 650;
    openWorkspace(action.card.dataset.navWorkspace, 'pointer-up');
  }

  function cancelPointerAction(event) {
    if (pointerAction?.pointerId === event.pointerId) pointerAction = null;
  }

  function routeClick(event) {
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
    if (!card || isInteractiveChild(event.target)) return;
    if (performance.now() < ignoreSyntheticClickUntil) {
      event.preventDefault();
      return;
    }
    const track = card.closest('[data-workspace-registry-list]');
    if (window.NNOSCarousel?.shouldSuppressClick?.(track)) {
      event.preventDefault();
      trace('card-click-cancelled', { workspaceId: card.dataset.navWorkspace, reason: 'carousel-drag' });
      return;
    }
    event.preventDefault();
    openWorkspace(card.dataset.navWorkspace, 'click-fallback');
  }

  function routeKeyboard(event) {
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
    openWorkspace(card.dataset.navWorkspace, 'keyboard');
  }

  // Pointer capture is limited to card gesture recognition. It never cancels unrelated controls.
  document.addEventListener('pointerdown', beginPointerAction, true);
  document.addEventListener('pointerup', finishPointerAction, true);
  document.addEventListener('pointercancel', cancelPointerAction, true);

  // Click and keyboard routing run in bubble phase so page-level feature controls run normally.
  document.addEventListener('click', routeClick);
  document.addEventListener('keydown', routeKeyboard);

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

  loadDirectory().catch((error) => trace('directory-preload-failed', { error: error instanceof Error ? error.message : String(error) }));
  normalizeControls();
})();