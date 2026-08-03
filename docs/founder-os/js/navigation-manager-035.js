(function () {
  'use strict';

  var routeSequence = 0;
  var activeRoute = null;

  function one(selector, root) { return (root || document).querySelector(selector); }
  function closest(target, selector) { return target && target.closest ? target.closest(selector) : null; }

  function trace(action, detail) {
    var entry = { action: action, detail: detail || {}, at: new Date().toISOString() };
    var list = window.NNOSNavigationTrace || [];
    window.NNOSNavigationTrace = list.slice(-99).concat([entry]);
    if (window.console && console.info) console.info('[Founder OS navigation]', action, entry.detail);
    try { window.dispatchEvent(new CustomEvent('founder-os:navigation-trace', { detail: entry })); } catch (error) {}
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
    var i;

    for (i = 0; i < modules.length; i += 1) {
      var module = modules[i];
      if (!one('[data-workspace="' + module.target + '"]')) continue;
      var group = module.group || 'Workspace';
      if (!groups[group]) { groups[group] = []; order.push(group); }
      groups[group].push(module);
    }

    var html = '<button class="nav-link back-link" type="button" data-nav-home>← Founder OS Home</button>' +
      '<div class="nav-context"><small>You are working in</small><strong>' + escapeHtml(workspace.name) + '</strong><span>' + escapeHtml(workspace.roleLabel || workspace.type || 'Workspace') + '</span></div>';

    for (i = 0; i < order.length; i += 1) {
      var groupName = order[i];
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
    var match = null;
    var count = 0;
    for (var i = 0; i < workspaces.length; i += 1) {
      if (workspaces[i].id === workspaceId) { match = workspaces[i]; count += 1; }
    }
    if (count !== 1) throw new Error(count ? 'Workspace route identity is duplicated.' : 'Workspace is not registered.');
    var target = match.resumeWorkspace || 'mission';
    var allowed = false;
    var modules = match.modules || [];
    for (var j = 0; j < modules.length; j += 1) if (modules[j].target === target) allowed = true;
    if (!allowed || !one('[data-workspace="' + target + '"]')) throw new Error('Workspace page target is unavailable.');
    return { workspace: match, target: target };
  }

  function scrollMainTop() {
    var main = one('.main');
    if (!main) return;
    main.scrollTop = 0;
  }

  function setHash(workspaceId, view, replace) {
    var hash = '#workspace=' + encodeURIComponent(workspaceId) + (view ? '&view=' + encodeURIComponent(view) : '');
    if (window.location.hash === hash) return;
    try {
      if (replace && window.history && history.replaceState) history.replaceState(null, '', hash);
      else window.location.hash = hash;
    } catch (error) {
      window.location.hash = hash;
    }
  }

  function parseHash() {
    var raw = String(window.location.hash || '').replace(/^#/, '');
    var result = {};
    if (!raw) return result;
    raw.split('&').forEach(function (part) {
      var pieces = part.split('=');
      var key = decodeURIComponent(pieces.shift() || '');
      var value = decodeURIComponent(pieces.join('=') || '');
      if (key) result[key] = value;
    });
    return result;
  }

  function activateWorkspace(workspaceId, source, requestedView) {
    var requestedId = String(workspaceId || '').trim();
    if (!requestedId) return Promise.resolve(false);
    var sequence = ++routeSequence;
    activeRoute = { sequence: sequence, workspaceId: requestedId };
    document.body.setAttribute('data-navigation-pending', requestedId);
    trace('workspace-requested', { workspaceId: requestedId, source: source || 'api', sequence: sequence });

    return getWorkspaces().then(function (workspaces) {
      if (!activeRoute || activeRoute.sequence !== sequence) return false;
      var resolved = resolveTarget(workspaces, requestedId);
      var target = requestedView || resolved.target;
      var permitted = false;
      var modules = resolved.workspace.modules || [];
      for (var i = 0; i < modules.length; i += 1) if (modules[i].target === target) permitted = true;
      if (!permitted || !one('[data-workspace="' + target + '"]')) target = resolved.target;

      window.NNOSActiveWorkspace = resolved.workspace;
      renderWorkspaceNavigation(resolved.workspace, target);
      if (typeof window.setWorkspace !== 'function' || !window.setWorkspace(target)) throw new Error('Workspace page could not be displayed.');
      scrollMainTop();
      setHash(requestedId, target, true);
      trace('workspace-opened', { workspaceId: requestedId, target: target, source: source || 'api' });
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

  function openWorkspace(workspaceId, source) {
    return activateWorkspace(workspaceId, source || 'api', null);
  }

  function openHome(source) {
    routeSequence += 1;
    activeRoute = null;
    document.body.removeAttribute('data-navigation-pending');
    window.NNOSActiveWorkspace = null;
    try {
      if (window.history && history.replaceState) history.replaceState(null, '', window.location.pathname + window.location.search);
      else window.location.hash = '';
    } catch (error) { window.location.hash = ''; }
    if (typeof window.setWorkspace === 'function') window.setWorkspace('registry');
    try { window.dispatchEvent(new CustomEvent('founder-os:navigation-home-render-requested')); } catch (error2) {}
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
    if (opened) {
      setHash(workspace.id, target, true);
      scrollMainTop();
    }
    trace(opened ? 'view-opened' : 'view-rejected', { target: target, source: source || 'api', workspaceId: workspace.id });
    return opened;
  }

  function routeFromHash(source) {
    var route = parseHash();
    if (!route.workspace) return Promise.resolve(false);
    return activateWorkspace(route.workspace, source || 'hash', route.view || null);
  }

  document.addEventListener('click', function (event) {
    var home = closest(event.target, '[data-nav-home]');
    if (home) { event.preventDefault(); openHome('click'); return; }
    var view = closest(event.target, '[data-nav-view]');
    if (view) { event.preventDefault(); openView(view.getAttribute('data-nav-view'), 'click'); return; }

    var link = closest(event.target, 'a[data-workspace-link]');
    if (link) {
      /* Do not prevent the native anchor action. Safari will update the hash even if
         pointer/click synthesis differs from other browsers. hashchange owns routing. */
      trace('native-workspace-link', { workspaceId: link.getAttribute('data-workspace-id') });
    }
  }, false);

  window.addEventListener('hashchange', function () { routeFromHash('hashchange'); });
  window.addEventListener('pageshow', function () { routeFromHash('pageshow'); });
  window.addEventListener('founder-os:workspace-registry-rendered', function () { routeFromHash('registry-rendered'); });

  window.NNOSNavigationManager = {
    openWorkspace: openWorkspace,
    openHome: openHome,
    openView: openView,
    routeFromHash: routeFromHash,
    getTrace: function () { return (window.NNOSNavigationTrace || []).slice(); }
  };

  routeFromHash('startup');
})();