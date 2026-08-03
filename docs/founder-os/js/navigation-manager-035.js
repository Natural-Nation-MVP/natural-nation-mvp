(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  let pointer = null;
  let routePromise = null;
  let ignoreClickUntil = 0;

  const trace = (action, detail = {}) => {
    const entry = { action, detail, at: new Date().toISOString() };
    window.NNOSNavigationTrace = [...(window.NNOSNavigationTrace || []).slice(-99), entry];
    console.info('[Founder OS navigation]', action, detail);
    window.dispatchEvent(new CustomEvent('founder-os:navigation-trace', { detail: entry }));
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

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

  async function getWorkspaces() {
    let snapshot = window.NNOSWorkspaceRegistry?.getSnapshot?.();
    if (!snapshot?.workspaces?.length) {
      snapshot = await window.NNOSWorkspaceRegistry?.load?.();
    }
    if (!snapshot?.workspaces?.length) throw new Error('Workspace registry is unavailable.');
    return snapshot.workspaces;
  }

  async function openWorkspace(workspaceId, source = 'api') {
    if (!workspaceId) return false;
    if (routePromise) return routePromise;

    document.body.dataset.navigationPending = workspaceId;
    trace('workspace-requested', { workspaceId, source });

    routePromise = (async () => {
      try {
        const workspaces = await getWorkspaces();
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
        delete document.body.dataset.navigationPending;
        routePromise = null;
      }
    })();

    return routePromise;
  }

  function openHome(source = 'api') {
    delete document.body.dataset.navigationPending;
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

  function normalizeCards() {
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      card.dataset.navWorkspace = card.dataset.workspaceId;
      card.tabIndex = card.hidden ? -1 : 0;
      card.setAttribute('role', 'link');
      card.setAttribute('aria-disabled', String(card.hidden));
    });
  }

  function isInteractive(target) {
    return Boolean(target.closest?.('button,a,input,textarea,select,summary,details,label'));
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const card = event.target.closest?.('.workspace-card[data-workspace-id]');
    if (!card || card.hidden || isInteractive(event.target)) return;

    pointer = {
      id: event.pointerId,
      type: event.pointerType || 'unknown',
      card,
      x: event.clientX,
      y: event.clientY
    };
    trace('card-pointer-down', { workspaceId: card.dataset.workspaceId, pointerType: pointer.type });
  }

  function onPointerUp(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const action = pointer;
    pointer = null;

    const distance = Math.hypot(event.clientX - action.x, event.clientY - action.y);
    const threshold = action.type === 'touch' ? 14 : 8;
    const track = action.card.closest('[data-workspace-registry-list]');
    const carouselSuppressed = window.NNOSCarousel?.shouldSuppressClick?.(track);

    if (distance > threshold || carouselSuppressed) {
      trace('card-pointer-cancelled', {
        workspaceId: action.card.dataset.workspaceId,
        distance,
        threshold,
        carouselSuppressed: Boolean(carouselSuppressed)
      });
      return;
    }

    event.preventDefault();
    ignoreClickUntil = performance.now() + 700;
    openWorkspace(action.card.dataset.workspaceId, 'pointer-up');
  }

  function onPointerCancel(event) {
    if (pointer?.id === event.pointerId) pointer = null;
  }

  function onClick(event) {
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

    const card = event.target.closest?.('.workspace-card[data-workspace-id]');
    if (!card || card.hidden || isInteractive(event.target)) return;
    if (performance.now() < ignoreClickUntil) {
      event.preventDefault();
      return;
    }

    const track = card.closest('[data-workspace-registry-list]');
    if (window.NNOSCarousel?.shouldSuppressClick?.(track)) {
      event.preventDefault();
      trace('card-click-cancelled', { workspaceId: card.dataset.workspaceId, reason: 'carousel-drag' });
      return;
    }

    event.preventDefault();
    openWorkspace(card.dataset.workspaceId, 'click');
  }

  function onKeyDown(event) {
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

    const card = event.target.closest?.('.workspace-card[data-workspace-id]');
    if (!card || card.hidden) return;
    event.preventDefault();
    openWorkspace(card.dataset.workspaceId, 'keyboard');
  }

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('pointerup', onPointerUp, true);
  document.addEventListener('pointercancel', onPointerCancel, true);
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-lifecycle-changed'].forEach((name) => {
    window.addEventListener(name, () => requestAnimationFrame(normalizeCards));
  });

  window.NNOSNavigationManager = {
    openWorkspace,
    openHome,
    openView,
    audit: normalizeCards,
    getTrace: () => [...(window.NNOSNavigationTrace || [])]
  };

  normalizeCards();
})();