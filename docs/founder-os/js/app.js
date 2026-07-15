(() => {
  const completionStyle = document.createElement('link');
  completionStyle.rel = 'stylesheet';
  completionStyle.href = './css/ux-completion.css?v=1.0.0';
  document.head.appendChild(completionStyle);

  const completionScript = document.createElement('script');
  completionScript.src = './js/ux-completion.js?v=1.0.0';
  completionScript.defer = true;
  document.head.appendChild(completionScript);

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
      title: 'Build Work',
      subtitle: 'Review the approved implementation package, its safeguards, and the work assigned to the build team.',
      badge: 'Controlled Execution'
    },
    mission: {
      title: 'Product Overview',
      subtitle: 'See what is approved, what is working, what remains incomplete, and the recommended next action.',
      badge: 'Current Reality'
    },
    knowledge: {
      title: 'Project Records',
      subtitle: 'Find approved decisions, plans, and project information.',
      badge: 'Records'
    },
    repo: {
      title: 'Code Status',
      subtitle: 'See what is connected, what has only passed automated checks, and what still needs production verification.',
      badge: 'Technical Reality'
    },
    ai: {
      title: 'AI Team',
      subtitle: 'See each role, the current handoff, provider readiness, and the limits of automation.',
      badge: 'Assignments'
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

    setText('[data-workspace-title]', meta.title);
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