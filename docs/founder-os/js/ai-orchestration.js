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
    ready: 'Ready to dispatch', waiting: 'Waiting', working: 'Provider accepted', complete: 'Result verified', completed: 'Result verified',
    blocked: 'Blocked', delivered: 'Provider accepted', dispatching: 'Recording handoff', 'awaiting-configuration': 'Provider unavailable',
    'delivery-failed': 'Delivery failed', 'verification-failed': 'Verification failed', 'result-verified': 'Result verified',
    'ready-for-architecture': 'Ready for architecture', 'in-progress': 'In progress'
  })[status] || status;

  function validateState(registry, state, workspace) {
    if (!workspace) throw new Error('Open a workspace to view its AI team.');
    if (state.workspaceId !== workspace.id) throw new Error('This work belongs to another workspace.');
    if (workspace.activePackageId && state.packageId !== workspace.activePackageId) throw new Error('The active build package does not match this work.');

    const agentIds = new Set(registry.agents.map((agent) => agent.id));
    for (const task of state.tasks) {
      if (task.workspaceId !== state.workspaceId || task.packageId !== state.packageId) throw new Error('A task is not scoped to the active workspace and package.');
      if (!agentIds.has(task.owner)) throw new Error(`Unknown task owner: ${task.owner}`);
      if (task.nextRole && !agentIds.has(task.nextRole)) throw new Error(`Unknown next role: ${task.nextRole}`);
    }
  }

  function providerLabel(agent) {
    if (agent.provider === 'manual') return 'Manual Founder step';
    if (!providerStatus) return 'Checking provider';
    return providerStatus[agent.provider] ? 'Provider configured' : 'Provider unavailable';
  }

  function renderAgent(agent, state) {
    const ownsCurrentWork = state.currentOwner === agent.id;
    return `<article class="module-card ${ownsCurrentWork ? 'active-agent-card' : ''}" data-ai-agent="${escapeHtml(agent.id)}" data-current-owner="${ownsCurrentWork}">
      <div class="workspace-card-top"><div><strong>${escapeHtml(agent.name)}</strong><p class="muted">${escapeHtml(agent.role)}</p></div><span class="status">${escapeHtml(providerLabel(agent))}</span></div>
      <p>${escapeHtml(agent.purpose)}</p><p class="muted">${ownsCurrentWork ? 'Owns the current canonical step.' : 'Available for an assigned handoff.'}</p>
      <div class="record-row"><span>Role identity</span><strong>Permanent</strong></div>
      <div class="record-row"><span>Execution provider</span><strong>${escapeHtml(agent.provider === 'manual' ? 'Founder' : agent.provider)}</strong></div>
      <details class="founder-details"><summary>See responsibilities</summary><p class="muted">${escapeHtml(agent.allowedActions.join(', '))}</p><p class="muted">Founder gates: ${escapeHtml((agent.requiresFounderApprovalFor || []).join(', ') || 'None')}</p></details>
    </article>`;
  }

  function renderTask(task, registry) {
    const owner = registry.agents.find((agent) => agent.id === task.owner);
    const next = registry.agents.find((agent) => agent.id === task.nextRole);
    const isCurrent = currentState.currentOwner === task.owner;
    const canDispatch = task.status === 'ready' && isCurrent;
    const canReset = task.status === 'blocked' && isCurrent;
    const note = task.status === 'working'
      ? 'The provider accepted this task. A verified result is still required before completion.'
      : task.status === 'blocked'
        ? task.blockedReason || 'The handoff could not start execution.'
        : '';

    return `<article class="module-card orchestration-task" data-task-id="${escapeHtml(task.id)}" data-task-status="${escapeHtml(task.status)}">
      <div class="workspace-card-top"><div><strong>${escapeHtml(task.title)}</strong><p class="muted">Owned by ${escapeHtml(owner?.name || task.owner)}</p></div><span class="status">${escapeHtml(statusLabel(task.providerStatus || task.status))}</span></div>
      <div class="record-row"><span>Needs</span><span>${escapeHtml(task.requiredInput)}</span></div>
      <div class="record-row"><span>Delivers</span><span>${escapeHtml(task.expectedOutput)}</span></div>
      <div class="record-row"><span>Then</span><span>${escapeHtml(next ? next.name : 'Founder decision complete')}</span></div>
      ${task.executionProviderOverride ? `<div class="record-row"><span>Temporary provider</span><strong>${escapeHtml(task.executionProviderOverride)} · one request</strong></div>` : ''}
      ${note ? `<p class="muted">${escapeHtml(note)}</p>` : ''}
      ${canDispatch ? `<button class="generate" type="button" data-start-ai-task="${escapeHtml(task.id)}">Validate and run task</button>` : ''}
      ${canReset ? `<button class="secondary-action" type="button" data-reset-ai-task="${escapeHtml(task.id)}">Retry current task safely</button>` : ''}
    </article>`;
  }

  async function loadCanonicalState(workspace) {
    const endpoint = `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`;
    try {
      const response = await fetch(`${endpoint}?v=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) return (await response.json()).state;
    } catch (error) {
      console.warn('Live orchestration state unavailable; using the governed local snapshot.', error);
    }
    return fetchJson(STATE_URL);
  }

  async function responseBody(response) {
    const text = await response.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch { return { error: { message: text } }; }
  }

  function founderKey() {
    const key = window.prompt('Enter your Founder Key to authorize this protected action.');
    return key || null;
  }

  async function resetTask(taskId) {
    const workspace = window.NNOSActiveWorkspace;
    const task = currentState?.tasks?.find((item) => item.id === taskId);
    if (!workspace || !task || task.status !== 'blocked' || currentState.currentOwner !== task.owner) {
      await render();
      throw new Error('Only the current blocked task can be reset. Canonical state was refreshed.');
    }

    const key = founderKey();
    if (!key) return { cancelled: true };
    const confirmed = window.confirm('Reset only this blocked task for a clean retry? Completed upstream work and failure history will be preserved.');
    if (!confirmed) return { cancelled: true };

    window.NNOSProcessing?.start({ title: 'Resetting blocked task', message: 'Founder OS is preserving completed work and preparing a clean retry.', stage: 'Recovery' });
    const endpoint = `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(currentState.packageId)}/tasks/${encodeURIComponent(taskId)}/reset`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ reason: task.blockedReason || 'Founder-authorized retry after resilience review' })
    });
    const body = await responseBody(response);
    if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'The task reset failed.');
    await render();
    window.NNOSProcessing?.success({ title: 'Task ready for retry', message: 'The blocked task was reset without changing completed upstream work.', stage: 'Ready' });
    return body;
  }

  async function dispatchTask(taskId) {
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace || !currentState) throw new Error('The canonical workspace state is not loaded.');
    const task = currentState.tasks.find((item) => item.id === taskId);
    if (!task || task.status !== 'ready' || currentState.currentOwner !== task.owner) {
      await render();
      throw new Error('This task is no longer eligible for dispatch. The canonical state has been refreshed.');
    }

    const key = founderKey();
    if (!key) return { cancelled: true };
    const button = document.querySelector(`[data-start-ai-task="${CSS.escape(taskId)}"]`);
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'Validating task…'; }
    const endpoint = `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(currentState.packageId)}/tasks/${encodeURIComponent(taskId)}/dispatch`;

    try {
      window.NNOSProcessing?.update({ title: 'Validating current task', message: 'Checking Founder authorization, ownership, package scope, and provider readiness.', stage: 'Validation' });
      const dryRun = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ dryRun: true }) });
      const dryRunBody = await responseBody(dryRun);
      if (!dryRun.ok || !dryRunBody.ok) throw new Error(dryRunBody?.error?.message || 'The handoff validation failed.');

      const confirmed = window.confirm('Validation passed. This will record the handoff in GitHub and call the configured provider. Direct providers may complete and record the task during this request. Continue?');
      if (!confirmed) return { cancelled: true };
      window.NNOSProcessing?.update({ title: 'Running provider task', message: 'The Gateway is recording the handoff and waiting for a verified repository result.', stage: 'Provider execution' });
      if (button) button.textContent = 'Running provider task…';

      const response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ dryRun: false }) });
      const body = await responseBody(response);
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'The handoff could not be dispatched.');
      await render();
      return body;
    } finally {
      if (button) { button.disabled = false; button.setAttribute('aria-busy', 'false'); button.textContent = 'Validate and run task'; }
    }
  }

  function activeControlTask() {
    const tasks = Array.isArray(currentState?.tasks) ? currentState.tasks : [];
    return tasks.find((task) => task.owner === currentState.currentOwner && !['complete', 'completed', 'founder-approved', 'rejected'].includes(task.status)) || null;
  }

  function teamControlPanel(state, registry) {
    const task = activeControlTask();
    const owner = registry.agents.find((agent) => agent.id === task?.owner);
    const hasAiTask = Boolean(task && task.owner !== 'founder');
    const blocked = hasAiTask && task.status === 'blocked';
    const canReview = hasAiTask && ['ready', 'working', 'blocked'].includes(task.status);
    return `
      <article class="glass-panel ai-team-controls" data-ai-team-controls>
        <div class="eyebrow">Founder Controls</div>
        <div class="section-title">Governed AI Team Actions</div>
        <p class="muted">${task ? `${escapeHtml(owner?.name || task.owner)} owns ${escapeHtml(task.title)}. Every change requires your Founder Key and is recorded in canonical history.` : 'No active AI-owned task is available. Controls are safely unavailable.'}</p>
        <div class="record-row"><span>Role identity</span><strong>${task ? 'Permanent' : 'No active role'}</strong></div>
        <div class="record-row"><span>Provider override</span><strong>${escapeHtml(task?.executionProviderOverride ? `${task.executionProviderOverride} · one request` : 'None')}</strong></div>
        <div class="approval-actions" aria-label="Governed AI Team controls">
          <button type="button" data-ai-control="open" ${task ? '' : 'disabled'}>Open task</button>
          <button type="button" data-ai-control="retry" ${blocked ? '' : 'disabled'}>Retry safely</button>
          <button type="button" data-ai-control="handoff" ${hasAiTask ? '' : 'disabled'}>Handoff</button>
          <button type="button" data-ai-control="reassign" ${hasAiTask ? '' : 'disabled'}>Reassign</button>
          <button type="button" data-ai-control="provider_switch" ${hasAiTask ? '' : 'disabled'}>Switch provider</button>
          <button type="button" class="generate" data-ai-control="submit_review" ${canReview ? '' : 'disabled'}>Submit for Founder review</button>
        </div>
        <p class="muted">Provider switches apply to one request only. They never rename or replace the assigned AI role.</p>
      </article>`;
  }

  async function applyTeamControl(action) {
    const task = activeControlTask();
    if (!task) throw new Error('No active AI-owned task is available. Refresh the AI Team Monitor.');
    if (action === 'open') {
      window.dispatchEvent(new CustomEvent('founder-os:task-detail-requested', { detail: { taskId: task.id } }));
      return;
    }
    if (action === 'retry') return resetTask(task.id);

    let targetRole = '';
    let provider = '';
    if (action === 'handoff' || action === 'reassign') {
      targetRole = String(window.prompt('Enter the AI role: art, codex, gemini, or gpose.') || '').trim().toLowerCase();
      if (!targetRole) return { cancelled: true };
    }
    if (action === 'provider_switch') {
      provider = String(window.prompt('Enter the temporary provider: openai or google.') || '').trim().toLowerCase();
      if (!provider) return { cancelled: true };
    }
    const note = String(window.prompt('Add the reason and expected outcome for this governed control.') || '').trim();
    if (!note) throw new Error('A Founder note is required.');
    if (!window.confirm(`Record ${action.replace('_', ' ')} for ${task.title}?`)) return { cancelled: true };
    const key = founderKey();
    if (!key) return { cancelled: true };

    window.NNOSProcessing?.update({ title: 'Recording AI Team control', message: 'Validating canonical ownership, task state, and workspace scope.', stage: 'AI Team' });
    const workspace = window.NNOSActiveWorkspace;
    const endpoint = `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(currentState.packageId)}/tasks/${encodeURIComponent(task.id)}/control`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ action, note, targetRole, provider, expectedUpdatedAt: currentState.updatedAt })
    });
    const body = await responseBody(response);
    if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'The AI Team control was rejected.');
    await render();
    window.NNOSProcessing?.success({ title: 'AI Team control recorded', message: `${task.title} was updated in canonical state.`, stage: 'Recorded' });
    window.dispatchEvent(new CustomEvent('founder-os:ai-team-control-recorded', { detail: { taskId: task.id, action } }));
    return body;
  }

  function monitorSummary(state, registry) {
    const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
    const currentTask = tasks.find((task) => task.owner === state.currentOwner && !['complete', 'completed', 'founder-approved'].includes(task.status));
    const blocked = tasks.filter((task) => task.status === 'blocked').length;
    const approvals = tasks.filter((task) => task.owner === 'founder' && !['complete', 'completed', 'founder-approved', 'rejected'].includes(task.status)).length;
    const configuredProviders = providerStatus ? Object.values(providerStatus).filter(Boolean).length : 0;
    const totalProviders = providerStatus ? Object.keys(providerStatus).length : 0;
    const owner = registry.agents.find((agent) => agent.id === state.currentOwner);
    return `
      <article class="glass-panel ai-monitor-summary" data-ai-monitor-summary>
        <div class="ai-monitor-heading">
          <div><div class="eyebrow">AI Team Monitor</div><div class="section-title">Live Work Status</div></div>
          <button type="button" data-ai-refresh>Refresh</button>
        </div>
        <div class="ai-monitor-metrics">
          <div><small>Current owner</small><strong data-ai-current-owner>${escapeHtml(owner?.name || state.currentOwner)}</strong></div>
          <div><small>Current task</small><strong data-ai-current-task>${escapeHtml(currentTask?.title || 'No active task')}</strong></div>
          <div><small>Blocked</small><strong data-ai-blocked-count>${blocked}</strong></div>
          <div><small>Founder decisions</small><strong data-ai-approval-count>${approvals}</strong></div>
        </div>
        <p class="muted" data-ai-provider-health>Providers configured: ${configuredProviders} of ${totalProviders}. Canonical package: ${escapeHtml(state.packageId)}.</p>
      </article>`;
  }

  function orderMonitorPanels(roles, handoffs) {
    const rolesPanel = roles.closest('article');
    const workPanel = handoffs.closest('article');
    const parent = rolesPanel?.parentElement;
    if (!parent || workPanel?.parentElement !== parent) return;
    if (window.matchMedia('(max-width: 640px)').matches) {
      if (workPanel.nextElementSibling !== rolesPanel) parent.insertBefore(workPanel, rolesPanel);
    } else if (rolesPanel.nextElementSibling !== workPanel) {
      parent.insertBefore(rolesPanel, workPanel);
    }
  }

  async function render() {
    const roles = document.querySelector('[data-ai-roles]');
    const handoffs = document.querySelector('[data-ai-handoffs]');
    if (!roles || !handoffs) return currentState;
    orderMonitorPanels(roles, handoffs);
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace) { roles.innerHTML = '<p class="muted">Open a workspace to see its AI team.</p>'; handoffs.innerHTML = '<p class="muted">No workspace selected.</p>'; return null; }
    if (workspace.id !== 'natural-nation' || !workspace.activePackageId) {
      roles.innerHTML = '<p class="muted">No product execution package is assigned to this workspace.</p>';
      handoffs.innerHTML = '<article class="module-card"><strong>No active orchestration chain</strong><p>Founder OS management work is reviewed through its own platform backlog.</p></article>';
      return null;
    }

    roles.innerHTML = '<p class="muted">Loading the AI team...</p>';
    handoffs.innerHTML = '<p class="muted">Loading canonical work status...</p>';
    try {
      const [registry, state, providersResponse] = await Promise.all([
        fetchJson(REGISTRY_URL), loadCanonicalState(workspace),
        fetch(`${GATEWAY_URL}/v1/ai/providers?v=${Date.now()}`, { cache: 'no-store' }).then((response) => response.ok ? response.json() : null).catch(() => null)
      ]);
      validateState(registry, state, workspace);
      currentRegistry = registry; currentState = state; providerStatus = providersResponse?.providers || null;
      roles.innerHTML = registry.agents.map((agent) => renderAgent(agent, state)).join('');
      handoffs.innerHTML = `${monitorSummary(state, registry)}${teamControlPanel(state, registry)}<article class="glass-panel orchestration-summary"><div class="eyebrow">Current Build</div><div class="section-title">${escapeHtml(state.packageId)}</div><p>${escapeHtml(registry.agents.find((agent) => agent.id === state.currentOwner)?.name || state.currentOwner)} owns the current canonical step.</p><div class="record-row"><span>Workflow status</span><strong>${escapeHtml(statusLabel(state.status))}</strong></div><div class="record-row"><span>Next handoff</span><strong>${escapeHtml(registry.agents.find((agent) => agent.id === state.nextOwner)?.name || state.nextOwner || 'None')}</strong></div></article><div class="orchestration-task-list">${state.tasks.map((task) => renderTask(task, registry)).join('')}</div>`;
      return state;
    } catch (error) {
      console.error(error);
      roles.innerHTML = '<p class="muted">The AI team could not be loaded.</p>';
      handoffs.innerHTML = `<article class="module-card"><strong>Needs attention</strong><p>${escapeHtml(error.message)}</p></article>`;
      throw error;
    }
  }

  document.addEventListener('click', (event) => {
    const refreshButton = event.target.closest('[data-ai-refresh]');
    if (refreshButton) {
      event.preventDefault();
      refreshButton.disabled = true;
      refreshButton.setAttribute('aria-busy', 'true');
      render().catch(() => null).finally(() => {
        refreshButton.disabled = false;
        refreshButton.setAttribute('aria-busy', 'false');
      });
      return;
    }
    const controlButton = event.target.closest('[data-ai-control]');
    if (controlButton) {
      event.preventDefault();
      applyTeamControl(controlButton.dataset.aiControl).catch((error) => window.NNOSProcessing?.error({ title: 'AI Team control stopped', message: error.message, stage: 'Stopped' }));
      return;
    }
    const dispatchButton = event.target.closest('[data-start-ai-task]');
    if (dispatchButton) dispatchTask(dispatchButton.dataset.startAiTask).catch((error) => window.NNOSProcessing?.error({ title: 'Dispatch failed', message: error.message, stage: 'Stopped' }));
    const resetButton = event.target.closest('[data-reset-ai-task]');
    if (resetButton) resetTask(resetButton.dataset.resetAiTask).catch((error) => window.NNOSProcessing?.error({ title: 'Reset failed', message: error.message, stage: 'Stopped' }));
  });

  window.NNOSAIOrchestration = { reload: render, dispatchTask, resetTask, applyTeamControl, get state() { return currentState; } };
  window.addEventListener('founder-os:workspace-view-changed', (event) => { if (event.detail?.target === 'ai') render().catch(() => null); });
  render().catch(() => null);
})();