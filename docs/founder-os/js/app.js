(() => {
  const pageMeta = {
    registry: { title: 'Command Center', subtitle: 'Choose a workspace, resume progress, or begin a new product.', badge: 'Workspace Registry' },
    discovery: { title: 'Workspace Discovery', subtitle: 'Review canonical workspace intelligence and resolved Founder decisions.', badge: 'Discovery' },
    blueprint: { title: 'Workspace Blueprint', subtitle: 'Review the canonical execution contract and approval state.', badge: 'Blueprint' },
    build: { title: 'Build Studio', subtitle: 'Open the selected workspace’s canonical execution package.', badge: 'Build Studio' },
    mission: { title: 'Workspace Overview', subtitle: 'Review operating status, priorities, risks, and next actions.', badge: 'Overview' },
    knowledge: { title: 'Knowledge', subtitle: 'Review canonical knowledge for the selected workspace.', badge: 'Knowledge' },
    repo: { title: 'Repository', subtitle: 'Review repository status for the selected workspace.', badge: 'Repository' },
    ai: { title: 'AI Team', subtitle: 'Review AI roles and handoffs for the selected workspace.', badge: 'AI Team' }
  };

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function workspaceAllows(target) {
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace || target === 'registry') return true;
    return (workspace.modules || []).some((module) => module.target === target);
  }

  function setWorkspace(target) {
    const safeTarget = workspaceAllows(target)
      ? target
      : (window.NNOSActiveWorkspace?.resumeWorkspace || 'mission');

    document.querySelectorAll('[data-workspace]').forEach((view) => {
      view.classList.toggle('active', view.dataset.workspace === safeTarget);
    });

    document.querySelectorAll('[data-context-module]').forEach((button) => {
      button.classList.toggle('active', button.dataset.contextModule === safeTarget);
    });

    const workspace = window.NNOSActiveWorkspace;
    const meta = pageMeta[safeTarget] || pageMeta.registry;
    const workspaceName = workspace?.name || 'Founder OS';
    setText('[data-workspace-title]', safeTarget === 'registry' ? meta.title : `${workspaceName} · ${meta.title}`);
    setText('[data-workspace-subtitle]', meta.subtitle);
    setText('[data-workspace-badge]', safeTarget === 'registry' ? meta.badge : `${workspaceName} · ${meta.badge}`);
    window.NNOSShowExecutionBar?.(safeTarget);

    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', {
      detail: { workspace, target: safeTarget }
    }));
  }

  window.setWorkspace = setWorkspace;
})();
