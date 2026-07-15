(() => {
  const REGISTRY_URL = './config/ai-agent-registry.json';
  const STATE_URL = './config/ai-orchestration-state.json';
  const GATEWAY_URL = 'https://founder-os-gateway.dmoseley1024.workers.dev';

  let currentRegistry = null;
  let currentState = null;
  let providerStatus = null;

  const fetchJson = async (url) => {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  const statusLabel = (status) => ({
    ready: 'Ready to dispatch',
    waiting: 'Waiting',
    working: 'Provider accepted',
    complete: 'Result verified',
    blocked: 'Blocked',
    delivered: 'Provider accepted',
    dispatching: 'Recording handoff',
    'awaiting-configuration': 'Adapter unavailable',
    'delivery-failed': 'Delivery failed',
    'result-verified': 'Result verified',
    'ready-for-architecture': 'Ready for architecture',
    'in-progress': 'In progress'
  })[status] || status;

  function validateState(registry, state, workspace) {
    if (!workspace) throw new Error('Open a workspace to view its AI team.');
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

  function providerLabel(agent) {
    if (agent.provider === 'manual') return 'Manual Founder step';
    if (!providerStatus) return 'Checking adapter';
    return providerStatus[agent.provider] ? 'Adapter configured' : 'Adapter unavailable';
  }

  function renderAgent(agent, state) {
    const ownsCurrentWork = state.currentOwner === agent.id;
    return `
      <article class="module-card ${ownsCurrentWork ? 'active-agent-card' : ''}">
        <div class="workspace-card-top">
          <div><strong>${escapeHtml(agent.name)}</strong><p class="muted">${escapeHtml(agent.role)}</p></div>
          <span class="status">${escapeHtml(providerLabel(agent))}</span>
        </div>
        <p>${escapeHtml(agent.purpose)}</p>
        <p class="muted">${ownsCurrentWork ? 'Owns the current canonical step.' : 'Available for an assigned handoff.'}</p>
        <details class="founder-details"><summary>See responsibilities</summary><p class="muted">${escapeHtml(agent.allowedActions.join(', '))}</p></details>
      </article>`;
  }

  function renderTask(task, registry) {
    const owner = registry.agents.find((agent) => agent.id === task.owner);
    const next = registry.agents.find((agent) => agent.id === task.nextRole);
    const canDispatch = task.status === 'ready' && currentState.currentOwner === task.owner;
    const note = task.status === 'working'
      ? 'The provider accepted this task. It is not complete until a matching result is verified.'
      : task.status === 'blocked'
        ? task.blockedReason || 'The handoff could not start execution.'
        : '';

    return `
      <article class="module-card orchestration-task" data-task-id="${escapeHtml(task.id)}">
        <div class="workspace-card-top">
          <div><strong>${escapeHtml(task.title)}</strong><p class="muted">Owned by ${escapeHtml(owner?.name || task.owner)}</p></div>
          <span class="status">${escapeHtml(statusLabel(task.providerStatus || task.status))}</span>
        </div>
        <div class="record-row"><span>Needs</span><span>${escapeHtml(task.requiredInput)}</span></div>
        <div class="record-row"><span>Delivers</span><span>${escapeHtml(task.expectedOutput)}</span></div>
        <div class="record-row"><span>Then</span><span>${escapeHtml(next ? next.name : 'Founder decision complete')}</span></div>
        ${note ? `<p class="muted">${escapeHtml(note)}</p>` : ''}
        ${canDispatch ? `<button class="generate" type="button" data-start-ai-task="${escapeHtml(task.id)}">Validate and dispatch handoff</button>` : ''}
      </article>`;
  }

  async function loadCanonicalState(workspace) {
    const endpoint = `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`;
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (response.ok) {
      const body = await response.json();
      return body.state;
    }
    return fetchJson(STATE_URL);
  }

  async function dispatchTask(taskId) {
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace || !currentState) return;

    const task = currentState.tasks.find((item) => item.id === taskId);
    if (!task || task.status !== 'ready' || currentState.currentOwner !== task.owner) {
      window.alert('This task is no longer eligible for dispatch. Reloading canonical state.');
      await render();
      return;
    }

    const key = window.prompt('Enter your Founder Key to validate this handoff.');
    if (!key) return;

    const button = document.querySelector(`[data-start-ai-task="${CSS.escape(taskId)}"]`);
    if (button) {
      button.disabled = true;
      button.textContent = 'Validating handoff...';
    }

    const endpoint = `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(currentState.packageId)}/tasks/${encodeURIComponent(taskId)}/dispatch`;

    try {
      const dryRun = await fetch(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ dryRun: true })
      });
      const dryRunBody = await dryRun.json();
      if (!dryRun.ok || !dryRunBody.ok) {
        throw new Error(dryRunBody?.error?.message || 'The handoff validation failed.');
      }

      const confirmed = window.confirm(
        'Validation passed. This will record the handoff in GitHub and attempt delivery to the configured provider. It will not mark the task complete. Continue?'
      );
      if (!confirmed) return;

      if (button) button.textContent = 'Recording and delivering...';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ dryRun: false })
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body?.error?.message || 'The handoff could not be dispatched.');
      }

      window.alert(body.message || (
        body.dispatch?.executionConfirmed
          ? 'The provider accepted the task. Completion still requires a verified result.'
          : 'The handoff was recorded, but provider execution did not start.'
      ));
      await render();
    } catch (error) {
      window.alert(error.message || 'The handoff could not be dispatched.');
      await render();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Validate and dispatch handoff';
      }
    }
  }

  async function render() {
    const roles = document.querySelector('[data-ai-roles]');
    const handoffs = document.querySelector('[data-ai-handoffs]');
    if (!roles || !handoffs) return;

    const workspace = window.NNOSActiveWorkspace;
    if (!workspace) {
      roles.innerHTML = '<p class="muted">Open a workspace to see its AI team.</p>';
      handoffs.innerHTML = '<p class="muted">No workspace selected.</p>';
      return;
    }

    if (workspace.id !== 'natural-nation' || !workspace.activePackageId) {
      roles.innerHTML = '<p class="muted">No product execution package is assigned to this workspace.</p>';
      handoffs.innerHTML = '<article class="module-card"><strong>No active orchestration chain</strong><p>Founder OS management work is reviewed through its own platform backlog.</p></article>';
      return;
    }

    roles.innerHTML = '<p class="muted">Loading the AI team...</p>';
    handoffs.innerHTML = '<p class="muted">Loading canonical work status...</p>';

    try {
      const [registry, state, providersResponse] = await Promise.all([
        fetchJson(REGISTRY_URL),
        loadCanonicalState(workspace),
        fetch(`${GATEWAY_URL}/v1/ai/providers`, { cache: 'no-store' })
          .then((response) => response.ok ? response.json() : null)
          .catch(() => null)
      ]);

      validateState(registry, state, workspace);
      currentRegistry = registry;
      currentState = state;
      providerStatus = providersResponse?.providers || null;

      roles.innerHTML = registry.agents.map((agent) => renderAgent(agent, state)).join('');
      handoffs.innerHTML = `
        <article class="glass-panel orchestration-summary">
          <div class="eyebrow">Current Build</div>
          <div class="section-title">${escapeHtml(state.packageId)}</div>
          <p>${escapeHtml(registry.agents.find((agent) => agent.id === state.currentOwner)?.name || state.currentOwner)} owns the current canonical step.</p>
          <div class="record-row"><span>Workflow status</span><strong>${escapeHtml(statusLabel(state.status))}</strong></div>
          <div class="record-row"><span>Next handoff</span><strong>${escapeHtml(registry.agents.find((agent) => agent.id === state.nextOwner)?.name || state.nextOwner || 'None')}</strong></div>
        </article>
        <div class="orchestration-task-list">${state.tasks.map((task) => renderTask(task, registry)).join('')}</div>`;
    } catch (error) {
      console.error(error);
      roles.innerHTML = '<p class="muted">The AI team could not be loaded.</p>';
      handoffs.innerHTML = `<article class="module-card"><strong>Needs attention</strong><p>${escapeHtml(error.message)}</p></article>`;
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-start-ai-task]');
    if (button) dispatchTask(button.dataset.startAiTask);
  });

  window.NNOSAIOrchestration = { reload: render, dispatchTask };
  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'ai') render();
  });
  render();
})();
