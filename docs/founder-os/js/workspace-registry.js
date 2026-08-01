(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const managementRegistryPath = window.NNOSPaths.asset('config/workspace-registry.json?v=1.6.1');
  const canonicalRegistryPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.0.1');

  let registry = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function modulesFor(workspaceId) {
    if (workspaceId === 'founder-os') return [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Operations' },
      { target: 'repo', label: 'Code Status', group: 'Operations' },
      { target: 'knowledge', label: 'System Records', group: 'Records' }
    ];
    if (workspaceId === 'natural-nation') return [
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

  function mergeRegistries(management, canonical) {
    const managementById = new Map((management?.workspaces || []).map((item) => [item.id, item]));
    const merged = [];

    for (const item of canonical?.workspaces || []) {
      const id = item.workspaceId;
      const base = managementById.get(id);
      const displayName = item.displayName || item.workspaceKey || id;
      merged.push({
        ...(base || {}),
        id,
        workspaceKey: item.workspaceKey || id,
        name: base?.name || displayName,
        description: base?.description || item.description || 'Founder-created workspace registered through Founder OS.',
        purpose: base?.purpose || (id === 'natural-nation'
          ? 'Use this area to plan, review, and build Natural Nation.'
          : 'Use this area to plan, review, and build this independent workspace.'),
        type: base?.type || (id === 'natural-nation' ? 'Product Workspace' : 'Founder-Created Workspace'),
        roleLabel: base?.roleLabel || (id === 'natural-nation' ? 'Builds the product' : 'Builds an independent product'),
        stage: base?.stage || (item.status === 'active' ? 'Active' : 'Foundation'),
        status: item.status || base?.status || 'foundation',
        health: base?.health || item.health?.summary || 'Workspace foundation initialized',
        progress: Number(base?.progress ?? (item.status === 'active' ? 52 : 15)),
        progressLabel: base?.progressLabel || (item.status === 'active' ? 'Active workspace' : 'Foundation initialized'),
        pendingApprovals: Number(base?.pendingApprovals || 0),
        nextAction: base?.nextAction || (item.status === 'active' ? 'Review current product status' : 'Review the workspace foundation'),
        resumeWorkspace: base?.resumeWorkspace || 'mission',
        modules: modulesFor(id)
      });
    }

    const founder = managementById.get('founder-os');
    if (founder && !merged.some((workspace) => workspace.id === 'founder-os')) {
      merged.unshift({ ...founder, modules: modulesFor('founder-os') });
    }

    return {
      registryVersion: canonical?.schemaVersion || management?.registryVersion || '2.0.0',
      commandCenterMetrics: {
        ...(management?.commandCenterMetrics || {}),
        activeWorkspaces: merged.length
      },
      workspaces: merged
    };
  }

  function renderMetrics() {
    const metrics = registry?.commandCenterMetrics;
    const container = $('[data-system-metrics]');
    if (!metrics || !container) return;
    const items = [
      ['Active areas', metrics.activeWorkspaces],
      ['Needs approval', metrics.approvalsWaiting],
      ['Blocked work', metrics.blockedItems],
      ['Gateway', metrics.systemHealth]
    ];
    container.innerHTML = items.map(([label, value]) => `<div class="metric metric-enter"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  }

  function renderHomeNavigation() {
    const nav = $('.nav');
    if (nav) nav.innerHTML = '<button class="nav-link active" type="button" data-nav-home>Home</button>';
  }

  function activateRegistry() {
    window.NNOSActiveWorkspace = null;
    $$('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === 'registry'));
    renderHomeNavigation();
    renderMetrics();

    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');
    if (title) title.textContent = `${greeting()}, Dewane`;
    if (subtitle) subtitle.textContent = 'Choose Founder OS to manage the system or open a product workspace.';
    if (badge) badge.textContent = 'Founder OS Home';

    window.NNOSShowExecutionBar?.('none');
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', {
      detail: { workspace: null, target: 'registry' }
    }));
  }

  function renderRegistry() {
    const list = $('[data-workspace-registry-list]');
    const count = $('[data-workspace-registry-count]');
    const status = $('[data-workspace-registry-status]');
    if (!list || !registry) return;

    if (count) count.textContent = `${registry.workspaces.length} areas`;
    if (status) status.textContent = 'Select Founder OS or any registered product workspace.';

    list.innerHTML = registry.workspaces.map((workspace, index) => {
      const approvals = workspace.pendingApprovals > 0 ? `${workspace.pendingApprovals} awaiting approval` : 'No approvals waiting';
      const isProduct = workspace.id !== 'founder-os';
      return `<article class="workspace-card card-enter ${isProduct ? 'product-workspace-card' : 'platform-workspace-card'}" data-workspace-id="${escapeHtml(workspace.id)}" style="--card-order:${index}" tabindex="0" role="link" aria-label="Open ${escapeHtml(workspace.name)} workspace">
        <div class="workspace-card-purpose">${escapeHtml(workspace.roleLabel || workspace.type)}</div>
        <div class="workspace-card-top"><div><div class="eyebrow">${escapeHtml(workspace.type)}</div><h2>${escapeHtml(workspace.name)}</h2></div><span class="status">${escapeHtml(workspace.stage)}</span></div>
        <p>${escapeHtml(workspace.description)}</p>
        <div class="workspace-use-case"><span>Use this area to</span><strong>${escapeHtml(workspace.purpose)}</strong></div>
        <div class="workspace-progress" aria-label="${escapeHtml(workspace.progressLabel || `${workspace.progress}% complete`)}"><div class="workspace-progress-copy"><span>Current state</span><strong>${escapeHtml(workspace.progressLabel || `${workspace.progress}%`)}</strong></div><div class="workspace-progress-track"><span style="width:${Number(workspace.progress) || 0}%"></span></div></div>
        <div class="workspace-next-step"><span>Recommended next step</span><strong>${escapeHtml(workspace.nextAction)}</strong></div>
        <div class="workspace-card-footer"><span>${escapeHtml(approvals)}</span><span>${escapeHtml(workspace.health)}</span></div>
      </article>`;
    }).join('');

    window.dispatchEvent(new CustomEvent('founder-os:workspace-registry-rendered'));
  }

  async function loadRegistry() {
    const [managementResponse, canonicalResponse] = await Promise.all([
      fetch(`${managementRegistryPath}&verify=${Date.now()}`, { cache: 'no-store' }),
      fetch(`${canonicalRegistryPath}&verify=${Date.now()}`, { cache: 'no-store' })
    ]);
    if (!managementResponse.ok) throw new Error(`Management Workspace Registry returned ${managementResponse.status}`);
    if (!canonicalResponse.ok) throw new Error(`Canonical Workspace Registry returned ${canonicalResponse.status}`);
    const [management, canonical] = await Promise.all([managementResponse.json(), canonicalResponse.json()]);
    registry = mergeRegistries(management, canonical);
    renderRegistry();
    return registry;
  }

  window.addEventListener('founder-os:navigation-home-render-requested', activateRegistry);
  window.addEventListener('founder-os:workspace-created', async () => {
    await loadRegistry();
    activateRegistry();
  });
  window.addEventListener('founder-os:canonical-blueprint-approved', loadRegistry);

  window.NNOSWorkspaceRegistry = {
    load: loadRegistry,
    render: renderRegistry,
    activateHome: activateRegistry,
    getSnapshot: () => registry
  };

  loadRegistry().then(activateRegistry).catch((error) => {
    console.error(error);
    const status = $('[data-workspace-registry-status]');
    if (status) status.textContent = 'Founder OS could not load your work areas. Refresh the page or check repository status.';
  });
})();