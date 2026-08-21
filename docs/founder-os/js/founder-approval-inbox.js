(() => {
  const paths = window.NNOSPaths;
  const GATEWAY_URL = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const registryUrl = paths.asset('config/workspace-registry.json');
  let registry = null;
  let states = [];
  let loadFailures = [];
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
    link.href = paths.asset('css/founder-approval-inbox.css?v=file-impact-approval');
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
      <div class="approval-inbox-summary" data-approval-summary aria-live="polite"></div>
      <div class="approval-inbox-shell">
        <article class="glass-panel approval-inbox-list"><div class="eyebrow">Waiting</div><h2>Approval Queue</h2><div class="approval-inbox-list-items" data-approval-list aria-live="polite"></div></article>
        <article class="glass-panel approval-inbox-detail" data-approval-detail><div class="approval-empty"><strong>Select an approval.</strong><p class="muted">Open an item to see which files change, how they affect the project, and the available decisions.</p></div></article>
      </div>`;
    const firstView = main.querySelector('.workspace-view');
    if (firstView) firstView.insertAdjacentElement('beforebegin', view); else main.appendChild(view);
    return view;
  }

  function parseResultSummary(value) {
    if (!value || typeof value !== 'string') return {};
    try { return JSON.parse(value); } catch { return { summary: value }; }
  }

  function extractChangedFilePaths(task) {
    const explicit = task.changedFiles || task.filesChanged || task.fileImpacts;
    if (Array.isArray(explicit)) return explicit;
    const source = [task.resultSummary, task.requiredInput].filter(Boolean).join(' ');
    const match = source.match(/(?:changed files?|exact changed files?):\s*([^.]*)/i);
    if (!match) return [];
    return match[1].split(',').map((path) => path.trim()).filter(Boolean);
  }

  function normalizeFileImpact(entry) {
    const item = typeof entry === 'string' ? { path: entry } : (entry || {});
    return {
      path: item.path || item.file || item.filename || 'File path unavailable',
      purpose: item.purpose || item.change || item.summary || 'Purpose not supplied',
      effect: item.projectEffect || item.effect || item.impact || 'Project effect not supplied',
      risk: item.risk || item.riskLevel || 'Unknown'
    };
  }

  function riskRank(value) {
    return ({ none: 0, low: 1, medium: 2, high: 3, critical: 4, unknown: 5 })[String(value || 'unknown').toLowerCase()] ?? 5;
  }

  function approvalImpact(task) {
    const result = parseResultSummary(task.resultSummary);
    const files = extractChangedFilePaths(task).map(normalizeFileImpact);
    const risks = Array.isArray(task.risks) ? task.risks : (Array.isArray(result.risks) ? result.risks : []);
    const evidence = Array.isArray(task.evidence) ? task.evidence : (Array.isArray(result.evidence) ? result.evidence : []);
    const highestFileRisk = files.reduce((highest, file) => riskRank(file.risk) > riskRank(highest) ? file.risk : highest, 'None');
    return {
      summary: task.changeSummary || result.summary || task.resultSummary || task.description || 'The workflow reached a Founder-controlled decision gate.',
      files,
      filesComplete: files.length > 0 && files.every((file) => file.effect !== 'Project effect not supplied' && file.risk !== 'Unknown'),
      projectEffect: task.projectEffect || result.projectEffect || (files.length
        ? 'The listed files are the complete supplied change set. Review each project effect before deciding.'
        : 'No file-impact manifest was supplied. Do not approve until the changed files and their project effects are available.'),
      evidence,
      verification: task.verificationSummary || result.verificationSummary || (evidence.length ? `${evidence.length} verification item${evidence.length === 1 ? '' : 's'} supplied` : 'Verification details not supplied'),
      risks,
      overallRisk: task.overallRisk || result.overallRisk || (risks.length ? 'Review required' : highestFileRisk),
      rollback: task.rollbackPlan || result.rollbackPlan || 'Rollback plan not supplied'
    };
  }

  function governedWorkspaces() {
    return (registry?.workspaces || []).filter((workspace) => workspace.status === 'active' && workspace.activePackageId);
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      registry = await fetchJson(registryUrl);
      const results = await Promise.all(governedWorkspaces().map(async (workspace) => {
        try {
          const body = await fetchJson(`${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/packages/${encodeURIComponent(workspace.activePackageId)}/orchestration`);
          return { workspace, state: body?.state || null, error: null };
        } catch (error) {
          return { workspace, state: null, error };
        }
      }));
      states = results.map((result) => result.state).filter(Boolean);
      loadFailures = results.filter((result) => result.error).map((result) => ({
        workspaceId: result.workspace.id,
        message: result.error.message || 'Orchestration state unavailable.'
      }));
      render();
    } catch (error) {
      states = [];
      loadFailures = [{ workspaceId: 'registry', message: error.message || 'Approvals could not be loaded.' }];
      renderError(loadFailures[0].message);
    } finally {
      loading = false;
    }
  }

  function approvalRecords() {
    return states.flatMap((state) => {
      const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
      return tasks.filter((task) => task.owner === 'founder' && !['complete', 'completed', 'founder-approved', 'rejected'].includes(task.status)).map((task) => ({
        id: task.id,
        recordKey: `${state.workspaceId}:${state.packageId}:${task.id}`,
        category: task.approvalType || (task.providerStatus === 'manual-review-required' ? 'Implementation review' : 'Founder decision'),
        title: task.title || task.id,
        status: task.providerStatus || task.status || 'waiting',
        workspaceId: state.workspaceId,
        packageId: state.packageId,
        owner: task.owner,
        updatedAt: task.updatedAt || state.updatedAt,
        impact: approvalImpact(task),
        pullRequestUrl: String(task.resultSummary || '').match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/i)?.[0] || null,
        founderNotes: Array.isArray(task.founderNotes) ? task.founderNotes : []
      }));
    }).sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
  }

  function renderList(records) {
    const list = $('[data-approval-list]');
    if (!list) return;
    if (!records.length) {
      list.innerHTML = '<div class="approval-empty"><strong>No approvals are waiting.</strong><p class="muted">The live orchestration state currently has no Founder-owned decision gates.</p></div>';
      return;
    }
    list.innerHTML = records.map((record) => `
      <button type="button" class="approval-item ${selectedId === record.recordKey ? 'active' : ''}" data-approval-id="${esc(record.recordKey)}" aria-pressed="${selectedId === record.recordKey}">
        <small>${esc(record.category)}</small><strong>${esc(record.title)}</strong><small>${esc(record.workspaceId)} · ${esc(record.status)}</small>
      </button>`).join('');
  }

  function fileImpactMarkup(impact) {
    if (!impact.files.length) return '<div class="approval-missing-impact" role="alert"><strong>File-impact details are missing.</strong><p>The approval payload does not identify the changed files or explain their effect on the project. Request changes before approving.</p></div>';
    return `<div class="approval-file-table" role="table" aria-label="Files changed and project impact">
      <div class="approval-file-row approval-file-head" role="row"><span>File</span><span>Purpose</span><span>Project effect</span><span>Risk</span></div>
      ${impact.files.map((file) => `<article class="approval-file-row" role="row">
        <div data-label="File"><code>${esc(file.path)}</code></div>
        <div data-label="Purpose">${esc(file.purpose)}</div>
        <div data-label="Project effect">${esc(file.effect)}</div>
        <div data-label="Risk"><span class="approval-risk approval-risk-${esc(String(file.risk).toLowerCase().replace(/[^a-z0-9-]/g, '-'))}">${esc(file.risk)}</span></div>
      </article>`).join('')}</div>`;
  }

  function compactList(values, emptyText) {
    if (!values.length) return `<p class="muted">${esc(emptyText)}</p>`;
    return `<ul class="approval-compact-list">${values.map((value) => `<li>${esc(typeof value === 'string' ? value : JSON.stringify(value))}</li>`).join('')}</ul>`;
  }

  function renderDetail(record) {
    const detail = $('[data-approval-detail]');
    if (!detail) return;
    if (!record) {
      detail.innerHTML = '<div class="approval-empty"><strong>Select an approval.</strong><p class="muted">Open an item to see which files change, how they affect the project, and the available decisions.</p></div>';
      return;
    }
    detail.innerHTML = `
      <div class="approval-inbox-header"><div><div class="eyebrow">${esc(record.category)}</div><h2>${esc(record.title)}</h2><p class="muted">${esc(record.workspaceId)} · ${esc(record.packageId)} · ${esc(record.id)}</p></div><span class="pill approval-status">${esc(record.status)}</span></div>
      <div class="approval-detail-flow">
        <section class="approval-detail-section" data-approval-area="summary"><div class="approval-section-number">1</div><div><h3>Change summary</h3><p>${esc(record.impact.summary)}</p><p class="approval-effect-rollup"><strong>Overall project effect:</strong> ${esc(record.impact.projectEffect)}</p></div></section>
        <section class="approval-detail-section approval-files-section" data-approval-area="files"><div class="approval-section-number">2</div><div><h3>Files changed</h3><p class="muted">What each file does and how the change affects the project.</p>${fileImpactMarkup(record.impact)}</div></section>
        <section class="approval-detail-section" data-approval-area="verification"><div class="approval-section-number">3</div><div><h3>Verification and risk</h3><div class="approval-verification-grid"><article><small>Verification</small><strong>${esc(record.impact.verification)}</strong></article><article><small>Overall risk</small><strong>${esc(record.impact.overallRisk)}</strong></article><article><small>Rollback</small><strong>${esc(record.impact.rollback)}</strong></article></div>${compactList(record.impact.risks, 'No additional risks were supplied.')}${record.pullRequestUrl ? `<p><a href="${esc(record.pullRequestUrl)}" target="_blank" rel="noopener">Open related pull request ↗</a></p>` : ''}</div></section>
        <section class="approval-detail-section" data-approval-area="decision"><div class="approval-section-number">4</div><div><h3>Your decision</h3><p>Approve this exact file set and its stated project effects, or return it with direction.</p><label class="approval-note-label" for="approval-founder-note">Optional Founder note</label><textarea id="approval-founder-note" class="approval-note" data-approval-note placeholder="Add context, required corrections, or the reason for your decision."></textarea><p class="muted">A note is required for request changes, defer, and reject.</p></div></section>
      </div>
      <div class="approval-actions" aria-label="Founder approval actions" data-approval-actions>
        <button type="button" class="generate" data-approval-decision="approve" ${record.impact.filesComplete ? '' : 'disabled title="Complete file-impact details are required before approval."'}>Approve changes</button>
        <button type="button" data-approval-decision="request_changes">Request changes</button>
        <button type="button" data-approval-decision="defer">Defer</button>
        <button type="button" data-approval-decision="reject">Reject</button>
      </div>`;
  }

  function renderSummary(records) {
    const summary = $('[data-approval-summary]');
    if (!summary) return;
    const workspaceCount = new Set(records.map((record) => record.workspaceId)).size;
    const status = loadFailures.length ? `${loadFailures.length} unavailable` : 'Connected';
    summary.innerHTML = `
      <article><small>Needs your decision</small><strong>${records.length}</strong></article>
      <article><small>Workspaces represented</small><strong>${workspaceCount}</strong></article>
      <article><small>Gateway coverage</small><strong>${esc(status)}</strong></article>`;
  }

  function render() {
    ensureView();
    const records = approvalRecords();
    if (selectedId && !records.some((record) => record.recordKey === selectedId)) selectedId = null;
    if (!selectedId && records.length) selectedId = records[0].recordKey;
    renderList(records);
    renderSummary(records);
    renderDetail(records.find((record) => record.recordKey === selectedId));
  }

  function renderError(message) {
    ensureView();
    const list = $('[data-approval-list]');
    const detail = $('[data-approval-detail]');
    if (list) list.innerHTML = `<div class="approval-empty"><strong>Approval data unavailable.</strong><p class="muted">${esc(message)}</p><button type="button" data-approval-refresh>Try again</button></div>`;
    if (detail) detail.innerHTML = '<div class="approval-empty"><strong>No approval selected.</strong><p class="muted">Restore the live Gateway connection to review and record decisions.</p></div>';
  }

  async function recordDecision(decision) {
    const record = approvalRecords().find((item) => item.recordKey === selectedId);
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
    selectedId = approvalRecords().find((record) => record.id === taskId)?.recordKey || taskId || selectedId;
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

  window.NNOSApprovalInbox = { load, open: openApproval, describeImpact: approvalImpact, get records() { return approvalRecords(); }, get failures() { return [...loadFailures]; } };
  loadStyles();
  ensureView();
})();
