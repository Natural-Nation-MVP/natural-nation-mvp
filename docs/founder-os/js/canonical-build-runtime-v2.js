(() => {
  const paths = window.NNOSPaths;
  const packageUrl = paths.site('execution-packages/NN-BUILD-001.json');
  const registryUrl = paths.asset('config/ai-agent-registry.json');
  const gatewayBase = 'https://founder-os-gateway.dmoseley1024.workers.dev';

  let pkg = null;
  let registry = null;
  let state = null;

  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
  const roleName = (id) => registry?.agents?.find((agent) => agent.id === id)?.name || id || 'Complete';
  const statusLabel = (value) => ({ complete: 'Result verified', completed: 'Result verified', ready: 'Ready to run', waiting: 'Waiting', working: 'Provider accepted', blocked: 'Blocked', 'result-verified': 'Result verified', 'founder-approved': 'Founder approved' })[value] || value || 'Unknown';

  async function fetchJson(url) {
    const separator = url.includes('?') ? '&' : '?';
    const requestedUrl = `${url}${separator}sprint128=${Date.now()}`;
    const response = await fetch(requestedUrl, { cache: 'no-store', headers: url.startsWith(gatewayBase) ? { 'x-founder-os-workspace': 'natural-nation' } : undefined });
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    const text = await response.text();
    let body = null;
    if (contentType.includes('application/json')) {
      try { body = text ? JSON.parse(text) : {}; } catch { throw new Error(`Unreadable JSON from ${response.url}.`); }
    }
    if (!response.ok || !body) {
      const message = body?.error?.message || `HTTP ${response.status}; content-type ${contentType || 'missing'}; requested ${requestedUrl}; final ${response.url}`;
      throw new Error(message);
    }
    return body;
  }

  function renderQueue() {
    const queue = $('[data-build-queue]');
    if (!queue) return;
    queue.innerHTML = state.tasks.map((task) => `<button class="queue-item" type="button" data-task-id="${esc(task.id)}"><span class="queue-top"><strong>${esc(task.id)}</strong><span class="status">${esc(statusLabel(task.providerStatus || task.status))}</span></span><span>${esc(task.title)}</span><small>${esc(roleName(task.owner))} · then ${esc(roleName(task.nextRole))}</small></button>`).join('');
  }

  function renderLive() {
    const current = state.tasks.find((task) => ['ready', 'working', 'blocked'].includes(task.status)) || null;
    setText('[data-selected-id]', pkg.packageId);
    setText('[data-selected-title]', current?.title || 'Build workflow complete');
    setText('[data-selected-meta]', current ? `Current owner: ${roleName(current.owner)} · Task: ${current.id}` : `Package ${pkg.packageId} · All orchestration tasks are complete`);
    setText('[data-validation-status]', current ? `Live Gateway state loaded. ${roleName(current.owner)} owns the current canonical step.` : 'All recorded orchestration tasks are complete. Select a task to review its evidence and history.');
    setText('[data-build-approval]', current?.status === 'blocked' ? 'Needs Attention' : 'Verified');
    setText('[data-approval]', current?.status === 'blocked' ? 'Needs Attention' : 'Verified');
    setText('[data-bottom-target]', current ? roleName(current.owner) : 'Founder');
    setText('[data-delivery]', current ? 'Continue live task' : 'Review completed work');
    const assigned = $('[data-target-buttons]');
    if (assigned) assigned.innerHTML = `<span class="pill">${esc(current ? roleName(current.owner) : 'Founder')}</span>`;
    const plan = $('[data-role-plan]');
    if (plan) plan.innerHTML = current ? `<p><strong>Current:</strong> ${esc(roleName(current.owner))}</p><p class="muted">Next: ${esc(roleName(current.nextRole))}</p>` : '<p><strong>Status:</strong> Complete</p><p class="muted">All five canonical tasks are recorded.</p>';
    document.querySelectorAll('[data-action="generate"]').forEach((button) => { button.disabled = true; button.textContent = current ? statusLabel(current.status) : 'Build Complete'; });
    renderQueue();
  }

  function renderFailure(error) {
    setText('[data-selected-title]', 'Live build status unavailable');
    setText('[data-selected-meta]', 'The package reference loaded, but the Gateway orchestration state did not.');
    setText('[data-validation-status]', error.message || 'Live orchestration state could not be loaded.');
    const queue = $('[data-build-queue]');
    if (queue) queue.innerHTML = '';
  }

  async function reload() {
    if (window.NNOSActiveWorkspace?.id !== 'natural-nation') return null;
    try {
      const workspace = window.NNOSActiveWorkspace;
      const stateUrl = `${gatewayBase}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`;
      const [loadedPackage, loadedRegistry, stateBody] = await Promise.all([fetchJson(packageUrl), fetchJson(registryUrl), fetchJson(stateUrl)]);
      if (loadedPackage.packageId !== workspace.activePackageId || stateBody?.state?.packageId !== loadedPackage.packageId) throw new Error('The live package and orchestration identifiers do not match.');
      pkg = loadedPackage;
      registry = loadedRegistry;
      state = stateBody.state;
      renderLive();
      return state;
    } catch (error) {
      renderFailure(error);
      return null;
    }
  }

  window.NNOSCanonicalBuild = {
    reload,
    get package() { return pkg; },
    get registry() { return registry; },
    get state() { return state; }
  };

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'build') reload();
  });
})();