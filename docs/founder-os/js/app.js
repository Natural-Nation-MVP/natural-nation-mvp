(function () {
  'use strict';

  var paths = window.NNOSPaths;

  function addStyle(path, marker) {
    if (!paths || !paths.asset) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = paths.asset(path);
    if (marker) link.setAttribute(marker, 'true');
    document.head.appendChild(link);
  }

  function addScript(path, marker) {
    if (!paths || !paths.asset) return;
    var script = document.createElement('script');
    script.src = paths.asset(path);
    script.defer = true;
    if (marker) script.setAttribute(marker, 'true');
    document.head.appendChild(script);
  }

  addStyle('css/ux-completion.css?v=1.0.0');
  addStyle('css/founder-task-details.css?v=section-3', 'data-founder-task-details-styles');
  addStyle('css/repository-actions.css?v=section-4', 'data-repository-actions-styles');
  addScript('js/canonical-runtime-state.js?v=runtime-state-1', 'data-canonical-runtime-state-loader');
  addScript('js/ux-completion.js?v=runtime-state-1');
  addScript('js/founder-action-center.js?v=fos-actions-007', 'data-founder-action-center-loader');
  addScript('js/founder-approval-inbox.js?v=file-impact-approval', 'data-founder-approval-inbox-loader');
  addScript('js/founder-task-details.js?v=section-3', 'data-founder-task-details-loader');

  var pageMeta = {
    registry: { title: 'Your Workspaces', subtitle: 'Choose what you want to work on.', badge: 'Workspaces' },
    approvals: { title: 'Approval Inbox', subtitle: 'Review evidence, risks, recommendations, and Founder-controlled decisions.', badge: 'Founder Control' },
    discovery: { title: 'What We Know', subtitle: 'See what is confirmed and whether anything still needs your decision.', badge: 'Understanding' },
    blueprint: { title: 'Build Plan', subtitle: 'Review what will be built, what comes later, and what has been approved.', badge: 'Approved Plan' },
    build: { title: 'Build Work', subtitle: 'See the live current owner, ready task, next handoff, and protected execution action.', badge: 'Live Execution' },
    mission: { title: 'Product Overview', subtitle: 'See the current objective, live task, project health, and safest next action.', badge: 'Executive Status' },
    knowledge: { title: 'Project Records', subtitle: 'Find approved decisions, plans, and project information.', badge: 'Records' },
    evidence: { title: 'Evidence & Audit', subtitle: 'Review verified work, outcomes, project impact, and technical proof.', badge: 'Evidence' },
    analytics: { title: 'Usage Analytics', subtitle: 'See what is consuming AI and automation usage and where optimization is working.', badge: 'Optimization' },
    repo: { title: 'Code Status', subtitle: 'Review source code, checks, deployment, and merge readiness.', badge: 'Founder Repository Control' },
    ai: { title: 'AI Team', subtitle: 'See the AI-composed workspace team, provider readiness, current handoff, and verified task status.', badge: 'Live Assignments' }
  };

  function setText(selector, value) {
    var node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function workspaceAllows(target) {
    var workspace = window.NNOSActiveWorkspace;
    if (!workspace || target === 'registry' || target === 'approvals') return true;
    var modules = workspace.modules || [];
    for (var i = 0; i < modules.length; i += 1) {
      if (modules[i].target === target) return true;
    }
    return false;
  }

  function resetTransitionState() {
    var main = document.querySelector('.main');
    var nodes = [document.documentElement, document.body, main];
    var classes = ['view-transition-out', 'view-transition-in', 'is-transitioning', 'is-loading', 'route-loading'];
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      if (!node) continue;
      for (var j = 0; j < classes.length; j += 1) node.classList.remove(classes[j]);
      node.style.removeProperty('visibility');
      node.style.removeProperty('opacity');
      node.style.removeProperty('pointer-events');
      if (node.getAnimations) {
        var animations = node.getAnimations();
        for (var a = 0; a < animations.length; a += 1) animations[a].cancel();
      }
    }
  }

  function activateView(target) {
    var views = document.querySelectorAll('[data-workspace]');
    var selected = null;
    for (var i = 0; i < views.length; i += 1) {
      if (views[i].getAttribute('data-workspace') === target) selected = views[i];
    }
    if (!selected) return false;

    resetTransitionState();
    for (var j = 0; j < views.length; j += 1) {
      var view = views[j];
      var active = view === selected;
      view.classList.toggle('active', active);
      view.hidden = !active;
      view.setAttribute('aria-hidden', active ? 'false' : 'true');
      view.style.removeProperty('display');
      view.style.removeProperty('opacity');
      view.style.removeProperty('visibility');
      view.style.removeProperty('pointer-events');
      if (view.getAnimations) {
        var animations = view.getAnimations();
        for (var a = 0; a < animations.length; a += 1) animations[a].cancel();
      }
    }

    selected.hidden = false;
    selected.style.display = 'block';
    selected.style.visibility = 'visible';
    selected.style.opacity = '1';
    selected.style.pointerEvents = 'auto';
    return true;
  }

  function setWorkspace(target) {
    var workspace = window.NNOSActiveWorkspace;
    var fallback = workspace && workspace.resumeWorkspace ? workspace.resumeWorkspace : 'mission';
    var safeTarget = workspaceAllows(target) ? target : fallback;
    if (!activateView(safeTarget)) return false;

    var buttons = document.querySelectorAll('[data-nav-view]');
    for (var i = 0; i < buttons.length; i += 1) {
      var button = buttons[i];
      var buttonTarget = button.getAttribute('data-nav-view');
      var active = buttonTarget === safeTarget;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    }

    var meta = pageMeta[safeTarget] || pageMeta.registry;
    if (safeTarget === 'mission' && workspace && workspace.id === 'founder-os') {
      meta = { title: 'Founder Command Center', subtitle: 'See live work, decisions, risks, roadmap, providers, evidence, and recorded cost.', badge: 'Live Portfolio' };
    }
    var workspaceName = workspace && workspace.name ? workspace.name : 'Founder OS';
    setText('[data-workspace-title]', meta.title);
    setText('[data-workspace-subtitle]', meta.subtitle);
    setText('[data-workspace-badge]', safeTarget === 'registry' || safeTarget === 'approvals' ? meta.badge : workspaceName + ' · ' + meta.badge);
    document.body.setAttribute('data-active-workspace', workspace && workspace.id ? workspace.id : 'registry');
    document.body.setAttribute('data-active-view', safeTarget);
    if (typeof window.NNOSShowExecutionBar === 'function') window.NNOSShowExecutionBar(safeTarget);

    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', { detail: { workspace: workspace || null, target: safeTarget } }));
    return true;
  }

  window.NNOSResetTransitionState = resetTransitionState;
  window.setWorkspace = setWorkspace;
  resetTransitionState();
})();
