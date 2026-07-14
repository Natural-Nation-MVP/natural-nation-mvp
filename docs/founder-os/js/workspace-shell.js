(() => {
  const meta = {
    registry: { title: 'Command Center', subtitle: 'Choose a workspace, resume progress, or begin a new product.', badge: 'Workspace Registry' },
    discovery: { title: 'Workspace Discovery', subtitle: 'Review what Founder OS knows and resolve the remaining uncertainty.', badge: 'Natural Nation · Discovery' },
    blueprint: { title: 'Workspace Blueprint', subtitle: 'Review the canonical execution contract before protected approval.', badge: 'Natural Nation · Blueprint' },
    build: { title: 'Build Studio', subtitle: 'Open the canonical Founder-approved execution package.', badge: 'Natural Nation · Build' },
    mission: { title: 'Natural Nation', subtitle: 'Workspace operating overview.', badge: 'Natural Nation · Overview' },
    knowledge: { title: 'Knowledge', subtitle: 'Canonical project knowledge.', badge: 'Natural Nation · Knowledge' },
    repo: { title: 'Repository', subtitle: 'Canonical repository status.', badge: 'Natural Nation · Repository' },
    ai: { title: 'AI Team', subtitle: 'AI roles and handoffs.', badge: 'Natural Nation · AI Team' }
  };

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function setWorkspace(target) {
    document.querySelectorAll('[data-workspace]').forEach((view) => {
      view.classList.toggle('active', view.dataset.workspace === target);
    });

    document.querySelectorAll('[data-context-module]').forEach((button) => {
      button.classList.toggle('active', button.dataset.contextModule === target);
    });

    const page = meta[target] || meta.registry;
    setText('[data-workspace-title]', page.title);
    setText('[data-workspace-subtitle]', page.subtitle);
    setText('[data-workspace-badge]', page.badge);
    window.NNOSShowExecutionBar?.(target);
  }

  window.setWorkspace = setWorkspace;
})();
