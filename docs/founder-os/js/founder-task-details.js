(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let selectedTaskId = null;
  let observer = null;

  function roleName(roleId) {
    const registry = window.NNOSCanonicalBuild?.registry;
    return registry?.agents?.find((agent) => agent.id === roleId)?.name || roleId || 'Not assigned';
  }

  function statusLabel(status) {
    return ({
      ready: 'Ready to run', waiting: 'Waiting', working: 'Provider accepted', complete: 'Result verified',
      completed: 'Result verified', blocked: 'Blocked', dispatching: 'Recording handoff',
      'result-verified': 'Result verified', 'verification-failed': 'Verification failed',
      'manual-review-required': 'Founder review required', 'founder-approved': 'Founder approved'
    })[status] || status || 'Unknown';
  }

  function formatDate(value) {
    if (!value) return 'Not recorded';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function asList(value, fallback = 'None recorded') {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.length
      ? `<ul>${values.map((item) => `<li>${esc(typeof item === 'string' ? item : JSON.stringify(item))}</li>`).join('')}</ul>`
      : `<p class="muted">${esc(fallback)}</p>`;
  }

  function changedFiles(task) {
    if (Array.isArray(task.filesAffected)) return task.filesAffected;
    const summary = String(task.resultSummary || '');
    const marker = summary.match(/Changed files:\s*([^.]*(?:\.[a-z0-9]+(?:,\s*|$))+)/i);
    return marker ? marker[1].split(',').map((item) => item.trim()).filter(Boolean) : [];
  }

  function dependencies(task, state) {
    if (Array.isArray(task.dependencies)) return task.dependencies;
    const index = state.tasks.findIndex((item) => item.id === task.id);
    return index > 0 ? [state.tasks[index - 1].id] : [];
  }

  function blocking(task, state) {
    const index = state.tasks.findIndex((item) => item.id === task.id);
    return index >= 0 && index < state.tasks.length - 1 ? [state.tasks[index + 1].id] : [];
  }

  function timeline(task) {
    const events = [
      ['Created', task.createdAt],
      ['Assigned', task.assignedAt],
      ['Started', task.startedAt],
      ['Verification failed', task.verificationFailedAt],
      ['Reset', task.resetAt],
      ['Completed', task.completedAt]
    ].filter(([, value]) => value);
    if (!events.length) return '<p class="muted">No execution timestamps were recorded.</p>';
    return `<ol class="task-timeline">${events.map(([label, value]) => `<li><strong>${esc(label)}</strong><span>${esc(formatDate(value))}</span></li>`).join('')}</ol>`;
  }

  function ensurePanel() {
    let panel = $('[data-founder-task-detail]');
    if (panel) return panel;
    const selected = $('.production-selected-build');
    if (!selected) return null;
    panel = document.createElement('article');
    panel.className = 'glass-panel founder-task-detail';
    panel.dataset.founderTaskDetail = 'true';
    panel.hidden = true;
    selected.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function currentTask() {
    const state = window.NNOSCanonicalBuild?.state;
    return state?.tasks?.find((task) => task.id === selectedTaskId) || null;
  }

  function syncSelection() {
    $$('[data-build-queue] .queue-item').forEach((button) => {
      const selected = button.dataset.taskId === selectedTaskId;
      button.classList.toggle('task-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function closePanel({ preserveUrl = false } = {}) {
    selectedTaskId = null;
    const panel = $('[data-founder-task-detail]');
    if (panel) panel.hidden = true;
    syncSelection();
    if (!preserveUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete('task');
      window.history.replaceState({}, '', url);
    }
  }

  function renderTask(task) {
    const state = window.NNOSCanonicalBuild?.state;
    const pkg = window.NNOSCanonicalBuild?.package;
    const panel = ensurePanel();
    if (!panel) return;
    if (!task || !state) {
      panel.hidden = false;
      panel.innerHTML = `<div class="task-detail-header"><div><div class="eyebrow">Task Details</div><h2>Task unavailable</h2><p class="muted">The live orchestration record no longer contains this task.</p></div><button type="button" data-task-detail-close aria-label="Close task details">Close</button></div>`;
      return;
    }

    const retryAllowed = task.status === 'blocked' && state.currentOwner === task.owner && !(task.owner === 'founder' && task.providerStatus === 'manual-review-required');
    const reviewAllowed = task.owner === 'founder' && task.providerStatus === 'manual-review-required';
    const files = changedFiles(task);
    const deps = dependencies(task, state);
    const blockedBy = blocking(task, state);
    const evidence = task.resultSummary || task.blockedReason || 'No result evidence has been recorded yet.';

    panel.hidden = false;
    panel.innerHTML = `
      <div class="task-detail-header">
        <div>
          <div class="eyebrow">Task Details</div>
          <h2>${esc(task.title || task.id)}</h2>
          <p class="muted">${esc(task.id)} · ${esc(statusLabel(task.providerStatus || task.status))}</p>
        </div>
        <button type="button" data-task-detail-close aria-label="Close task details">Close</button>
      </div>
      <div class="task-detail-summary" aria-label="Task summary">
        <div><span>Status</span><strong>${esc(statusLabel(task.status))}</strong></div>
        <div><span>Provider status</span><strong>${esc(statusLabel(task.providerStatus))}</strong></div>
        <div><span>Current owner</span><strong>${esc(roleName(task.owner))}</strong></div>
        <div><span>Next role</span><strong>${esc(roleName(task.nextRole))}</strong></div>
        <div><span>Priority</span><strong>${esc(task.priority || 'Canonical order')}</strong></div>
        <div><span>Workspace / package</span><strong>${esc(task.workspaceId || state.workspaceId)} / ${esc(task.packageId || state.packageId)}</strong></div>
      </div>
      <div class="task-detail-grid">
        <section><h3>Full work order</h3><p>${esc(task.requiredInput || pkg?.objective || 'No full work order was recorded.')}</p></section>
        <section><h3>Expected output</h3><p>${esc(task.expectedOutput || 'No expected output was recorded.')}</p></section>
        <section><h3>Success criteria</h3>${asList(task.acceptanceCriteria || pkg?.acceptanceCriteria, 'No success criteria were recorded.')}</section>
        <section><h3>Dependencies</h3>${asList(deps, 'No dependencies.')}</section>
        <section><h3>Blocking next</h3>${asList(blockedBy, 'This task is not blocking another recorded task.')}</section>
        <section><h3>Affected files</h3>${asList(files, 'No affected-file evidence was recorded.')}</section>
        <section class="full"><h3>Evidence and result</h3><p>${esc(evidence)}</p></section>
        <section class="full"><h3>Execution history</h3>${timeline(task)}</section>
        ${task.blockedReason || task.verificationFailedAt ? `<section class="full task-detail-alert"><h3>Failure or blocked details</h3><p>${esc(task.blockedReason || task.retryContext?.reason || 'Verification failed. Review the recorded retry context.')}</p>${task.retryContext ? `<pre>${esc(JSON.stringify(task.retryContext, null, 2))}</pre>` : ''}</section>` : ''}
      </div>
      <div class="task-detail-actions">
        <button type="button" data-task-detail-refresh>Refresh details</button>
        <button type="button" data-task-detail-build>Open Build Work</button>
        ${retryAllowed ? '<button class="generate" type="button" data-task-detail-retry>Retry safely</button>' : ''}
        ${reviewAllowed ? '<button class="generate" type="button" data-task-detail-review>Open Founder review</button>' : ''}
      </div>`;
    syncSelection();
  }

  function selectTask(taskId, { updateUrl = true } = {}) {
    const state = window.NNOSCanonicalBuild?.state;
    const task = state?.tasks?.find((item) => item.id === taskId);
    selectedTaskId = taskId;
    renderTask(task);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('task', taskId);
      window.history.replaceState({}, '', url);
    }
    $('[data-founder-task-detail]')?.focus?.();
  }

  function enhanceQueue() {
    const queue = $('[data-build-queue]');
    if (!queue) return;
    $$('.queue-item', queue).forEach((button) => {
      const id = $('strong', button)?.textContent?.trim();
      if (!id) return;
      button.disabled = false;
      button.dataset.taskId = id;
      button.setAttribute('aria-label', `Open task ${id}`);
      button.setAttribute('aria-pressed', String(id === selectedTaskId));
      button.classList.toggle('task-selected', id === selectedTaskId);
    });
    const requested = new URL(window.location.href).searchParams.get('task');
    if (!selectedTaskId && requested && window.NNOSCanonicalBuild?.state?.tasks?.some((task) => task.id === requested)) selectTask(requested, { updateUrl: false });
    else if (selectedTaskId) renderTask(currentTask());
  }

  async function refreshSelected() {
    const taskId = selectedTaskId;
    const panel = ensurePanel();
    if (panel) panel.setAttribute('aria-busy', 'true');
    try {
      await window.NNOSCanonicalBuild?.reload?.();
      selectedTaskId = taskId;
      enhanceQueue();
      renderTask(currentTask());
    } finally {
      panel?.removeAttribute('aria-busy');
    }
  }

  document.addEventListener('click', (event) => {
    const queueButton = event.target.closest('[data-build-queue] .queue-item[data-task-id]');
    if (queueButton) {
      event.preventDefault();
      selectTask(queueButton.dataset.taskId);
      return;
    }
    if (event.target.closest('[data-task-detail-close]')) closePanel();
    if (event.target.closest('[data-task-detail-refresh]')) refreshSelected();
    if (event.target.closest('[data-task-detail-build]')) window.setWorkspace?.('build');
    if (event.target.closest('[data-task-detail-retry]')) window.NNOSCanonicalBuild?.resetCurrentTask?.();
    if (event.target.closest('[data-task-detail-review]')) $('[data-founder-review-panel]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'build') setTimeout(enhanceQueue, 0);
    else closePanel({ preserveUrl: true });
  });

  observer = new MutationObserver(enhanceQueue);
  const queue = $('[data-build-queue]');
  if (queue) observer.observe(queue, { childList: true, subtree: true });
  window.NNOSFounderTaskDetails = { selectTask, close: closePanel, refresh: refreshSelected };
  enhanceQueue();
})();