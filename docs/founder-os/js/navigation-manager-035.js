(function () {
  'use strict';

  var pointer = null;
  var touch = null;
  var routeSequence = 0;
  var activeRoute = null;
  var ignoreClickUntil = 0;

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function closest(target, selector) { return target && target.closest ? target.closest(selector) : null; }
  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }

  function trace(action, detail) {
    var entry = { action: action, detail: detail || {}, at: new Date().toISOString() };
    var list = window.NNOSNavigationTrace || [];
    window.NNOSNavigationTrace = list.slice(-99).concat([entry]);
    if (window.console && console.info) console.info('[Founder OS navigation]', action, entry.detail);
    window.dispatchEvent(new CustomEvent('founder-os:navigation-trace', { detail: entry }));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function renderWorkspaceNavigation(workspace, activeTarget) {
    var nav = one('.nav');
    if (!nav) return;
    var groups = {};
    var order = [];
    var modules = workspace.modules || [];
    for (var i = 0; i < modules.length; i += 1) {
      var module = modules[i];
      if (!one('[data-workspace="' + module.target + '"]')) continue;
      var group = module.group || 'Workspace';
      if (!groups[group]) { groups[group] = []; order.push(group); }
      groups[group].push(module);
    }

    var html = '<button class="nav-link back-link" type="button" data-nav-home>← Founder OS Home</button>' +
      '<div class="nav-context"><small>You are working in</small><strong>' + escapeHtml(workspace.name) + '</strong><span>' + escapeHtml(workspace.roleLabel || workspace.type || 'Workspace') + '</span></div>';
    for (var g = 0; g < order.length; g += 1) {
      var groupName = order[g];
      html += '<div class="nav-group"><div class="nav-group-label">' + escapeHtml(groupName) + '</div>';
      var items = groups[groupName];
      for (var m = 0; m < items.length; m += 1) {
        var item = items[m];
        var active = item.target === activeTarget;
        html += '<button class="nav-link' + (active ? ' active' : '') + '" type="button" data-nav-view="' + escapeHtml(item.target) + '" aria-current="' + (active ? 'page' : 'false') + '">' + escapeHtml(item.label) + '</button>';
      }
      html += '</div>';
    }
    nav.innerHTML = html;
  }

  function getWorkspaces() {
    var registry = window.NNOSWorkspaceRegistry;
    var snapshot = registry && registry.getSnapshot ? registry.getSnapshot() : null;
    if (snapshot && snapshot.workspaces && snapshot.workspaces.length) return Promise.resolve(snapshot.workspaces);
    if (!registry || !registry.load) return Promise.reject(new Error('Workspace registry is unavailable.'));
    return registry.load().then(function (loaded) {
      if (!loaded || !loaded.workspaces || !loaded.workspaces.length) throw new Error('Workspace registry is unavailable.');
      return loaded.workspaces;
    });
  }

  function resolveTarget(workspaces, workspaceId) {
    var matches = [];
    for (var i = 0; i < workspaces.length; i += 1) if (workspaces[i].id === workspaceId) matches.push(workspaces[i]);
    if (matches.length !== 1) throw new Error(matches.length ? 'Workspace route identity is duplicated.' : 'Workspace is not registered.');
    var workspace = matches[0];
    var target = workspace.resumeWorkspace || 'mission';
    var allowed = false;
    var modules = workspace.modules || [];
    for (var j = 0; j < modules.length; j += 1) if (modules[j].target === target) allowed = true;
    if (!allowed || !one('[data-workspace="' + target + '"]')) throw new Error('Workspace page target is unavailable.');
    return { workspace: workspace, target: target };
  }

  function scrollMainTop() {
    var main = one('.main');
    if (!main) return;
    try { main.scrollTo(0, 0); } catch (error) { main.scrollTop = 0; }
  }

  function openWorkspace(workspaceId, source) {
    var requestedId = String(workspaceId || '').trim();
    if (!requestedId) return Promise.resolve(false);
    var sequence = ++routeSequence;
    activeRoute = { sequence: sequence, workspaceId: requestedId };
    document.body.setAttribute('data-navigation-pending', requestedId);
    trace('workspace-requested', { workspaceId: requestedId, source: source || 'api', sequence: sequence });

    return getWorkspaces().then(function (workspaces) {
      if (!activeRoute || activeRoute.sequence !== sequence) return false;
      var resolved = resolveTarget(workspaces, requestedId);
      window.NNOSActiveWorkspace = resolved.workspace;
      renderWorkspaceNavigation(resolved.workspace, resolved.target);
      if (typeof window.setWorkspace !== 'function' || !window.setWorkspace(resolved.target)) throw new Error('Workspace page could not be displayed.');
      scrollMainTop();
      trace('workspace-opened', { workspaceId: requestedId, target: resolved.target, source: source || 'api' });
      return true;
    }).catch(function (error) {
      var status = one('[data-workspace-registry-status]');
      if (status) status.textContent = 'Unable to open workspace: ' + (error && error.message ? error.message : String(error));
      trace('workspace-failed', { workspaceId: requestedId, error: error && error.message ? error.message : String(error) });
      return false;
    }).then(function (result) {
      if (activeRoute && activeRoute.sequence === sequence) {
        activeRoute = null;
        document.body.removeAttribute('data-navigation-pending');
      }
      return result;
    });
  }

  function openHome(source) {
    routeSequence += 1;
    activeRoute = null;
    document.body.removeAttribute('data-navigation-pending');
    window.NNOSActiveWorkspace = null;
    if (typeof window.setWorkspace === 'function') window.setWorkspace('registry');
    window.dispatchEvent(new CustomEvent('founder-os:navigation-home-render-requested'));
    scrollMainTop();
    trace('home-opened', { source: source || 'api' });
    return true;
  }

  function openView(target, source) {
    var workspace = window.NNOSActiveWorkspace;
    if (target === 'registry') return openHome(source);
    if (!workspace || !target) return false;
    var allowed = false;
    var modules = workspace.modules || [];
    for (var i = 0; i < modules.length; i += 1) if (modules[i].target === target) allowed = true;
    if (!allowed || !one('[data-workspace="' + target + '"]')) return false;
    var opened = typeof window.setWorkspace === 'function' && window.setWorkspace(target);
    if (opened) scrollMainTop();
    trace(opened ? 'view-opened' : 'view-rejected', { target: target, source: source || 'api', workspaceId: workspace.id });
    return opened;
  }

  function isInteractive(target) { return Boolean(closest(target, 'button,a,input,textarea,select,summary,details,label')); }
  function cardFrom(target) { return closest(target, '.workspace-card[data-workspace-id]'); }
  function carouselSuppressed(card) {
    var track = card ? closest(card, '[data-workspace-registry-list]') : null;
    return Boolean(window.NNOSCarousel && window.NNOSCarousel.shouldSuppressClick && window.NNOSCarousel.shouldSuppressClick(track));
  }

  function beginGesture(id, type, card, x, y) {
    return { id: id, type: type, workspaceId: card.getAttribute('data-workspace-id'), card: card, x: x, y: y };
  }

  function finishGesture(action, x, y, source, event) {
    if (!action) return;
    var dx = x - action.x;
    var dy = y - action.y;
    var distance = Math.sqrt((dx * dx) + (dy * dy));
    var threshold = action.type === 'touch' ? 18 : 8;
    if (distance > threshold || carouselSuppressed(action.card)) return;
    if (event && event.cancelable) event.preventDefault();
    ignoreClickUntil = now() + 750;
    openWorkspace(action.workspaceId, source);
  }

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    var card = cardFrom(event.target);
    if (!card || card.hidden || card.getAttribute('aria-disabled') === 'true' || isInteractive(event.target)) return;
    pointer = beginGesture(event.pointerId, event.pointerType || 'mouse', card, event.clientX, event.clientY);
  }

  function onPointerUp(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    var action = pointer;
    pointer = null;
    finishGesture(action, event.clientX, event.clientY, 'pointer-up', event);
  }

  function onTouchStart(event) {
    if (window.PointerEvent || !event.touches || event.touches.length !== 1) return;
    var card = cardFrom(event.target);
    if (!card || card.hidden || isInteractive(event.target)) return;
    var point = event.touches[0];
    touch = beginGesture(point.identifier, 'touch', card, point.clientX, point.clientY);
  }

  function onTouchEnd(event) {
    if (window.PointerEvent || !touch || !event.changedTouches) return;
    for (var i = 0; i < event.changedTouches.length; i += 1) {
      var point = event.changedTouches[i];
      if (point.identifier === touch.id) {
        var action = touch;
        touch = null;
        finishGesture(action, point.clientX, point.clientY, 'touch-end', event);
        return;
      }
    }
  }

  function onClick(event) {
    var home = closest(event.target, '[data-nav-home]');
    if (home) { event.preventDefault(); openHome('click'); return; }
    var view = closest(event.target, '[data-nav-view]');
    if (view) { event.preventDefault(); openView(view.getAttribute('data-nav-view'), 'click'); return; }
    var card = cardFrom(event.target);
    if (!card || card.hidden || isInteractive(event.target)) return;
    if (now() < ignoreClickUntil || carouselSuppressed(card)) { event.preventDefault(); return; }
    event.preventDefault();
    openWorkspace(card.getAttribute('data-workspace-id'), 'click');
  }

  function onKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var home = closest(event.target, '[data-nav-home]');
    if (home) { event.preventDefault(); openHome('keyboard'); return; }
    var view = closest(event.target, '[data-nav-view]');
    if (view) { event.preventDefault(); openView(view.getAttribute('data-nav-view'), 'keyboard'); return; }
    var card = cardFrom(event.target);
    if (card && !card.hidden) { event.preventDefault(); openWorkspace(card.getAttribute('data-workspace-id'), 'keyboard'); }
  }

  function normalizeCards() {
    var cards = all('.workspace-card[data-workspace-id]');
    var ids = {};
    for (var i = 0; i < cards.length; i += 1) {
      var card = cards[i];
      var id = String(card.getAttribute('data-workspace-id') || '').trim();
      var invalid = !id || ids[id];
      ids[id] = true;
      card.tabIndex = card.hidden || invalid ? -1 : 0;
      card.setAttribute('role', 'link');
      card.setAttribute('aria-disabled', invalid ? 'true' : 'false');
    }
  }

  if (window.PointerEvent) {
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', function () { pointer = null; }, true);
  } else {
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true, passive: false });
    document.addEventListener('touchcancel', function () { touch = null; }, true);
  }
  document.addEventListener('click', onClick, false);
  document.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('founder-os:workspace-registry-rendered', function () { requestAnimationFrame(normalizeCards); });
  window.addEventListener('founder-os:workspace-lifecycle-changed', function () { requestAnimationFrame(normalizeCards); });

  window.NNOSNavigationManager = {
    openWorkspace: openWorkspace,
    openHome: openHome,
    openView: openView,
    audit: normalizeCards,
    getTrace: function () { return (window.NNOSNavigationTrace || []).slice(); }
  };

  normalizeCards();
})();