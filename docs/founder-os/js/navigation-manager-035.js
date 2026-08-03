(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  let pointer = null;
  let routeSequence = 0;
  let activeRoute = null;
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
    if (!snapshot?.workspaces?.length) snapshot = await window.NNOSWorkspaceRegistry?.load?.();
    if (!snapshot?.workspaces?.length) throw new Error('Workspace registry is unavailable.');
    return snapshot.workspaces;
  }

  function resolveTarget(workspaces, workspaceId) {
    const exactMatches = workspaces.filter((item) => item.id === workspaceId);
    if (exactMatches.length !== 1) {
      throw new Error(exactMatches.length === 0
        ? `Workspace ${workspaceId} is not registered.`
        : `Workspace ${workspaceId} has duplicate route identities.`);
    }

    const workspace = exactMatches[0];
    const target = workspace.resumeWorkspace || 'mission';
    const moduleTargets = new Set((workspace.modules || []).map((module) => module.target));
    if (!moduleTargets.has(target)) throw new Error(`Workspace ${workspaceId} does not expose its route target ${target}.`);
    if (!$(`[data-workspace="${target}"]`)) throw new Error(`Workspace view ${target} does not exist in the page.`);
    return { workspace, target };
  }

  function verifyRoute(workspaceId, target) {
    const activeWorkspaceId = window.NNOSActiveWorkspace?.id || null;
    const activeBodyWorkspace = document.body.dataset.activeWorkspace || null;
    const activeView = document.body.dataset.activeView || null;
    const visibleView = $('.workspace-view.active')?.dataset.workspace || null;
    const valid = activeWorkspaceId === workspaceId
      && activeBodyWorkspace === workspaceId
      && activeView === target
      && visibleView === target;

    trace(valid ? 'workspace-target-verified' : 'workspace-target-mismatch', {
      requestedWorkspaceId: workspaceId,
      requestedTarget: target,
      activeWorkspaceId,
      activeBodyWorkspace,
      activeView,
      visibleView
    });
    return valid;
  }

  async function openWorkspace(workspaceId, source = 'api') {
    const requestedId = String(workspaceId || '').trim();
    if (!requestedId) return false;

    const sequence = ++routeSequence;
    activeRoute = { sequence, workspaceId: requestedId, source };
    document.body.dataset.navigationPending = requestedId;
    trace('workspace-requested', { workspaceId: requestedId, source, sequence });

    try {
      const workspaces = await getWorkspaces();
      if (activeRoute?.sequence !== sequence) {
        trace('workspace-route-superseded', { workspaceId: requestedId, source, sequence });
        return false;
      }

      const { workspace, target } = resolveTarget(workspaces, requestedId);
      window.NNOSActiveWorkspace = workspace;
      renderWorkspaceNavigation(workspace, target);
      window.setWorkspace?.(target);
      $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });

      const verified = verifyRoute(requestedId, target);
      if (!verified) throw new Error(`Workspace ${requestedId} did not activate its expected page target.`);

      trace('workspace-opened', { workspaceId: requestedId, target, source, sequence });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = $('[data-workspace-registry-status]');
      if (status) status.textContent = `Unable to open workspace: ${message}`;
      trace('workspace-failed', { workspaceId: requestedId, source, sequence, error: message });
      return false;
    } finally {
      if (activeRoute?.sequence === sequence) {
        activeRoute = null;
        delete document.body.dataset.navigationPending;
      }
    }
  }

  function openHome(source = 'api') {
    routeSequence += 1;
    activeRoute = null;
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
    if (!$(`[data-workspace="${target}"]`)) {
      trace('view-rejected', { target, source, workspaceId: workspace.id, reason: 'missing-view' });
      return false;
    }

    window.setWorkspace?.(target);
    $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
    trace('view-opened', { target, source, workspaceId: workspace.id });
    return true;
  }

  function normalizeCards() {
    const ids = new Set();
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      const workspaceId = String(card.dataset.workspaceId || '').trim();
      card.dataset.navWorkspace = workspaceId;
      card.dataset.routeTarget = workspaceId;
      card.tabIndex = card.hidden || !workspaceId ? -1 : 0;
      card.setAttribute('role', 'link');
      card.setAttribute('aria-disabled', String(card.tabIndex < 0));

      if (!workspaceId || ids.has(workspaceId)) {
        card.setAttribute('aria-disabled', 'true');
        card.tabIndex = -1;
        trace('card-target-invalid', { workspaceId: workspaceId || null, duplicate: ids.has(workspaceId) });
      }
      ids.add(workspaceId);
    });
  }

  function isInteractive(target) {
    return Boolean(target.closest?.('button,a,input,textarea,select,summary,details,label'));
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const card = event.target.closest?.('.workspace-card[data-workspace-id]');
    if (!card || card.hidden || card.getAttribute('aria-disabled') === 'true' || isInteractive(event.target)) return;

    pointer = {
      id: event.pointerId,
      type: event.pointerType || 'unknown',
      workspaceId: card.dataset.workspaceId,
      card,
      x: event.clientX,
      y: event.clientY
    };
    trace('card-pointer-down', { workspaceId: pointer.workspaceId, pointerType: pointer.type });
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
        workspaceId: action.workspaceId,
        distance,
        threshold,
        carouselSuppressed: Boolean(carouselSuppressed)
      });
      return;
    }

    event.preventDefault();
    ignoreClickUntil = performance.now() + 700;
    openWorkspace(action.workspaceId, 'pointer-up');
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
    if (!card || card.hidden || card.getAttribute('aria-disabled') === 'true' || isInteractive(event.target)) return;
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
    if (!card || card.hidden || card.getAttribute('aria-disabled') === 'true') return;
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