(() => {
  const REPOSITORY = 'Natural-Nation-MVP/natural-nation-mvp';
  const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
  const ACTIONS_URL = `${REPOSITORY_URL}/actions`;
  const DEPLOYMENTS_URL = `${REPOSITORY_URL}/deployments`;
  const DEFAULT_BRANCH = 'main';

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

  function parseChangedFiles(state) {
    for (const task of state?.tasks || []) {
      const match = String(task.resultSummary || '').match(/Changed files:\s*([^.]*(?:\.[a-z0-9]+(?:,\s*|$))+)/i);
      if (match) return match[1].split(',').map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }

  function currentPullRequest() {
    const context = window.NNOSRepositoryReviewContext || null;
    if (!context || context.repository !== REPOSITORY) return null;
    if (!Number.isInteger(Number(context.number)) || !context.url || !context.headSha) return null;
    return {
      number: Number(context.number),
      url: String(context.url),
      state: String(context.state || '').toLowerCase(),
      mergeable: context.mergeable === true,
      checksPassed: context.checksPassed === true,
      headSha: String(context.headSha),
      reviewedHeadSha: String(context.reviewedHeadSha || ''),
      founderApprovedHeadSha: String(context.founderApprovedHeadSha || ''),
      changedFiles: Array.isArray(context.changedFiles) ? context.changedFiles : [],
      merged: context.merged === true || String(context.state || '').toLowerCase() === 'merged',
      mergedAt: context.mergedAt ? String(context.mergedAt) : '',
      mergeCommitSha: context.mergeCommitSha ? String(context.mergeCommitSha) : '',
      deploymentStatus: String(context.deploymentStatus || '').toLowerCase()
    };
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
    if (!files.length) return '<p class="muted">No changed-file evidence is recorded for the active reviewed pull request.</p>';
    return `<ul class="repository-file-list">${files.map((file) => `<li><code>${esc(file)}</code></li>`).join('')}</ul>`;
  }

  function repositoryState() {
    const state = window.NNOSCanonicalBuild?.state || window.NNOSRuntimeState?.snapshot?.orchestration || null;
    const pkg = window.NNOSCanonicalBuild?.package || null;
    const pr = currentPullRequest();
    const files = pr?.changedFiles?.length ? pr.changedFiles : parseChangedFiles(state);
    const allTasksComplete = Boolean(state?.tasks?.length) && state.tasks.every((task) => task.status === 'complete');
    const reviewEvidence = Boolean(pr && pr.reviewedHeadSha === pr.headSha);
    const founderApproved = Boolean(pr && pr.founderApprovedHeadSha === pr.headSha);
    const packageReady = pkg?.status === 'ready' || state?.packageId === 'NN-BUILD-001';
    const liveState = Boolean(state?.workspaceId === 'natural-nation' && state?.packageId === 'NN-BUILD-001');
    const prOpen = pr?.state === 'open';
    const prMergeable = pr?.mergeable === true;
    const checksPassed = pr?.checksPassed === true;
    const mergeReady = Boolean(liveState && pr && prOpen && prMergeable && checksPassed && allTasksComplete && reviewEvidence && founderApproved && packageReady);
    const mergeComplete = Boolean(pr?.merged && pr?.mergeCommitSha);
    const deploymentComplete = pr?.deploymentStatus === 'success';
    return { state, pkg, pr, files, allTasksComplete, reviewEvidence, founderApproved, packageReady, liveState, prOpen, prMergeable, checksPassed, mergeReady, mergeComplete, deploymentComplete };
  }

  function renderUnavailable(status, checklist, message) {
    status.innerHTML = statusCard('Repository status', 'Unavailable', message);
    checklist.innerHTML = `<article class="module-card"><h3>Safe unavailable state</h3><p class="muted">Repository actions remain disabled until an active reviewed pull-request context loads.</p>${linkButton('Open GitHub repository', REPOSITORY_URL)}</article>`;
  }

  function renderCompletedState(status, checklist, model) {
    const mergeCommitUrl = `${REPOSITORY_URL}/commit/${encodeURIComponent(model.pr.mergeCommitSha)}`;
    status.innerHTML = [
      statusCard('Repository', REPOSITORY, 'Canonical GitHub source of truth'),
      statusCard('Branch', DEFAULT_BRANCH, 'Protected production branch'),
      statusCard('Pull request', `#${model.pr.number} merged`, model.pr.mergedAt ? `Merged ${model.pr.mergedAt}` : 'Reviewed pull request is merged'),
      statusCard('Repository lifecycle', model.deploymentComplete ? 'Complete' : 'Merged', model.deploymentComplete ? 'Merge and deployment are complete' : 'Merge completed; deployment confirmation is pending')
    ].join('');

    checklist.innerHTML = `
      <article class="module-card repository-action-card">
        <div class="repository-card-header"><div><span class="eyebrow">Founder repository actions</span><h3>Open authoritative completion records</h3></div><span class="status">COMPLETE</span></div>
        <div class="repository-action-grid">
          ${linkButton('Open repository', REPOSITORY_URL)}
          ${linkButton('Open branch', `${REPOSITORY_URL}/tree/${encodeURIComponent(DEFAULT_BRANCH)}`)}
          ${linkButton('Open merged pull request', model.pr.url)}
          ${linkButton('Open merge commit', mergeCommitUrl)}
          ${linkButton('Open deployments', DEPLOYMENTS_URL)}
        </div>
      </article>
      <article class="module-card">
        <div class="repository-card-header"><div><span class="eyebrow">Repository lifecycle</span><h3>Merge handoff completed</h3></div><span class="status">COMPLETE</span></div>
        ${gate('Live orchestration state', model.liveState, 'Workspace and package match Natural Nation / NN-BUILD-001.')}
        ${gate('Pull request merged', model.mergeComplete, `Pull request #${model.pr.number} merged at commit ${model.pr.mergeCommitSha.slice(0, 8)}.`)}
        ${gate('Task completion', model.allTasksComplete, model.allTasksComplete ? 'All canonical tasks are complete.' : 'At least one canonical task remains incomplete.')}
        ${gate('Independent review bound to head', model.reviewEvidence, model.reviewEvidence ? 'Independent review matches the reviewed head SHA.' : 'Independent review does not match the reviewed head SHA.')}
        ${gate('Founder approval bound to head', model.founderApproved, model.founderApproved ? 'Founder approval matches the reviewed head SHA.' : 'Founder approval does not match the reviewed head SHA.')}
        ${gate('Deployment complete', model.deploymentComplete, model.deploymentComplete ? 'The merged release is deployed successfully.' : 'Deployment confirmation has not been recorded yet.')}
      </article>
      <article class="module-card">
        <div class="repository-card-header"><div><span class="eyebrow">Changed files</span><h3>Merged implementation evidence</h3></div><span class="status">${model.files.length} FILE${model.files.length === 1 ? '' : 'S'}</span></div>
        ${fileList(model.files)}
      </article>`;
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
    if (model.mergeComplete) {
      renderCompletedState(status, checklist, model);
      return;
    }

    const branchUrl = `${REPOSITORY_URL}/tree/${encodeURIComponent(DEFAULT_BRANCH)}`;
    const checksUrl = model.pr ? `${model.pr.url}/checks` : ACTIONS_URL;

    status.innerHTML = [
      statusCard('Repository', REPOSITORY, 'Canonical GitHub source of truth'),
      statusCard('Branch', DEFAULT_BRANCH, 'Protected production branch'),
      statusCard('Pull request', model.pr ? `#${model.pr.number}` : 'Not recorded', model.pr ? `Active reviewed head ${model.pr.headSha.slice(0, 8)}` : 'No active reviewed pull request is loaded'),
      statusCard('Merge readiness', model.mergeReady ? 'Ready for handoff' : 'Blocked', model.mergeReady ? 'All active-PR and reviewed-head gates passed' : 'One or more active-PR gates remain incomplete')
    ].join('');

    checklist.innerHTML = `
      <article class="module-card repository-action-card">
        <div class="repository-card-header"><div><span class="eyebrow">Founder repository actions</span><h3>Open authoritative engineering records</h3></div><span class="status">Read only</span></div>
        <div class="repository-action-grid">
          ${linkButton('Open repository', REPOSITORY_URL)}
          ${linkButton('Open branch', branchUrl)}
          ${linkButton('Open pull request', model.pr?.url || REPOSITORY_URL, !model.pr)}
          ${linkButton('Open checks', checksUrl, !model.pr)}
          ${linkButton('Open deployments', DEPLOYMENTS_URL)}
        </div>
      </article>
      <article class="module-card">
        <div class="repository-card-header"><div><span class="eyebrow">Merge readiness</span><h3>${model.mergeReady ? 'Founder merge handoff is ready' : 'Merge handoff remains blocked'}</h3></div><span class="status">${model.mergeReady ? 'READY' : 'BLOCKED'}</span></div>
        ${gate('Live orchestration state', model.liveState, 'Workspace and package match Natural Nation / NN-BUILD-001.')}
        ${gate('Active pull request', Boolean(model.pr), model.pr ? `Pull request #${model.pr.number} and head ${model.pr.headSha.slice(0, 8)} are loaded.` : 'No active reviewed pull request context is loaded.')}
        ${gate('Pull request is open', model.prOpen, model.prOpen ? 'The active pull request remains open.' : 'The active pull request is not open.')}
        ${gate('Pull request is mergeable', model.prMergeable, model.prMergeable ? 'GitHub reports the active pull request as mergeable.' : 'GitHub does not report the active pull request as mergeable.')}
        ${gate('Checks passed', model.checksPassed, model.checksPassed ? 'Required checks passed for the active head SHA.' : 'Required checks have not passed for the active head SHA.')}
        ${gate('Task completion', model.allTasksComplete, model.allTasksComplete ? 'All canonical tasks are complete.' : 'At least one canonical task remains incomplete.')}
        ${gate('Independent review bound to head', model.reviewEvidence, model.reviewEvidence ? 'Independent review is bound to the active head SHA.' : 'Independent review is not bound to the active head SHA.')}
        ${gate('Founder approval bound to head', model.founderApproved, model.founderApproved ? 'Founder approval is bound to the active head SHA.' : 'Founder approval is not bound to the active head SHA.')}
        <div class="repository-merge-handoff">
          <button class="generate" type="button" data-repository-merge-handoff ${model.mergeReady ? '' : 'disabled aria-disabled="true"'}>Prepare Founder Merge Handoff</button>
          <p class="muted">This control never merges automatically. It opens only the active pull request whose head SHA passed every recorded gate.</p>
        </div>
      </article>
      <article class="module-card">
        <div class="repository-card-header"><div><span class="eyebrow">Changed files</span><h3>Active pull-request evidence</h3></div><span class="status">${model.files.length} FILE${model.files.length === 1 ? '' : 'S'}</span></div>
        ${fileList(model.files)}
      </article>`;

    $('[data-repository-merge-handoff]')?.addEventListener('click', () => {
      if (!model.mergeReady || !model.pr?.url) return;
      const confirmed = window.confirm(`All gates passed for PR #${model.pr.number} at head ${model.pr.headSha.slice(0, 8)}. Open GitHub for your final merge decision? No merge will happen automatically.`);
      if (confirmed) window.open(model.pr.url, '_blank', 'noopener');
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