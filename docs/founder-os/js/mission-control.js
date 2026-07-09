const missionSignals = [
  ['Project Health', 'Healthy', 'Release 3 foundation is implemented and in final validation.'],
  ['Release 3', 'Executive Review', 'All planned workspaces and cross-workspace checks have passed Founder validation.'],
  ['Validation Progress', 'Final Gate', 'Executive Review is now actionable inside Mission Control.'],
  ['Repository Sync', 'Synchronized', 'Project State, Session Log, validation events, Decision Ledger, and Validation Center are aligned.'],
  ['Current Initiative', 'Executive Review', 'Review release readiness and use the supporting links before closeout.'],
  ['Next Up', 'Release 3 Closeout', 'After Executive Review passes, prepare the synchronized release closeout package.'],
];

const executiveReview = [
  ['Release Status', 'Ready for Review', 'Release 3 Foundation has passed all implementation and layout validations.', '../releases/EXECUTIVE-REVIEW-RELEASE-3.md', 'View Release Details'],
  ['Validation Summary', 'PASS', 'Build Studio, Knowledge Graph, Repository Intelligence, Mission Control, AI Operations, Navigation, Action Bar, and iPad Layout passed.', '../releases/RELEASE-3-VALIDATION-STATUS.md', 'Open Validation Status'],
  ['Repository Sync', 'PASS', 'Project State, Session Log, validation events, and release records are synchronized.', '#repo', 'Open Repository Intelligence'],
  ['Knowledge Base Sync', 'PASS', 'Founder OS knowledge records reference canonical source-of-truth documents.', '#knowledge', 'Open Knowledge Graph'],
  ['Decision Ledger', 'READY', 'Final release approval can be recorded during closeout.', '../decisions/DECISION-LEDGER.md', 'Open Decision Ledger'],
  ['Validation Center', 'READY', 'Final validation result can be recorded during closeout.', '../releases/VALIDATION-CENTER.md', 'Open Validation Center'],
  ['Blockers', 'None Known', 'No blocking issues are currently reported.', '../releases/VALIDATION-FINDING-EXECUTIVE-REVIEW-ACTIONS.md', 'View Finding Record'],
];

const closeoutActions = [
  ['Run Closeout Readiness Check', 'Action', 'Check visible release readiness conditions before closeout.', 'NNOSActions.runCloseoutCheck()'],
  ['Prepare Release 3 Closeout', 'Action', 'Prepare the final closeout sequence for repository synchronization.', 'NNOSActions.prepareReleaseCloseout()'],
  ['Review Repository Sync', 'Action', 'Jump to Repository Intelligence before closeout.', "NNOSActions.switchWorkspace('repo')"],
];

const attentionItems = [
  ['Validate Executive Review actions', 'Founder', 'Confirm the review panel includes active supporting links and action controls.'],
  ['Approve Release 3 Closeout', 'Founder', 'After Executive Review passes, approve the final synchronized closeout.'],
];

const recentChanges = [
  ['Workspace Navigation', 'PASS', 'Founder validated switching across core workspaces.'],
  ['Bottom Action Bar', 'PASS', 'Founder validated Generate Package appears only in Build Studio.'],
  ['iPad Layout', 'PASS', 'Founder validated portrait and landscape layouts.'],
  ['Founder Action Layer', 'RETEST', 'Mission Control now includes closeout action controls.'],
];

const pendingDecisions = [
  ['Executive Review approval', 'Pending', 'Awaiting Founder validation of visible panel, active links, and actions.'],
  ['Release 3 closeout approval', 'Pending', 'Requires Executive Review PASS before final closeout.'],
];

const activeRisks = [
  ['Executive Review actions', 'Fixed', 'Supporting links and action controls were added to Mission Control.'],
  ['Release Closeout', 'Pending', 'Final records still need to be synchronized after Executive Review passes.'],
  ['Duplicate Data Risk', 'Low', 'SSOT standard and reference-based records reduce duplication risk.'],
];

function missionCard(title, value, detail) {
  return `<div class="module-card"><strong>${title}</strong><div class="section-title">${value}</div><p class="muted">${detail}</p></div>`;
}

function missionRow(title, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span></div>`;
}

function missionLinkedRow(title, status, detail, href, label) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span><a class="status" href="${href}">${label}</a></div>`;
}

function missionControlAction(title, status, detail, action) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span><button class="btn small" onclick="${action}">Run</button></div>`;
}

function missionAction(title, owner, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><span class="status">Next</span></div>`;
}

function openWorkspaceFromHash() {
  const target = window.location.hash.replace('#', '');
  if (!target) return;
  const button = document.querySelector(`[data-workspace-button="${target}"]`);
  if (button) button.click();
}

function renderMissionControlRuntime() {
  const cards = document.querySelector('[data-mission-cards]');
  const queue = document.querySelector('[data-action-queue]');
  if (!cards || !queue) return;

  cards.innerHTML = missionSignals.map(([title, value, detail]) => missionCard(title, value, detail)).join('');
  queue.innerHTML = `<div data-mission-action-output></div><div class="module-card"><strong>Executive Review</strong><p class="muted">Final Founder review gate before Release 3 closeout.</p>${executiveReview.map(([title, status, detail, href, label]) => missionLinkedRow(title, status, detail, href, label)).join('')}</div><div class="module-card"><strong>Closeout Readiness</strong>${closeoutActions.map(([title, status, detail, action]) => missionControlAction(title, status, detail, action)).join('')}</div><div class="module-card"><strong>What Requires Attention Now</strong>${attentionItems.map(([title, owner, detail]) => missionAction(title, owner, detail)).join('')}</div><div class="module-card"><strong>What Changed Recently</strong>${recentChanges.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Pending Founder Decisions</strong>${pendingDecisions.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Active Risks</strong>${activeRisks.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div>`;
}

function activateMissionControlRuntime() {
  renderMissionControlRuntime();
  document.querySelectorAll('[data-workspace-button="mission"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderMissionControlRuntime, 50)));
  window.addEventListener('hashchange', openWorkspaceFromHash);
  openWorkspaceFromHash();
}

activateMissionControlRuntime();
setTimeout(renderMissionControlRuntime, 300);
