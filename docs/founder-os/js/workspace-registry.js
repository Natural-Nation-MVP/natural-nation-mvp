(function () {
  'use strict';

  function one(selector, root) { return (root || document).querySelector(selector); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  var managementPath = window.NNOSPaths.asset('config/workspace-registry.json?v=1.6.1');
  var canonicalPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.1.0');
  var registry = null;
  var loadPromise = null;
  var initialHomeCommitted = false;

  function modulesFor(id) {
    if (id === 'founder-os') return [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Operations' },
      { target: 'repo', label: 'Code Status', group: 'Operations' },
      { target: 'knowledge', label: 'System Records', group: 'Records' }
    ];
    if (id === 'natural-nation') return [
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

  function copyObject(source) {
    var target = {};
    if (!source) return target;
    Object.keys(source).forEach(function (key) { target[key] = source[key]; });
    return target;
  }

  function merge(management, canonical) {
    var byId = {};
    var managementWorkspaces = management && management.workspaces ? management.workspaces : [];
    var canonicalWorkspaces = canonical && canonical.workspaces ? canonical.workspaces : [];
    var workspaces = [];

    managementWorkspaces.forEach(function (item) { byId[item.id] = item; });
    canonicalWorkspaces.forEach(function (item) {
      var id = item.workspaceId;
      var base = copyObject(byId[id] || {});
      base.id = id;
      base.workspaceKey = item.workspaceKey || id;
      base.name = base.name || item.displayName || item.workspaceKey || id;
      base.description = base.description || item.description || 'Founder-created workspace registered through Founder OS.';
      base.purpose = base.purpose || (id === 'natural-nation' ? 'Plan, review, and build Natural Nation.' : 'Plan, review, and build this independent workspace.');
      base.type = base.type || (id === 'natural-nation' ? 'Product Workspace' : 'Founder-Created Workspace');
      base.roleLabel = base.roleLabel || (id === 'natural-nation' ? 'Builds the product' : 'Builds an independent product');
      base.stage = base.stage || (item.status === 'active' ? 'Active' : 'Foundation');
      base.status = item.status || base.status || 'foundation';
      base.health = base.health || (item.health && item.health.summary) || 'Workspace foundation initialized';
      base.progress = Number(base.progress != null ? base.progress : (item.status === 'active' ? 52 : 15));
      base.progressLabel = base.progressLabel || (item.status === 'active' ? 'Active workspace' : 'Foundation initialized');
      base.pendingApprovals = Number(base.pendingApprovals || 0);
      base.nextAction = base.nextAction || (item.status === 'active' ? 'Review current product status' : 'Review the workspace foundation');
      base.resumeWorkspace = base.resumeWorkspace || 'mission';
      base.modules = modulesFor(id);
      workspaces.push(base);
    });

    if (byId['founder-os'] && !workspaces.some(function (item) { return item.id === 'founder-os'; })) {
      var founder = copyObject(byId['founder-os']);
      founder.modules = modulesFor('founder-os');
      workspaces.unshift(founder);
    }

    var metrics = copyObject(management && management.commandCenterMetrics ? management.commandCenterMetrics : {});
    metrics.activeWorkspaces = workspaces.length;
    return {
      registryVersion: (canonical && canonical.schemaVersion) || (management && management.registryVersion) || '2.0.0',
      commandCenterMetrics: metrics,
      workspaces: workspaces
    };
  }

  function renderMetrics() {
    var metrics = registry && registry.commandCenterMetrics;
    var container = one('[data-system-metrics]');
    if (!metrics || !container) return;
    var items = [
      ['Active areas', metrics.activeWorkspaces],
      ['Needs approval', metrics.approvalsWaiting],
      ['Blocked work', metrics.blockedItems],
      ['Gateway', metrics.systemHealth]
    ];
    container.innerHTML = items.map(function (item) {
      return '<div class="metric metric-enter"><span>' + esc(item[0]) + '</span><strong>' + esc(item[1]) + '</strong></div>';
    }).join('');
  }

  function workspaceHref(workspace) {
    return '#workspace=' + encodeURIComponent(workspace.id) + '&view=' + encodeURIComponent(workspace.resumeWorkspace || 'mission');
  }

  function renderRegistry() {
    var list = one('[data-workspace-registry-list]');
    if (!list || !registry) return;
    var count = one('[data-workspace-registry-count]');
    if (count) count.textContent = registry.workspaces.length + ' areas';
    var status = one('[data-workspace-registry-status]');
    if (status) status.textContent = 'Select Founder OS or any registered product workspace.';

    list.innerHTML = registry.workspaces.map(function (workspace, index) {
      var approvals = workspace.pendingApprovals > 0 ? workspace.pendingApprovals + ' awaiting approval' : 'No approvals waiting';
      var productClass = workspace.id === 'founder-os' ? 'platform-workspace-card' : 'product-workspace-card';
      return '<a class="workspace-card card-enter ' + productClass + '" href="' + workspaceHref(workspace) + '" data-workspace-link data-workspace-id="' + esc(workspace.id) + '" data-nav-workspace="' + esc(workspace.id) + '" style="--card-order:' + index + ';text-decoration:none" aria-label="Open ' + esc(workspace.name) + ' workspace">' +
        '<div class="workspace-card-purpose">' + esc(workspace.roleLabel || workspace.type) + '</div>' +
        '<div class="workspace-card-top"><div><div class="eyebrow">' + esc(workspace.type) + '</div><h2>' + esc(workspace.name) + '</h2></div><span class="status">' + esc(workspace.stage) + '</span></div>' +
        '<p>' + esc(workspace.description) + '</p>' +
        '<div class="workspace-use-case"><span>Use this area to</span><strong>' + esc(workspace.purpose) + '</strong></div>' +
        '<div class="workspace-progress"><div class="workspace-progress-copy"><span>Current state</span><strong>' + esc(workspace.progressLabel) + '</strong></div><div class="workspace-progress-track"><span style="width:' + workspace.progress + '%"></span></div></div>' +
        '<div class="workspace-next-step"><span>Recommended next step</span><strong>' + esc(workspace.nextAction) + '</strong></div>' +
        '<div class="workspace-card-footer"><span>' + esc(approvals) + '</span><span>' + esc(workspace.health) + '</span></div></a>';
    }).join('');

    try { window.dispatchEvent(new CustomEvent('founder-os:workspace-registry-rendered')); } catch (error) {}
  }

  function activateHome() {
    if (document.body.getAttribute('data-navigation-pending')) return;
    if (window.location.hash.indexOf('#workspace=') === 0) return;
    window.NNOSActiveWorkspace = null;
    if (typeof window.setWorkspace === 'function') window.setWorkspace('registry');
    renderMetrics();
  }

  function load() {
    if (registry) return Promise.resolve(registry);
    if (loadPromise) return loadPromise;
    loadPromise = Promise.all([
      fetch(managementPath + '&verify=049', { cache: 'no-store' }),
      fetch(canonicalPath + '&verify=049', { cache: 'no-store' })
    ]).then(function (responses) {
      if (!responses[0].ok) throw new Error('Management registry returned ' + responses[0].status);
      if (!responses[1].ok) throw new Error('Canonical registry returned ' + responses[1].status);
      return Promise.all([responses[0].json(), responses[1].json()]);
    }).then(function (data) {
      registry = merge(data[0], data[1]);
      renderRegistry();
      return registry;
    }).then(function (result) {
      loadPromise = null;
      return result;
    }, function (error) {
      loadPromise = null;
      throw error;
    });
    return loadPromise;
  }

  function commitInitialHomeOnlyIfStillIdle() {
    if (initialHomeCommitted) return;
    initialHomeCommitted = true;
    if (window.location.hash.indexOf('#workspace=') === 0) return;
    if (document.body.getAttribute('data-navigation-pending')) return;
    if (window.NNOSActiveWorkspace && window.NNOSActiveWorkspace.id) return;
    var activeWorkspace = document.body.getAttribute('data-active-workspace');
    var activeView = document.body.getAttribute('data-active-view');
    if ((activeWorkspace && activeWorkspace !== 'registry') || (activeView && activeView !== 'registry')) return;
    activateHome();
  }

  window.addEventListener('founder-os:navigation-home-render-requested', activateHome);
  window.addEventListener('founder-os:workspace-created', function () { load().then(activateHome); });
  window.addEventListener('founder-os:canonical-blueprint-approved', function () { registry = null; load(); });

  window.NNOSWorkspaceRegistry = {
    load: load,
    render: renderRegistry,
    activateHome: activateHome,
    getSnapshot: function () { return registry; }
  };

  load().then(commitInitialHomeOnlyIfStillIdle).catch(function (error) {
    if (window.console && console.error) console.error(error);
    var status = one('[data-workspace-registry-status]');
    if (status) status.textContent = 'Founder OS could not load your work areas. Check repository status.';
  });
})();