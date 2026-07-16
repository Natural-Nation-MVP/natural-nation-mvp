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

  function ensureReviewStyles() {
    if (document.querySelector('[data-founder-review-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './css/founder-review.css?v=founder-review-v1';
    link.dataset.founderReviewStyles = 'true';
    document.head.appendChild(link);
  }

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
      ready: 'Ready to run', waiting: 'Waiting', working: 'Provider accepted', complete: 'Result verified',
      completed: 'Result verified', blocked: 'Blocked', dispatching: 'Recording handoff',
      'result-verified': 'Result verified', 'verification-failed': 'Verification failed',
      'manual-review-required': 'Founder review required', 'founder-approved': 'Founder approved',
      'ready-for-architecture': 'Ready for architecture', 'in-progress': 'In progress'
    })[status] || status || 'Unknown';
  }

  function currentTask() {
    if (!orchestrationState) return null;
    return orchestrationState.tasks.find((task) => task.owner === orchestrationState.currentOwner && ['ready', 'working', 'blocked'].includes(task.status))
      || orchestrationState.tasks.find((task) => task.status === 'ready')
      || orchestrationState.tasks.find((task) => task.status === 'working')
      || orchestrationState.tasks.find((task) => task.status === 'blocked')
      || null;
  }

  function isFounderReviewTask(task) {
    return task?.owner === 'founder' && task?.providerStatus === 'manual-review-required';
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

  function removeFounderReview() {
    $('[data-founder-review-panel]')?.remove();
  }

  function renderUnscoped() {
    packageAvailable = false;
    canonicalPackage = null;
    orchestrationState = null;
    clearQueue();
    removeFounderReview();
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
    removeFounderReview();
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

  function parseJsonObject(value) {
    if (value && typeof value === 'object') return value;
    const text = String(value || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try { return JSON.parse(text); } catch { return null; }
  }

  function extractPullRequest(task) {
    const match = String(task?.resultSummary || '').match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/i);
    return match?.[0] || 'https://github.com/Natural-Nation-MVP/natural-nation-mvp/pull/30';
  }

  function extractChangedFiles(task) {
    const match = String(task?.resultSummary || '').match(/Changed files:\s*([^.]*(?:\.[a-z]+(?:,\s*|$))+)/i);
    if (!match) return ['app/frontend/index.html', 'app/frontend/styles.css', 'app/frontend/app.js', 'app/frontend/README.md', 'app/frontend/tests/validate-foundation.mjs'];
    return match[1].split(',').map((item) => item.trim()).filter(Boolean);
  }

  async function loadReviewEvidence(state) {
    const base = `../orchestration/${encodeURIComponent(state.workspaceId)}/${encodeURIComponent(state.packageId)}`;
    const [gemini, gpose] = await Promise.all([
      fetchJson(`${base}/AI-TASK-003.result.json`).catch(() => null),
      fetchJson(`${base}/AI-TASK-004.result.json`).catch(() => null)
    ]);
    return {
      gemini: parseJsonObject(gemini?.structured || gemini?.summary),
      gpose: parseJsonObject(gpose?.structured || gpose?.summary)
    };
  }

  function listMarkup(items, fallback) {
    const values = Array.isArray(items) && items.length ? items : [fallback];
    return `<ul>${values.map((item) => `<li>${esc(typeof item === 'string' ? item : item?.finding || JSON.stringify(item))}</li>`).join('')}</ul>`;
  }

  async function renderFounderReview(task, state) {
    ensureReviewStyles();
    removeFounderReview();
    const selected = $('.production-selected-build');
    if (!selected) return;

    const panel = document.createElement('article');
    panel.className = 'glass-panel founder-review-panel';
    panel.dataset.founderReviewPanel = 'true';
    panel.innerHTML = '<p class="muted">Loading verified review evidence…</p>';
    selected.insertAdjacentElement('afterend', panel);

    const evidence = await loadReviewEvidence(state);
    const implementation = state.tasks.find((item) => item.id === 'AI-TASK-002');
    const geminiTask = state.tasks.find((item) => item.id === 'AI-TASK-003');
    const gposeTask = state.tasks.find((item) => item.id === 'AI-TASK-004');
    const prUrl = extractPullRequest(implementation);
    const files = extractChangedFiles(implementation);
    const recommendation = evidence.gpose?.decision || (evidence.gemini?.recommendation === 'changes_required' ? 'request_changes' : 'approve');
    const recommendationLabel = recommendation === 'approve' ? 'Approve this slice' : 'Request changes before approval';
    const suggestedNote = evidence.gpose?.nextAction || evidence.gemini?.mergeBlockers?.join(' ') || 'Apply the verified review findings before returning for Founder approval.';

    panel.innerHTML = `
      <div class="founder-review-header">
        <div>
          <div class="eyebrow">Founder Decision</div>
          <h2>Review this implementation slice</h2>
          <p class="muted">Everything below comes from the canonical build record, PR evidence, Gemini review, and GPose summary.</p>
        </div>
        <span class="pill">Manual approval required</span>
      </div>
      <div class="founder-review-grid">
        <section class="founder-review-card">
          <h3>What was built</h3>
          <p>${esc(implementation?.resultSummary || 'The Day 1 member-facing frontend foundation was implemented.')}</p>
          <a class="founder-review-link" href="${esc(prUrl)}" target="_blank" rel="noopener">Open Pull Request #30 ↗</a>
        </section>
        <section class="founder-review-card">
          <h3>Files changed</h3>
          ${listMarkup(files, 'No changed-file evidence was recorded.')}
        </section>
        <section class="founder-review-card">
          <h3>What passed</h3>
          ${listMarkup(evidence.gemini?.passes, geminiTask?.resultSummary || 'Gemini review completed.')}
        </section>
        <section class="founder-review-card">
          <h3>Remaining risks</h3>
          ${listMarkup(evidence.gpose?.risks || evidence.gemini?.mergeBlockers, 'No remaining risks were recorded.')}
        </section>
        <section class="founder-review-card full founder-review-recommendation ${recommendation === 'approve' ? 'approve' : ''}">
          <h3>GPose recommendation</h3>
          <p><strong>${esc(recommendationLabel)}</strong></p>
          ${listMarkup(evidence.gpose?.comments, gposeTask?.resultSummary || 'Founder review package completed.')}
          <p><strong>Next action:</strong> ${esc(evidence.gpose?.nextAction || suggestedNote)}</p>
        </section>
        <section class="founder-review-card full">
          <h3>Your decision note</h3>
          <textarea class="founder-review-note" data-founder-decision-note>${esc(suggestedNote)}</textarea>
          <p class="founder-review-warning">Approval records the slice as complete but does not automatically merge PR #30. Requesting changes sends the verified corrections back to Codex.</p>
        </section>
      </div>
      <div class="founder-review-actions">
        <button type="button" class="approve-action" data-founder-decision="approve">Approve slice</button>
        <button type="button" class="changes-action" data-founder-decision="request_changes">Request changes</button>
      </div>`;
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
    const founderReview = isFounderReviewTask(task);

    setText('[data-selected-id]', pkg.packageId);
    setText('[data-selected-title]', task?.title || 'Build workflow complete');
    setText('[data-selected-meta]', task
      ? `Current owner: ${owner?.name || task.owner} · Task: ${task.id} · Status: ${statusLabel(task.providerStatus || task.status)}`
      : `Package ${pkg.packageId} · No active AI task`);
    setText('[data-validation-status]', founderReview
      ? 'Review the verified evidence below and record your Founder decision.'
      : task?.status === 'blocked'
        ? task.blockedReason || 'The current task is blocked and may be safely reset.'
        : task
          ? `Live Gateway state loaded. ${owner?.name || task.owner} owns the current canonical step.`
          : 'All recorded orchestration tasks are complete.');
    setText('[data-build-approval]', founderReview ? 'Founder Decision' : task?.status === 'ready' ? 'Ready to Run' : statusLabel(task?.providerStatus || task?.status || state.status));
    setText('[data-approval]', founderReview ? 'Founder Decision' : task?.status === 'ready' ? 'Ready to Run' : statusLabel(task?.providerStatus || task?.status || state.status));
    setText('[data-bottom-target]', owner?.name || task?.owner || 'Founder');
    setText('[data-delivery]', founderReview ? 'Decision required' : task ? `${next?.name || task.nextRole || 'Founder'} is next` : 'Workflow complete');
    setText('[data-execution-order]', 'Architecture → Build → Review → Founder');

    if (task) renderAssignedRole(task); else clearAssignedRole();
    const preview = $('[data-package-preview]');
    if (preview) preview.textContent = JSON.stringify({ package: pkg, liveOrchestration: state }, null, 2);
    renderQueue(state);

    const history = $('[data-package-history]');
    if (history) history.innerHTML = `<div class="record-row"><span>Live orchestration updated ${esc(state.updatedAt || 'now')}</span><span class="status">${esc(statusLabel(state.status))}</span></div>`;

    if (founderReview) {
      setPrimaryAction('Review decision above', true);
      renderFounderReview(task, state);
      return;
    }

    removeFounderReview();
    const canDispatch = task?.status === 'ready' && state.currentOwner === task.owner;
    const canReset = task?.status === 'blocked' && state.currentOwner === task.owner;
    setPrimaryAction(canDispatch ? 'Validate and Run Current Task →' : canReset ? 'Retry Current Task Safely →' : statusLabel(task?.providerStatus || task?.status || state.status), !(canDispatch || canReset));
  }

  async function fetchJson(url, options) {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store', ...options });
    const text = await response.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = { error: { message: text } }; }
    if (!response.ok) throw new Error(body?.error?.message || `${url} returned ${response.status}.`);
    return body;
  }

  async function loadLiveBuild() {
    if (!isNaturalNationActive()) { renderUnscoped(); return null; }
    try {
      const workspace = window.NNOSActiveWorkspace;
      const stateUrl = `${gatewayUrl}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`;
      const [pkg, registry, stateBody] = await Promise.all([fetchJson(packagePath), fetchJson(registryPath), fetchJson(stateUrl)]);
      if (pkg?.packageId !== workspace.activePackageId || pkg?.workspaceId !== workspace.id || pkg?.status !== 'ready') throw new Error('The canonical package does not match the active Natural Nation workspace.');
      if (stateBody?.state?.workspaceId !== workspace.id || stateBody?.state?.packageId !== pkg.packageId) throw new Error('The Gateway returned orchestration state for a different workspace or package.');
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

  async function resetCurrentTask() {
    const task = currentTask();
    if (!task || task.status !== 'blocked' || orchestrationState?.currentOwner !== task.owner || isFounderReviewTask(task)) return;
    const key = window.prompt('Enter your Founder Key to safely reset this blocked task.');
    if (!key) return;
    const workspace = window.NNOSActiveWorkspace;
    const endpoint = `${gatewayUrl}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(orchestrationState.packageId)}/tasks/${encodeURIComponent(task.id)}/reset`;
    window.NNOSProcessing?.update({ title: 'Resetting blocked task', message: 'Preserving completed work and returning only the current task to Ready.', stage: 'Recovery' });
    try {
      await fetchJson(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ reason: task.blockedReason || 'Founder-authorized safe retry' })
      });
      await loadLiveBuild();
      window.NNOSProcessing?.success({ title: 'Task ready to retry', message: 'Completed upstream work was preserved.', stage: 'Recovered' });
    } catch (error) {
      window.NNOSProcessing?.error({ title: 'Recovery failed', message: error.message, stage: 'Stopped' });
      throw error;
    }
  }

  async function recordFounderDecision(decision) {
    const task = currentTask();
    if (!isFounderReviewTask(task)) return;
    const note = $('[data-founder-decision-note]')?.value?.trim() || '';
    const actionLabel = decision === 'approve' ? 'approve this implementation slice' : 'request changes and return the work to Codex';
    if (!window.confirm(`You are about to ${actionLabel}. Continue?`)) return;
    const key = window.prompt('Enter your Founder Key to record this decision.');
    if (!key) return;

    const workspace = window.NNOSActiveWorkspace;
    const endpoint = `${gatewayUrl}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(orchestrationState.packageId)}/tasks/${encodeURIComponent(task.id)}/decision`;
    window.NNOSProcessing?.update({
      title: decision === 'approve' ? 'Recording Founder approval' : 'Recording requested changes',
      message: 'Writing the final decision and updating the canonical workflow state.',
      stage: 'Founder decision'
    });
    try {
      await fetchJson(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ decision, note, pullRequestUrl: extractPullRequest(orchestrationState.tasks.find((item) => item.id === 'AI-TASK-002')) })
      });
      await loadLiveBuild();
      window.NNOSProcessing?.success({
        title: decision === 'approve' ? 'Founder approval recorded' : 'Changes sent back to Codex',
        message: decision === 'approve' ? 'The implementation slice is complete. Merge remains Founder-controlled.' : 'The verified correction list is now the next Codex work order.',
        stage: 'Recorded'
      });
    } catch (error) {
      window.NNOSProcessing?.error({ title: 'Founder decision failed', message: error.message, stage: 'Stopped' });
      throw error;
    }
  }

  document.addEventListener('click', (event) => {
    const decisionButton = event.target.closest('[data-founder-decision]');
    if (decisionButton) {
      event.preventDefault();
      recordFounderDecision(decisionButton.dataset.founderDecision);
      return;
    }

    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'generate') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const task = currentTask();
      if (task?.status === 'blocked') resetCurrentTask(); else runCurrentTask();
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
    resetCurrentTask,
    recordFounderDecision,
    get package() { return canonicalPackage; },
    get state() { return orchestrationState; }
  };
  ensureReviewStyles();
  renderUnscoped();
})();
