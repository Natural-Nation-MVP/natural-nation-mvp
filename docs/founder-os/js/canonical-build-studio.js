(() => {
  const packagePath = '../execution-packages/NN-BUILD-001.json';
  const registryPath = './config/ai-agent-registry.json';
  const githubPackageUrl = 'https://github.com/Natural-Nation-MVP/natural-nation-mvp/blob/main/docs/execution-packages/NN-BUILD-001.json';
  const gatewayUrl = 'https://founder-os-gateway.dmoseley1024.workers.dev';

  let canonicalPackage = null;
  let orchestrationState = null;
  let agentRegistry = null;
  let packageAvailable = false;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function isNaturalNationActive() {
    return window.NNOSActiveWorkspace?.id === 'natural-nation';
  }

  function role(roleId) {
    return agentRegistry?.agents?.find((agent) => agent.id === roleId) || null;
  }

  function statusLabel(status) {
    return ({
      ready: 'Ready to run',
      waiting: 'Waiting',
      working: 'Provider accepted',
      complete: 'Result verified',
      completed: 'Result verified',
      blocked: 'Blocked',
      dispatching: 'Recording handoff',
      'result-verified': 'Result verified',
      'ready-for-architecture': 'Ready for architecture',
      'in-progress': 'In progress'
    })[status] || status || 'Unknown';
  }

  function currentTask() {
    if (!orchestrationState) return null;
    return orchestrationState.tasks.find((task) => task.owner === orchestrationState.currentOwner && ['ready', 'working', 'blocked'].includes(task.status))
      || orchestrationState.tasks.find((task) => task.status === 'ready')
      || orchestrationState.tasks.find((task) => task.status === 'working')
      || null;
  }

  function ensureReferenceAction() {
    const stack = $('.right-rail .action-stack');
    if (!stack || stack.querySelector('[data-action="view-package"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = 'view-package';
    button.textContent = 'View Canonical Package';
    stack.appendChild(button);
  }

  function setPrimaryAction(label, disabled = false) {
    $$('[data-action="generate"]').forEach((button) => {
      button.disabled = disabled;
      button.textContent = label;
    });
    $$('[data-action="validate"], [data-action="export-md"], [data-action="export-json"]').forEach((button) => {
      button.hidden = true;
      button.disabled = true;
    });
    ensureReferenceAction();
    const reference = $('[data-action="view-package"]');
    if (reference) reference.disabled = !packageAvailable;
  }

  function clearQueue() {
    const queue = $('[data-build-queue]');
    if (queue) queue.innerHTML = '';
  }

  function renderUnscoped() {
    packageAvailable = false;
    canonicalPackage = null;
    orchestrationState = null;
    clearQueue();
    setText('[data-selected-id]', 'No Workspace Build Selected');
    setText('[data-selected-title]', 'Build work is scoped to its owning workspace.');
    setText('[data-selected-meta]', 'Open Natural Nation to view its live work state.');
    setText('[data-validation-status]', 'No live task is available outside the owning workspace.');
    setText('[data-build-approval]', 'Workspace Required');
    setText('[data-approval]', 'Workspace Required');
    setText('[data-bottom-target]', 'Build Team');
    setText('[data-delivery]', 'Open Natural Nation');
    clearAssignedRole();
    setPrimaryAction('No Live Task', true);
  }

  function renderBlocked(reason) {
    orchestrationState = null;
    clearQueue();
    setText('[data-selected-id]', canonicalPackage?.packageId || 'NN-BUILD-001');
    setText('[data-selected-title]', 'Live build status unavailable');
    setText('[data-selected-meta]', 'The package reference loaded, but the Gateway orchestration state did not.');
    setText('[data-validation-status]', reason);
    setText('[data-build-approval]', 'Needs Attention');
    setText('[data-approval]', 'Needs Attention');
    setText('[data-bottom-target]', 'Gateway');
    setText('[data-delivery]', 'Restore live state');
    clearAssignedRole();
    setPrimaryAction('Live Task Unavailable', true);
  }

  function clearAssignedRole() {
    const target = $('[data-target-buttons]');
    const plan = $('[data-role-plan]');
    if (target) target.innerHTML = '';
    if (plan) plan.innerHTML = '';
  }

  function renderAssignedRole(task) {
    const owner = role(task.owner);
    const next = role(task.nextRole);
    const target = $('[data-target-buttons]');
    const plan = $('[data-role-plan]');
    if (target) target.innerHTML = `<span class="pill">${esc(owner?.name || task.owner)}</span>`;
    if (plan) plan.innerHTML = `<p><strong>Current:</strong> ${esc(owner?.name || task.owner)}</p><p class="muted">Next: ${esc(next?.name || task.nextRole || 'Founder completion')}</p>`;
  }

  function renderQueue(state) {
    const queue = $('[data-build-queue]');
    if (!queue) return;
    queue.innerHTML = state.tasks.map((task) => {
      const owner = role(task.owner);
      const active = task.id === currentTask()?.id;
      return `<button class="queue-item ${active ? 'active' : ''}" type="button" disabled>
        <span class="queue-top"><strong>${esc(task.id)}</strong><span class="status">${esc(statusLabel(task.providerStatus || task.status))}</span></span>
        <span>${esc(task.title)}</span>
        <small>${esc(owner?.name || task.owner)} · then ${esc(role(task.nextRole)?.name || task.nextRole || 'complete')}</small>
      </button>`;
    }).join('');
  }

  function renderLive(pkg, registry, state) {
    if (!isNaturalNationActive()) return renderUnscoped();
    canonicalPackage = pkg;
    agentRegistry = registry;
    orchestrationState = state;
    packageAvailable = true;

    const task = currentTask();
    const owner = task ? role(task.owner) : null;
    const next = task ? role(task.nextRole) : null;

    setText('[data-selected-id]', pkg.packageId);
    setText('[data-selected-title]', task?.title || 'Build workflow complete');
    setText('[data-selected-meta]', task
      ? `Current owner: ${owner?.name || task.owner} · Task: ${task.id} · Status: ${statusLabel(task.providerStatus || task.status)}`
      : `Package ${pkg.packageId} · No active AI task`);
    setText('[data-validation-status]', task
      ? `Live Gateway state loaded. ${owner?.name || task.owner} owns the current canonical step.`
      : 'All recorded orchestration tasks are complete.');
    setText('[data-build-approval]', task?.status === 'ready' ? 'Ready to Run' : statusLabel(task?.providerStatus || task?.status || state.status));
    setText('[data-approval]', task?.status === 'ready' ? 'Ready to Run' : statusLabel(task?.providerStatus || task?.status || state.status));
    setText('[data-bottom-target]', owner?.name || task?.owner || 'Founder');
    setText('[data-delivery]', task ? `${next?.name || task.nextRole || 'Founder'} is next` : 'Workflow complete');
    setText('[data-execution-order]', 'Architecture → Build → Review → Founder');

    if (task) renderAssignedRole(task);
    else clearAssignedRole();

    const preview = $('[data-package-preview]');
    if (preview) preview.textContent = JSON.stringify({ package: pkg, liveOrchestration: state }, null, 2);

    renderQueue(state);

    const history = $('[data-package-history]');
    if (history) history.innerHTML = `<div class="record-row"><span>Live orchestration updated ${esc(state.updatedAt || 'now')}</span><span class="status">${esc(statusLabel(state.status))}</span></div>`;

    const canDispatch = task?.status === 'ready' && state.currentOwner === task.owner;
    setPrimaryAction(canDispatch ? 'Validate and Run Current Task →' : statusLabel(task?.providerStatus || task?.status || state.status), !canDispatch);
  }

  async function fetchJson(url) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}.`);
    return response.json();
  }

  async function loadLiveBuild() {
    if (!isNaturalNationActive()) {
      renderUnscoped();
      return null;
    }

    try {
      const workspace = window.NNOSActiveWorkspace;
      const stateUrl = `${gatewayUrl}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`;
      const [pkg, registry, stateBody] = await Promise.all([
        fetchJson(packagePath),
        fetchJson(registryPath),
        fetchJson(stateUrl)
      ]);

      if (pkg?.packageId !== workspace.activePackageId || pkg?.workspaceId !== workspace.id || pkg?.status !== 'ready') {
        throw new Error('The canonical package does not match the active Natural Nation workspace.');
      }
      if (stateBody?.state?.workspaceId !== workspace.id || stateBody?.state?.packageId !== pkg.packageId) {
        throw new Error('The Gateway returned orchestration state for a different workspace or package.');
      }

      renderLive(pkg, registry, stateBody.state);
      return stateBody.state;
    } catch (error) {
      renderBlocked(error.message || 'Live orchestration state could not be loaded.');
      return null;
    }
  }

  async function runCurrentTask() {
    const task = currentTask();
    if (!task || task.status !== 'ready' || orchestrationState?.currentOwner !== task.owner) return;
    if (!window.NNOSAIOrchestration?.dispatchTask) {
      window.alert('The live orchestration controls are still loading. Please try again in a moment.');
      return;
    }
    await window.NNOSAIOrchestration.dispatchTask(task.id);
    await loadLiveBuild();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    if (button.dataset.action === 'generate') {
      event.preventDefault();
      event.stopImmediatePropagation();
      runCurrentTask();
    }

    if (button.dataset.action === 'view-package') {
      event.preventDefault();
      window.open(githubPackageUrl, '_blank', 'noopener');
    }
  }, true);

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'build') loadLiveBuild();
    else if (event.detail?.workspace?.id !== 'natural-nation') renderUnscoped();
  });
  window.addEventListener('founder-os:canonical-blueprint-approved', loadLiveBuild);

  window.NNOSCanonicalBuild = {
    reload: loadLiveBuild,
    runCurrentTask,
    get package() { return canonicalPackage; },
    get state() { return orchestrationState; }
  };

  renderUnscoped();
})();