(() => {
  const REPOSITORY = 'Natural-Nation-MVP/natural-nation-mvp';
  const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
  const ACTIONS_URL = `${REPOSITORY_URL}/actions`;
  const DEPLOYMENTS_URL = `${REPOSITORY_URL}/deployments`;
  const DEFAULT_BRANCH = 'main';

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

  function parsePullRequestUrl(state) {
    for (const task of state?.tasks || []) {
      const match = String(task.resultSummary || '').match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/i);
      if (match) return match[0];
    }
    return null;
  }

  function parseChangedFiles(state) {
    for (const task of state?.tasks || []) {
      const match = String(task.resultSummary || '').match(/Changed files:\s*([^.]*(?:\.[a-z0-9]+(?:,\s*|$))+)/i);
      if (match) return match[1].split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  function pullNumber(url) {
    return url ? url.match(/\/pull\/(\d+)/)?.[1] || null : null;
  }

  function gate(label, passed, detail) {
    return `<div class="record-row repository-gate ${passed ? 'gate-pass' : 'gate-blocked'}"><span><strong>${esc(label)}</strong><br><small>${esc(detail)}</small></span><span class="status">${passed ? 'PASS' : 'BLOCKED'}</span></div>`;
  }

  function linkButton(label, href, disabled = false) {
    return disabled
      ? `<button class="btn small" type="button" disabled aria-disabled="true">${esc(label)}</button>`
      : `<a class="btn small" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
  }

  function statusCard(label, value, detail) {
    return `<article class="module-card repository-status-card"><span class="eyebrow">${esc(label)}</span><div class="section-title">${esc(value)}</div><p class="muted">${esc(detail)}</p></article>`;
  }

  function fileList(files) {
    if (!files.length) return '<p class="muted">No changed-file evidence is recorded in the canonical orchestration state.</p>';
    return `<ul class="repository-file-list">${files.map((file) => `<li><code>${esc(file)}</code></li>`).join('')}</ul>`;
  }

  function repositoryState() {
    const state = window.NNOSCanonicalBuild?.state || window.NNOSRuntimeState?.snapshot?.orchestration || null;
    const pkg = window.NNOSCanonicalBuild?.package || null;
    const prUrl = parsePullRequestUrl(state);
    const files = parseChangedFiles(state);
    const pr = pullNumber(prUrl);
    const allTasksComplete = Boolean(state?.tasks?.length) && state.tasks.every((task) => task.status === 'complete');
    const reviewEvidence = ['AI-TASK-003', 'AI-TASK-004'].every((id) => state?.tasks?.find((task) => task.id === id)?.status === 'complete');
    const founderApproved = state?.finalDecision?.decision === 'approve' || state?.tasks?.find((task) => task.id === 'AI-TASK-005')?.providerStatus === 'founder-approved';
    const packageReady = pkg?.status === 'ready' || state?.packageId === 'NN-BUILD-001';
    const liveState = Boolean(state?.workspaceId === 'natural-nation' && state?.packageId === 'NN-BUILD-001');
    const mergeReady = Boolean(liveState && prUrl && allTasksComplete && reviewEvidence && founderApproved && packageReady);
    return { state, pkg, prUrl, pr, files, allTasksComplete, reviewEvidence, founderApproved, packageReady, liveState, mergeReady };
  }

  function renderUnavailable(status, checklist, message) {
    status.innerHTML = statusCard('Repository status', 'Unavailable', message);
    checklist.innerHTML = `<article class="module-card"><h3>Safe unavailable state</h3><p class="muted">Repository actions remain disabled until the Natural Nation orchestration record loads.</p>${linkButton('Open GitHub repository', REPOSITORY_URL)}</article>`;
  }

  function renderRepositoryIntelligence() {
    const status = $('[data-repo-status]');
    const checklist = $('[data-repo-checklist]');
    if (!status || !checklist) return;
    if (window.NNOSActiveWorkspace?.id !== 'natural-nation') {
      renderUnavailable(status, checklist, 'Open the Natural Nation workspace to view its repository handoff.');
      return;
    }

    const model = repositoryState();
    if (!model.liveState) {
      renderUnavailable(status, checklist, 'The live Natural Nation repository context has not loaded yet.');
      return;
    }

    const branchUrl = `${REPOSITORY_URL}/tree/${encodeURIComponent(DEFAULT_BRANCH)}`;
    const checksUrl = model.pr ? `${model.prUrl}/checks` : ACTIONS_URL;

    status.innerHTML = [
      statusCard('Repository', REPOSITORY, 'Canonical GitHub source of truth'),
      statusCard('Branch', DEFAULT_BRANCH, 'Protected production branch'),
      statusCard('Pull request', model.pr ? `#${model.pr}` : 'Not recorded', model.prUrl ? 'Canonical implementation evidence found' : 'No pull-request URL is recorded'),
      statusCard('Merge readiness', model.mergeReady ? 'Ready for handoff' : 'Blocked', model.mergeReady ? 'All recorded Founder OS gates passed' : 'One or more required gates remain incomplete')
    ].join('');

    checklist.innerHTML = `
      <article class="module-card repository-action-card">
        <div class="repository-card-header"><div><span class="eyebrow">Founder repository actions</span><h3>Open authoritative engineering records</h3></div><span class="status">Read only</span></div>
        <div class="repository-action-grid">
          ${linkButton('Open repository', REPOSITORY_URL)}
          ${linkButton('Open branch', branchUrl)}
          ${linkButton('Open pull request', model.prUrl || REPOSITORY_URL, !model.prUrl)}
          ${linkButton('Open checks', checksUrl)}
          ${linkButton('Open deployments', DEPLOYMENTS_URL)}
        </div>
      </article>
      <article class="module-card">
        <div class="repository-card-header"><div><span class="eyebrow">Merge readiness</span><h3>${model.mergeReady ? 'Founder merge handoff is ready' : 'Merge handoff remains blocked'}</h3></div><span class="status">${model.mergeReady ? 'READY' : 'BLOCKED'}</span></div>
        ${gate('Live orchestration state', model.liveState, 'Workspace and package match Natural Nation / NN-BUILD-001.')}
        ${gate('Implementation pull request', Boolean(model.prUrl), model.prUrl ? `Pull request #${model.pr} is recorded.` : 'No canonical pull request is recorded.')}
        ${gate('Task completion', model.allTasksComplete, model.allTasksComplete ? 'All canonical tasks are complete.' : 'At least one canonical task remains incomplete.')}
        ${gate('Independent review evidence', model.reviewEvidence, model.reviewEvidence ? 'Gemini and GPose review tasks are complete.' : 'Required independent review evidence is incomplete.')}
        ${gate('Founder approval', model.founderApproved, model.founderApproved ? 'Founder approval is recorded.' : 'Founder approval has not been recorded.')}
        <div class="repository-merge-handoff">
          <button class="generate" type="button" data-repository-merge-handoff ${model.mergeReady ? '' : 'disabled aria-disabled="true"'}>Prepare Founder Merge Handoff</button>
          <p class="muted">This control never merges automatically. It opens the authoritative pull request after confirming the recorded gates.</p>
        </div>
      </article>
      <article class="module-card">
        <div class="repository-card-header"><div><span class="eyebrow">Changed files</span><h3>Recorded implementation evidence</h3></div><span class="status">${model.files.length} FILE${model.files.length === 1 ? '' : 'S'}</span></div>
        ${fileList(model.files)}
      </article>`;

    $('[data-repository-merge-handoff]')?.addEventListener('click', () => {
      if (!model.mergeReady || !model.prUrl) return;
      const confirmed = window.confirm('All recorded Founder OS gates passed. Open the authoritative GitHub pull request for your final merge decision? No merge will happen automatically.');
      if (confirmed) window.open(model.prUrl, '_blank', 'noopener');
    });
  }

  function scheduleRender() { window.setTimeout(renderRepositoryIntelligence, 60); }
  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'repo') scheduleRender();
  });
  window.addEventListener('founder-os:runtime-state-changed', scheduleRender);
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-context-module="repo"]')) scheduleRender();
  }, true);

  window.NNOSRepositoryActions = { render: renderRepositoryIntelligence, get model() { return repositoryState(); } };
  scheduleRender();
})();
