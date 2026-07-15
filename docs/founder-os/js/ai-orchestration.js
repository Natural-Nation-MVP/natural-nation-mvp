(() => {
  const REGISTRY_URL = './config/ai-agent-registry.json';
  const STATE_URL = './config/ai-orchestration-state.json';

  const fetchJson = async (url) => {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const statusLabel = (status) => ({
    ready: 'Ready now',
    waiting: 'Waiting',
    working: 'In progress',
    complete: 'Complete',
    blocked: 'Blocked'
  })[status] || status;

  function validateState(registry, state, workspace) {
    if (!workspace) throw new Error('Open a workspace to view its build team.');
    if (state.workspaceId !== workspace.id) throw new Error('This work belongs to another workspace.');
    if (workspace.activePackageId && state.packageId !== workspace.activePackageId) {
      throw new Error('The active build package does not match this work.');
    }
    const agentIds = new Set(registry.agents.map((agent) => agent.id));
    for (const task of state.tasks) {
      if (task.workspaceId !== state.workspaceId || task.packageId !== state.packageId) {
        throw new Error('A task is not scoped to the active workspace and package.');
      }
      if (!agentIds.has(task.owner)) throw new Error(`Unknown task owner: ${task.owner}`);
      if (task.nextRole && !agentIds.has(task.nextRole)) throw new Error(`Unknown next role: ${task.nextRole}`);
    }
  }

  function renderAgent(agent, state) {
    const ownsCurrentWork = state.currentOwner === agent.id;
    return `
      <article class="module-card ${ownsCurrentWork ? 'active-agent-card' : ''}">
        <div class="workspace-card-top">
          <div><strong>${escapeHtml(agent.name)}</strong><p class="muted">${escapeHtml(agent.role)}</p></div>
          <span class="status">${ownsCurrentWork ? 'Working now' : 'Available'}</span>
        </div>
        <p>${escapeHtml(agent.purpose)}</p>
        <details class="founder-details"><summary>See responsibilities</summary><p class="muted">${escapeHtml(agent.allowedActions.join(', '))}</p></details>
      </article>`;
  }

  function renderTask(task, registry) {
    const owner = registry.agents.find((agent) => agent.id === task.owner);
    const next = registry.agents.find((agent) => agent.id === task.nextRole);
    return `
      <article class="module-card orchestration-task" data-task-id="${escapeHtml(task.id)}">
        <div class="workspace-card-top">
          <div><strong>${escapeHtml(task.title)}</strong><p class="muted">Owned by ${escapeHtml(owner?.name || task.owner)}</p></div>
          <span class="status">${escapeHtml(statusLabel(task.status))}</span>
        </div>
        <div class="record-row"><span>Needs</span><span>${escapeHtml(task.requiredInput)}</span></div>
        <div class="record-row"><span>Delivers</span><span>${escapeHtml(task.expectedOutput)}</span></div>
        <div class="record-row"><span>Then</span><span>${escapeHtml(next ? next.name : 'Founder decision complete')}</span></div>
      </article>`;
  }

  async function render() {
    const roles = document.querySelector('[data-ai-roles]');
    const handoffs = document.querySelector('[data-ai-handoffs]');
    if (!roles || !handoffs) return;

    const workspace = window.NNOSActiveWorkspace;
    if (!workspace) {
      roles.innerHTML = '<p class="muted">Open a workspace to see its build team.</p>';
      handoffs.innerHTML = '<p class="muted">No workspace selected.</p>';
      return;
    }

    roles.innerHTML = '<p class="muted">Loading the build team...</p>';
    handoffs.innerHTML = '<p class="muted">Loading current work...</p>';

    try {
      const [registry, state] = await Promise.all([fetchJson(REGISTRY_URL), fetchJson(STATE_URL)]);
      validateState(registry, state, workspace);
      roles.innerHTML = registry.agents.map((agent) => renderAgent(agent, state)).join('');
      handoffs.innerHTML = `
        <article class="glass-panel orchestration-summary">
          <div class="eyebrow">Current Build</div>
          <div class="section-title">${escapeHtml(state.packageId)}</div>
          <p>${escapeHtml(registry.agents.find((agent) => agent.id === state.currentOwner)?.name || state.currentOwner)} owns the next step.</p>
          <div class="record-row"><span>Next handoff</span><strong>${escapeHtml(registry.agents.find((agent) => agent.id === state.nextOwner)?.name || state.nextOwner)}</strong></div>
        </article>
        <div class="orchestration-task-list">${state.tasks.map((task) => renderTask(task, registry)).join('')}</div>`;
    } catch (error) {
      console.error(error);
      roles.innerHTML = '<p class="muted">The build team could not be loaded.</p>';
      handoffs.innerHTML = `<article class="module-card"><strong>Needs attention</strong><p>${escapeHtml(error.message)}</p></article>`;
    }
  }

  window.NNOSAIOrchestration = { reload: render };
  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'ai') render();
  });
  render();
})();
