(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const managementPath = window.NNOSPaths.asset('config/workspace-registry.json?v=1.6.1');
  const canonicalPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.1.0');

  let registry = null;
  let loadPromise = null;
  let initialHomeCommitted = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const modulesFor = (id) => {
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
  };

  function merge(management, canonical) {
    const byId = new Map((management?.workspaces || []).map((item) => [item.id, item]));
    const workspaces = [];

    for (const item of canonical?.workspaces || []) {
      const id = item.workspaceId;
      const base = byId.get(id) || {};
      const name = base.name || item.displayName || item.workspaceKey || id;
      workspaces.push({
        ...base,
        id,
        workspaceKey: item.workspaceKey || id,
        name,
        description: base.description || item.description || 'Founder-created workspace registered through Founder OS.',
        purpose: base.purpose || (id === 'natural-nation' ? 'Plan, review, and build Natural Nation.' : 'Plan, review, and build this independent workspace.'),
        type: base.type || (id === 'natural-nation' ? 'Product Workspace' : 'Founder-Created Workspace'),
        roleLabel: base.roleLabel || (id === 'natural-nation' ? 'Builds the product' : 'Builds an independent product'),
        stage: base.stage || (item.status === 'active' ? 'Active' : 'Foundation'),
        status: item.status || base.status || 'foundation',
        health: base.health || item.health?.summary || 'Workspace foundation initialized',
        progress: Number(base.progress ?? (item.status === 'active' ? 52 : 15)),
        progressLabel: base.progressLabel || (item.status === 'active' ? 'Active workspace' : 'Foundation initialized'),
        pendingApprovals: Number(base.pendingApprovals || 0),
        nextAction: base.nextAction || (item.status === 'active' ? 'Review current product status' : 'Review the workspace foundation'),
        resumeWorkspace: base.resumeWorkspace || 'mission',
        modules: modulesFor(id)
      });
    }

    const founder = byId.get('founder-os');
    if (founder && !workspaces.some((item) => item.id === 'founder-os')) {
      workspaces.unshift({ ...founder, modules: modulesFor('founder-os') });
    }

    return {
      registryVersion: canonical?.schemaVersion || management?.registryVersion || '2.0.0',
      commandCenterMetrics: { ...(management?.commandCenterMetrics || {}), activeWorkspaces: workspaces.length },
      workspaces
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
    container.innerHTML = items.map(([label, value]) => `<div class="metric metric-enter"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  }

  function renderRegistry() {
    const list = $('[data-workspace-registry-list]');
    if (!list || !registry) return;
    $('[data-workspace-registry-count]')?.replaceChildren(document.createTextNode(`${registry.workspaces.length} areas`));
    const status = $('[data-workspace-registry-status]');
    if (status) status.textContent = 'Select Founder OS or any registered product workspace.';

    list.innerHTML = registry.workspaces.map((workspace, index) => {
      const approvals = workspace.pendingApprovals > 0 ? `${workspace.pendingApprovals} awaiting approval` : 'No approvals waiting';
      const productClass = workspace.id === 'founder-os' ? 'platform-workspace-card' : 'product-workspace-card';
      return `<article class="workspace-card card-enter ${productClass}" data-workspace-id="${esc(workspace.id)}" style="--card-order:${index}" tabindex="0" role="link" aria-label="Open ${esc(workspace.name)} workspace">
        <div class="workspace-card-purpose">${esc(workspace.roleLabel || workspace.type)}</div>
        <div class="workspace-card-top"><div><div class="eyebrow">${esc(workspace.type)}</div><h2>${esc(workspace.name)}</h2></div><span class="status">${esc(workspace.stage)}</span></div>
        <p>${esc(workspace.description)}</p>
        <div class="workspace-use-case"><span>Use this area to</span><strong>${esc(workspace.purpose)}</strong></div>
        <div class="workspace-progress"><div class="workspace-progress-copy"><span>Current state</span><strong>${esc(workspace.progressLabel)}</strong></div><div class="workspace-progress-track"><span style="width:${workspace.progress}%"></span></div></div>
        <div class="workspace-next-step"><span>Recommended next step</span><strong>${esc(workspace.nextAction)}</strong></div>
        <div class="workspace-card-footer"><span>${esc(approvals)}</span><span>${esc(workspace.health)}</span></div>
      </article>`;
    }).join('');

    window.dispatchEvent(new CustomEvent('founder-os:workspace-registry-rendered'));
  }

  function activateHome() {
    window.NNOSActiveWorkspace = null;
    $$('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === 'registry'));
    renderMetrics();
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', { detail: { workspace: null, target: 'registry' } }));
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = Promise.all([
      fetch(`${managementPath}&verify=041`, { cache: 'no-store' }),
      fetch(`${canonicalPath}&verify=041`, { cache: 'no-store' })
    ]).then(async ([managementResponse, canonicalResponse]) => {
      if (!managementResponse.ok) throw new Error(`Management registry returned ${managementResponse.status}`);
      if (!canonicalResponse.ok) throw new Error(`Canonical registry returned ${canonicalResponse.status}`);
      registry = merge(await managementResponse.json(), await canonicalResponse.json());
      renderRegistry();
      return registry;
    }).finally(() => { loadPromise = null; });
    return loadPromise;
  }

  function commitInitialHomeOnlyIfStillIdle() {
    if (initialHomeCommitted) return;
    initialHomeCommitted = true;
    const activeId = window.NNOSActiveWorkspace?.id;
    const activeView = document.body.dataset.activeWorkspace;
    if (activeId || (activeView && activeView !== 'registry')) return;
    activateHome();
  }

  window.addEventListener('founder-os:navigation-home-render-requested', activateHome);
  window.addEventListener('founder-os:workspace-created', async () => { await load(); activateHome(); });
  window.addEventListener('founder-os:canonical-blueprint-approved', load);

  window.NNOSWorkspaceRegistry = { load, render: renderRegistry, activateHome, getSnapshot: () => registry };

  load().then(commitInitialHomeOnlyIfStillIdle).catch((error) => {
    console.error(error);
    const status = $('[data-workspace-registry-status]');
    if (status) status.textContent = 'Founder OS could not load your work areas. Check repository status.';
  });
})();