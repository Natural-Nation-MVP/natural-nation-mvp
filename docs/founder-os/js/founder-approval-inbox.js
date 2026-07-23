(() => {
  const paths = window.NNOSPaths;
  const GATEWAY_URL = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const registryUrl = paths.asset('config/workspace-registry.json');
  let registry = null;
  let state = null;
  let selectedId = null;
  let loading = false;

  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function loadStyles() {
    if (document.querySelector('[data-founder-approval-inbox-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = paths.asset('css/founder-approval-inbox.css?v=section-2-live-actions');
    link.dataset.founderApprovalInboxStyles = 'true';
    document.head.appendChild(link);
  }

  async function fetchJson(url, options = {}) {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}v=${Date.now()}`, { cache: 'no-store', ...options });
    const text = await response.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = { error: { message: text } }; }
    if (!response.ok) throw new Error(body?.error?.message || `${url} returned ${response.status}`);
    return body;
  }

  function ensureView() {
    let view = $('[data-workspace="approvals"]');
    if (view) return view;
    const main = $('.main');
    if (!main) return null;
    view = document.createElement('section');
    view.className = 'workspace-view';
    view.dataset.workspace = 'approvals';
    view.innerHTML = `
      <article class="glass-panel approval-inbox-toolbar">
        <div><div class="eyebrow">Founder Control</div><div class="section-title">Approval Inbox</div><p class="muted">Review decisions that require your authority across active workspaces.</p></div>
        <button type="button" data-approval-refresh>Refresh approvals</button>
      </article>
      <div class="approval-inbox-shell">
        <article class="glass-panel approval-inbox-list"><div class="eyebrow">Waiting</div><h2>Approval Queue</h2><div class="approval-inbox-list-items" data-approval-list aria-live="polite"></div></article>
        <article class="glass-panel approval-inbox-detail" data-approval-detail><div class="approval-empty"><strong>Select an approval.</strong><p class="muted">Open an item to review evidence, risks, recommendation, and available decisions.</p></div></article>
      </div>`;
    const firstView = main.querySelector('.workspace-view');
    if (firstView) firstView.insertAdjacentElement('beforebegin', view); else main.appendChild(view);
    return view;
  }

  function naturalNationWorkspace() {
    return registry?.workspaces?.find((workspace) => workspace.id === 'natural-nation') || null;
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      registry = await fetchJson(registryUrl);
      const workspace = naturalNationWorkspace();
      if (!workspace?.activePackageId) {
        state = null;
      } else {
        const body = await fetchJson(`${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`);
        state = body?.state || null;
      }
      render();
    } catch (error) {
      state = null;
      renderError(error.message || 'Approvals could not be loaded.');
    } finally {
      loading = false;
    }
  }

  function approvalRecords() {
    const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
    return tasks.filter((task) => task.owner === 'founder' && !['complete', 'completed', 'founder-approved', 'rejected'].includes(task.status)).map((task) => ({
      id: task.id,
      category: task.approvalType || (task.providerStatus === 'manual-review-required' ? 'Implementation review' : 'Founder decision'),
      title: task.title || task.id,
      status: task.providerStatus || task.status || 'waiting',
      workspaceId: state.workspaceId,
      packageId: state.packageId,
      owner: task.owner,
      updatedAt: task.updatedAt || state.updatedAt,
      whatChanged: task.resultSummary || task.description || 'The workflow reached a Founder-controlled decision gate.',
      whyChanged: task.reason || task.blockedReason || 'Founder authority is required before the workflow may continue.',
      evidence: Array.isArray(task.evidence) ? task.evidence : [task.resultSummary || 'Canonical orchestration state identifies this item as requiring Founder review.'],
      risks: Array.isArray(task.risks) ? task.risks : [task.blockedReason || 'Proceeding without a recorded Founder decision may bypass the approved governance gate.'],
      recommendation: task.recommendation || (task.providerStatus === 'manual-review-required' ? 'Review the verified implementation evidence before approving or returning the work.' : 'Review the request and record a governed decision.'),
      pullRequestUrl: String(task.resultSummary || '').match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/i)?.[0] || null,
      founderNotes: Array.isArray(task.founderNotes) ? task.founderNotes : []
    }));
  }

  function listMarkup(values, className) {
    return `<ul class="${className}">${values.map((value) => `<li>${esc(typeof value === 'string' ? value : JSON.stringify(value))}</li>`).join('')}</ul>`;
  }

  function renderList(records) {
    const list = $('[data-approval-list]');
    if (!list) return;
    if (!records.length) {
      list.innerHTML = '<div class="approval-empty"><strong>No approvals are waiting.</strong><p class="muted">The live orchestration state currently has no Founder-owned decision gates.</p></div>';
      return;
    }
    list.innerHTML = records.map((record) => `
      <button type="button" class="approval-item ${selectedId === record.id ? 'active' : ''}" data-approval-id="${esc(record.id)}" aria-pressed="${selectedId === record.id}">
        <small>${esc(record.category)}</small><strong>${esc(record.title)}</strong><small>${esc(record.workspaceId)} · ${esc(record.status)}</small>
      </button>`).join('');
  }

  function noteHistory(record) {
    if (!record.founderNotes.length) return '<p class="muted">No Founder notes have been recorded.</p>';
    return `<ul class="approval-evidence-list">${record.founderNotes.map((entry) => `<li><strong>${esc(entry.action || 'note')}</strong> · ${esc(entry.recordedAt || 'recently')}<br>${esc(entry.note || '')}</li>`).join('')}</ul>`;
  }

  function renderDetail(record) {
    const detail = $('[data-approval-detail]');
    if (!detail) return;
    if (!record) {
      detail.innerHTML = '<div class="approval-empty"><strong>Select an approval.</strong><p class="muted">Open an item to review evidence, risks, recommendation, and available decisions.</p></div>';
      return;
    }
    detail.innerHTML = `
      <div class="approval-inbox-header"><div><div class="eyebrow">${esc(record.category)}</div><h2>${esc(record.title)}</h2><p class="muted">${esc(record.workspaceId)} · ${esc(record.packageId)} · ${esc(record.id)}</p></div><span class="pill approval-status">${esc(record.status)}</span></div>
      <div class="approval-detail-grid">
        <section class="approval-detail-card"><h3>What changed</h3><p>${esc(record.whatChanged)}</p></section>
        <section class="approval-detail-card"><h3>Why it changed</h3><p>${esc(record.whyChanged)}</p></section>
        <section class="approval-detail-card"><h3>Evidence</h3>${listMarkup(record.evidence, 'approval-evidence-list')}</section>
        <section class="approval-detail-card"><h3>Risks</h3>${listMarkup(record.risks, 'approval-risk-list')}</section>
        <section class="approval-detail-card full"><h3>AI team recommendation</h3><p>${esc(record.recommendation)}</p>${record.pullRequestUrl ? `<p><a href="${esc(record.pullRequestUrl)}" target="_blank" rel="noopener">Open related pull request ↗</a></p>` : ''}</section>
        <section class="approval-detail-card full"><h3>Founder note</h3><textarea class="approval-note" data-approval-note placeholder="Add context, required corrections, or the reason for your decision."></textarea><p class="muted">A note is required for request changes, defer, reject, and note-only actions.</p></section>
        <section class="approval-detail-card full"><h3>Decision history</h3>${noteHistory(record)}</section>
      </div>
      <div class="approval-actions" aria-label="Founder approval actions">
        <button type="button" class="generate" data-approval-decision="approve">Approve</button>
        <button type="button" data-approval-decision="request_changes">Request changes</button>
        <button type="button" data-approval-decision="defer">Defer</button>
        <button type="button" data-approval-decision="reject">Reject</button>
        <button type="button" data-approval-decision="note">Add note</button>
      </div>`;
  }

  function render() {
    ensureView();
    const records = approvalRecords();
    if (selectedId && !records.some((record) => record.id === selectedId)) selectedId = null;
    if (!selectedId && records.length === 1) selectedId = records[0].id;
    renderList(records);
    renderDetail(records.find((record) => record.id === selectedId));
  }

  function renderError(message) {
    ensureView();
    const list = $('[data-approval-list]');
    const detail = $('[data-approval-detail]');
    if (list) list.innerHTML = `<div class="approval-empty"><strong>Approval data unavailable.</strong><p class="muted">${esc(message)}</p><button type="button" data-approval-refresh>Try again</button></div>`;
    if (detail) detail.innerHTML = '<div class="approval-empty"><strong>No approval selected.</strong><p class="muted">Restore the live Gateway connection to review and record decisions.</p></div>';
  }

  async function recordDecision(decision) {
    const record = approvalRecords().find((item) => item.id === selectedId);
    if (!record) return;
    const note = $('[data-approval-note]')?.value?.trim() || '';
    if (['request_changes', 'defer', 'reject', 'note'].includes(decision) && !note) {
      window.alert('Add a Founder note before recording this action.');
      return;
    }
    if (!window.confirm(`Record “${decision.replace('_', ' ')}” for ${record.title}?`)) return;
    const key = window.prompt('Enter your Founder Key to record this protected decision.');
    if (!key) return;

    const isCanonicalDecision = ['approve', 'request_changes'].includes(decision);
    const endpoint = isCanonicalDecision
      ? `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(record.workspaceId)}/packages/${encodeURIComponent(record.packageId)}/tasks/${encodeURIComponent(record.id)}/decision`
      : `${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(record.workspaceId)}/packages/${encodeURIComponent(record.packageId)}/tasks/${encodeURIComponent(record.id)}/approval-action`;
    const body = isCanonicalDecision
      ? { decision, note, pullRequestUrl: record.pullRequestUrl }
      : { action: decision, note, pullRequestUrl: record.pullRequestUrl };

    window.NNOSProcessing?.update({ title: 'Recording Founder decision', message: 'Updating the canonical approval record.', stage: 'Approval Inbox' });
    try {
      await fetchJson(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      await load();
      window.NNOSProcessing?.success({ title: 'Founder decision recorded', message: `${record.title} was updated.`, stage: 'Recorded' });
      window.dispatchEvent(new CustomEvent('founder-os:approval-recorded', { detail: { record, decision } }));
    } catch (error) {
      window.NNOSProcessing?.error({ title: 'Decision not recorded', message: error.message, stage: 'Stopped' });
    }
  }

  function openApproval(taskId) {
    selectedId = taskId || selectedId;
    window.setWorkspace?.('approvals');
    load().then(() => {
      render();
      $('[data-workspace="approvals"]')?.scrollIntoView({ block: 'start' });
    });
  }

  document.addEventListener('click', (event) => {
    const item = event.target.closest('[data-approval-id]');
    if (item) { selectedId = item.dataset.approvalId; render(); return; }
    if (event.target.closest('[data-approval-refresh]')) { event.preventDefault(); load(); return; }
    const decision = event.target.closest('[data-approval-decision]');
    if (decision) { event.preventDefault(); recordDecision(decision.dataset.approvalDecision); }
  });

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'approvals') load();
  });
  window.addEventListener('founder-os:approval-requested', (event) => openApproval(event.detail?.taskId));

  window.NNOSApprovalInbox = { load, open: openApproval, get records() { return approvalRecords(); } };
  loadStyles();
  ensureView();
})();
