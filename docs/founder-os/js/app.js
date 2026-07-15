(() => {
  const pageMeta = {
    registry: {
      title: 'Your Workspaces',
      subtitle: 'Choose what you want to work on.',
      badge: 'Workspaces'
    },
    discovery: {
      title: 'What We Know',
      subtitle: 'See what is confirmed and whether anything still needs your decision.',
      badge: 'Understanding'
    },
    blueprint: {
      title: 'Build Plan',
      subtitle: 'Review what will be built, what comes later, and what has been approved.',
      badge: 'Approved Plan'
    },
    build: {
      title: 'Build Package',
      subtitle: 'Review the work package that is ready for the build team.',
      badge: 'Ready to Build'
    },
    mission: {
      title: 'What Needs Attention',
      subtitle: 'See current progress, priorities, risks, and your next action.',
      badge: 'Overview'
    },
    knowledge: {
      title: 'Project Records',
      subtitle: 'Find approved decisions, plans, and project information.',
      badge: 'Records'
    },
    repo: {
      title: 'Code & Deployments',
      subtitle: 'See whether the code, deployment, and source records are healthy.',
      badge: 'Technical Status'
    },
    ai: {
      title: 'Build Team',
      subtitle: 'See who is assigned, what they are doing, and what is waiting.',
      badge: 'Team'
    }
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

    setText('[data-workspace-title]', safeTarget === 'registry' ? meta.title : meta.title);
    setText('[data-workspace-subtitle]', meta.subtitle);
    setText('[data-workspace-badge]', safeTarget === 'registry' ? meta.badge : `${workspaceName} · ${meta.badge}`);

    document.body.dataset.activeWorkspace = workspace?.id || 'registry';
    document.body.dataset.activeView = safeTarget;

    window.NNOSShowExecutionBar?.(safeTarget);
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', {
      detail: { workspace, target: safeTarget }
    }));
  }

  window.setWorkspace = setWorkspace;
})();