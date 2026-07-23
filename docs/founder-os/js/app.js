(() => {
  const paths = window.NNOSPaths;
  const completionStyle = document.createElement('link');
  completionStyle.rel = 'stylesheet';
  completionStyle.href = paths.asset('css/ux-completion.css?v=1.0.0');
  document.head.appendChild(completionStyle);

  const taskDetailsStyle = document.createElement('link');
  taskDetailsStyle.rel = 'stylesheet';
  taskDetailsStyle.href = paths.asset('css/founder-task-details.css?v=section-3');
  taskDetailsStyle.dataset.founderTaskDetailsStyles = 'true';
  document.head.appendChild(taskDetailsStyle);

  // Load the single authoritative runtime-state controller before any view that consumes build readiness.
  const runtimeStateScript = document.createElement('script');
  runtimeStateScript.src = paths.asset('js/canonical-runtime-state.js?v=runtime-state-1');
  runtimeStateScript.defer = true;
  runtimeStateScript.dataset.canonicalRuntimeStateLoader = 'true';
  document.head.appendChild(runtimeStateScript);

  const completionScript = document.createElement('script');
  completionScript.src = paths.asset('js/ux-completion.js?v=runtime-state-1');
  completionScript.defer = true;
  document.head.appendChild(completionScript);

  const actionCenterScript = document.createElement('script');
  actionCenterScript.src = paths.asset('js/founder-action-center.js?v=section-2');
  actionCenterScript.defer = true;
  actionCenterScript.dataset.founderActionCenterLoader = 'true';
  document.head.appendChild(actionCenterScript);

  const approvalInboxScript = document.createElement('script');
  approvalInboxScript.src = paths.asset('js/founder-approval-inbox.js?v=section-2');
  approvalInboxScript.defer = true;
  approvalInboxScript.dataset.founderApprovalInboxLoader = 'true';
  document.head.appendChild(approvalInboxScript);

  const taskDetailsScript = document.createElement('script');
  taskDetailsScript.src = paths.asset('js/founder-task-details.js?v=section-3');
  taskDetailsScript.defer = true;
  taskDetailsScript.dataset.founderTaskDetailsLoader = 'true';
  document.head.appendChild(taskDetailsScript);

  const pageMeta = {
    registry: { title: 'Your Workspaces', subtitle: 'Choose what you want to work on.', badge: 'Workspaces' },
    approvals: { title: 'Approval Inbox', subtitle: 'Review evidence, risks, recommendations, and Founder-controlled decisions.', badge: 'Founder Control' },
    discovery: { title: 'What We Know', subtitle: 'See what is confirmed and whether anything still needs your decision.', badge: 'Understanding' },
    blueprint: { title: 'Build Plan', subtitle: 'Review what will be built, what comes later, and what has been approved.', badge: 'Approved Plan' },
    build: { title: 'Build Work', subtitle: 'See the live current owner, ready task, next handoff, and protected execution action.', badge: 'Live Execution' },
    mission: { title: 'Product Overview', subtitle: 'See the current objective, live task, project health, and safest next action.', badge: 'Executive Status' },
    knowledge: { title: 'Project Records', subtitle: 'Find approved decisions, plans, and project information.', badge: 'Records' },
    repo: { title: 'Code Status', subtitle: 'See the canonical repository, deployed Gateway release, and remaining customer-application work.', badge: 'Technical Reality' },
    ai: { title: 'AI Team', subtitle: 'See each stable role, provider readiness, current handoff, and verified task status.', badge: 'Live Assignments' }
  };

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function workspaceAllows(target) {
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace || target === 'registry' || target === 'approvals') return true;
    return (workspace.modules || []).some((module) => module.target === target);
  }

  function setWorkspace(target) {
    const safeTarget = workspaceAllows(target) ? target : (window.NNOSActiveWorkspace?.resumeWorkspace || 'mission');
    document.querySelectorAll('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === safeTarget));
    document.querySelectorAll('[data-context-module]').forEach((button) => button.classList.toggle('active', button.dataset.contextModule === safeTarget));

    const workspace = window.NNOSActiveWorkspace;
    const meta = pageMeta[safeTarget] || pageMeta.registry;
    const workspaceName = workspace?.name || 'Founder OS';
    setText('[data-workspace-title]', meta.title);
    setText('[data-workspace-subtitle]', meta.subtitle);
    setText('[data-workspace-badge]', safeTarget === 'registry' || safeTarget === 'approvals' ? meta.badge : `${workspaceName} · ${meta.badge}`);
    document.body.dataset.activeWorkspace = workspace?.id || 'registry';
    document.body.dataset.activeView = safeTarget;
    window.NNOSShowExecutionBar?.(safeTarget);
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', { detail: { workspace, target: safeTarget } }));
  }

  window.setWorkspace = setWorkspace;
})();