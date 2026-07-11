(() => {
  const registryPath = './config/workspace-registry.json?v=1.0.0';
  let registry = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function activateRegistry() {
    $$('[data-workspace]').forEach((view) => {
      view.classList.toggle('active', view.dataset.workspace === 'registry');
    });

    $$('[data-workspace-button]').forEach((button) => {
      button.classList.toggle('active', button.dataset.workspaceButton === 'registry');
    });

    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');
    const bottomBar = $('.bottom-bar');

    if (title) title.textContent = 'Command Center';
    if (subtitle) subtitle.textContent = 'Choose a workspace, resume progress, or begin a new product.';
    if (badge) badge.textContent = 'Workspace Registry';
    if (bottomBar) bottomBar.hidden = true;
  }

  function openWorkspace(workspace) {
    window.NNOSActiveWorkspace = workspace;

    const bottomBar = $('.bottom-bar');
    if (bottomBar) bottomBar.hidden = false;

    if (typeof window.setWorkspace === 'function') {
      window.setWorkspace(workspace.resumeWorkspace || 'mission');
    } else {
      $$('[data-workspace]').forEach((view) => {
        view.classList.toggle('active', view.dataset.workspace === 'mission');
      });
    }

    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');

    if (title) title.textContent = workspace.name;
    if (subtitle) subtitle.textContent = `${workspace.type} · Stage: ${workspace.stage} · Next: ${workspace.nextAction}`;
    if (badge) badge.textContent = `Workspace #${workspace.number}`;
  }

  function renderRegistry() {
    const list = $('[data-workspace-registry-list]');
    const count = $('[data-workspace-registry-count]');

    if (!list || !registry) return;

    if (count) count.textContent = `${registry.workspaces.length} active workspaces`;

    list.innerHTML = registry.workspaces.map((workspace) => `
      <article class="workspace-card" data-workspace-id="${workspace.id}">
        <div class="workspace-card-top">
          <div>
            <div class="eyebrow">Workspace #${workspace.number}</div>
            <h2>${workspace.name}</h2>
          </div>
          <span class="status">${workspace.stage}</span>
        </div>
        <p>${workspace.description}</p>
        <div class="workspace-meta-grid">
          <div><span>Type</span><strong>${workspace.type}</strong></div>
          <div><span>Health</span><strong>${workspace.health}</strong></div>
          <div><span>Version</span><strong>${workspace.version}</strong></div>
          <div><span>Next</span><strong>${workspace.nextAction}</strong></div>
        </div>
        <button class="generate" type="button" data-resume-workspace="${workspace.id}">Resume Workspace</button>
      </article>
    `).join('');
  }

  async function loadRegistry() {
    const status = $('[data-workspace-registry-status]');

    try {
      const response = await fetch(registryPath, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Workspace Registry returned ${response.status}`);
      registry = await response.json();
      renderRegistry();
      if (status) status.textContent = 'Workspace Registry ready.';
    } catch (error) {
      if (status) status.textContent = 'Workspace Registry could not be loaded.';
      console.error(error);
    }
  }

  document.addEventListener('click', (event) => {
    const registryButton = event.target.closest('[data-workspace-button="registry"]');
    if (registryButton) {
      event.preventDefault();
      setTimeout(activateRegistry, 0);
      return;
    }

    const resumeButton = event.target.closest('[data-resume-workspace]');
    if (resumeButton && registry) {
      const workspace = registry.workspaces.find((item) => item.id === resumeButton.dataset.resumeWorkspace);
      if (workspace) openWorkspace(workspace);
      return;
    }

    const createButton = event.target.closest('[data-create-workspace]');
    if (createButton) {
      const status = $('[data-workspace-registry-status]');
      if (status) status.textContent = 'Create Workspace workflow is the next Command Center capability.';
    }
  });

  loadRegistry().finally(activateRegistry);
})();
