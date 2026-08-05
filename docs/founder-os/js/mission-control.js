const missionSignals = [
  ['Project Health', 'Healthy', 'Release 3 foundation is implemented and in final validation.'],
  ['Release 3', 'Executive Review', 'All planned workspaces and cross-workspace checks have passed Founder validation.'],
  ['Validation Progress', 'Final Gate', 'Executive Review is now actionable inside Mission Control.'],
  ['Repository Sync', 'Synchronized', 'Project State, Session Log, validation events, Decision Ledger, and Validation Center are aligned.'],
  ['Current Initiative', 'Executive Review', 'Review release readiness and use the supporting controls before closeout.'],
  ['Next Up', 'Release 3 Closeout', 'After Executive Review passes, prepare the synchronized release closeout package.'],
];

const executiveReview = [
  ['Release Status', 'Ready for Review', 'Release 3 Foundation has passed all implementation and layout validations.', 'knowledge', 'Open Product Records'],
  ['Validation Summary', 'PASS', 'Build Studio, Knowledge Graph, Repository Intelligence, Mission Control, AI Operations, Navigation, Action Bar, and iPad Layout passed.', 'repo', 'Open Validation Status'],
  ['Repository Sync', 'PASS', 'Project State, Session Log, validation events, and release records are synchronized.', 'repo', 'Open Code Status'],
  ['Knowledge Base Sync', 'PASS', 'Founder OS knowledge records reference canonical source-of-truth documents.', 'knowledge', 'Open Product Records'],
  ['Decision Ledger', 'READY', 'Final release approval can be recorded during closeout.', 'knowledge', 'Open Decision Records'],
  ['Validation Center', 'READY', 'Final validation result can be recorded during closeout.', 'repo', 'Open Validation Status'],
  ['Blockers', 'None Known', 'No blocking issues are currently reported.', 'repo', 'Open Blocker Status'],
];

const closeoutActions = [
  ['Run Closeout Readiness Check', 'Action', 'Check visible release readiness conditions before closeout.', 'run-closeout-check'],
  ['Prepare Release 3 Closeout', 'Action', 'Prepare the final closeout sequence for repository synchronization.', 'prepare-closeout'],
  ['Review Repository Sync', 'Action', 'Open Code Status before closeout.', 'open-repo'],
];

const attentionItems = [
  ['Validate Executive Review actions', 'Founder', 'Confirm the review panel includes active supporting controls and action results.'],
  ['Approve Release 3 Closeout', 'Founder', 'After Executive Review passes, approve the final synchronized closeout.'],
];

const recentChanges = [
  ['Workspace Navigation', 'PASS', 'Founder validated switching across core workspaces.'],
  ['Bottom Action Bar', 'PASS', 'Founder validated build status actions appear only in Build Work.'],
  ['iPad Layout', 'PASS', 'Founder validated portrait and landscape layouts.'],
  ['Founder Action Layer', 'PASS', 'Mission Control now uses owned controls without inline handlers or legacy hashes.'],
];

const pendingDecisions = [
  ['Executive Review approval', 'Pending', 'Awaiting Founder validation of visible panel, active controls, and actions.'],
  ['Release 3 closeout approval', 'Pending', 'Requires Executive Review PASS before final closeout.'],
];

const activeRisks = [
  ['Executive Review actions', 'Resolved', 'Supporting controls route through the canonical Navigation Manager.'],
  ['Release Closeout', 'Pending', 'Final records still need to be synchronized after Executive Review passes.'],
  ['Duplicate Data Risk', 'Low', 'SSOT standard and reference-based records reduce duplication risk.'],
];

function missionCard(title, value, detail) {
  return `<div class="module-card"><strong>${title}</strong><div class="section-title">${value}</div><p class="muted">${detail}</p></div>`;
}

function missionRow(title, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span></div>`;
}

function missionViewRow(title, status, detail, target, label) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span><button class="status" type="button" data-mission-view="${target}">${label}</button></div>`;
}

function missionControlAction(title, status, detail, action) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span><button class="btn small" type="button" data-mission-action="${action}">Run</button></div>`;
}

function missionAction(title, owner, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><span class="status">Next</span></div>`;
}

function openView(target, source) {
  return window.NNOSNavigationManager?.openView?.(target, source || 'mission-control') || false;
}

function renderMissionControlRuntime() {
  const cards = document.querySelector('[data-mission-cards]');
  const queue = document.querySelector('[data-action-queue]');
  if (!cards || !queue) return;

  cards.innerHTML = missionSignals.map(([title, value, detail]) => missionCard(title, value, detail)).join('');
  queue.innerHTML = `<div data-mission-action-output></div><div class="module-card"><strong>Executive Review</strong><p class="muted">Final Founder review gate before Release 3 closeout.</p>${executiveReview.map(([title, status, detail, target, label]) => missionViewRow(title, status, detail, target, label)).join('')}</div><div class="module-card"><strong>Closeout Readiness</strong>${closeoutActions.map(([title, status, detail, action]) => missionControlAction(title, status, detail, action)).join('')}</div><div class="module-card"><strong>What Requires Attention Now</strong>${attentionItems.map(([title, owner, detail]) => missionAction(title, owner, detail)).join('')}</div><div class="module-card"><strong>What Changed Recently</strong>${recentChanges.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Pending Founder Decisions</strong>${pendingDecisions.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Active Risks</strong>${activeRisks.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div>`;
}

document.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-mission-view]');
  if (viewButton) {
    event.preventDefault();
    openView(viewButton.dataset.missionView, 'mission-supporting-control');
    return;
  }

  const actionButton = event.target.closest('[data-mission-action]');
  if (!actionButton) return;
  event.preventDefault();
  const action = actionButton.dataset.missionAction;
  if (action === 'run-closeout-check') window.NNOSActions?.runCloseoutCheck?.();
  if (action === 'prepare-closeout') window.NNOSActions?.prepareReleaseCloseout?.();
  if (action === 'open-repo') openView('repo', 'mission-closeout-action');
});

window.addEventListener('founder-os:workspace-view-changed', (event) => {
  if (event.detail?.target === 'mission') renderMissionControlRuntime();
});

renderMissionControlRuntime();
setTimeout(renderMissionControlRuntime, 300);
