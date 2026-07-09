const missionSignals = [
  ['Project Health', 'Healthy', 'Release 3 foundation is implemented and in final validation.'],
  ['Release 3', 'Executive Review', 'All planned workspaces and cross-workspace checks have passed Founder validation.'],
  ['Validation Progress', 'Final Gate', 'Executive Review is now actionable inside Mission Control.'],
  ['Repository Sync', 'Synchronized', 'Project State, Session Log, validation events, Decision Ledger, and Validation Center are aligned.'],
  ['Current Initiative', 'Executive Review', 'Review release readiness and use the supporting links before closeout.'],
  ['Next Up', 'Release 3 Closeout', 'After Executive Review passes, perform final synchronized release closeout.'],
];

const executiveReview = [
  ['Release Status', 'Ready for Review', 'Release 3 Foundation has passed all implementation and layout validations.', '../releases/EXECUTIVE-REVIEW-RELEASE-3.md', 'View Release Details'],
  ['Validation Summary', 'PASS', 'Build Studio, Knowledge Graph, Repository Intelligence, Mission Control, AI Operations, Navigation, Action Bar, and iPad Layout passed.', '../releases/RELEASE-3-VALIDATION-STATUS.md', 'Open Validation Status'],
  ['Repository Sync', 'PASS', 'Project State, Session Log, validation events, and release records are synchronized.', '#repo', 'Open Repository Intelligence'],
  ['Knowledge Base Sync', 'PASS', 'Founder OS knowledge records reference canonical source-of-truth documents.', '#knowledge', 'Open Knowledge Graph'],
  ['Decision Ledger', 'READY', 'Final release approval can be recorded during closeout.', '../decisions/DECISION-LEDGER.md', 'Open Decision Ledger'],
  ['Validation Center', 'READY', 'Final validation result can be recorded during closeout.', '../releases/VALIDATION-CENTER.md', 'Open Validation Center'],
  ['Blockers', 'None Known', 'No blocking issues are currently reported.', '../releases/VALIDATION-FINDING-EXECUTIVE-REVIEW-UI.md', 'View Finding Record'],
];

const closeoutActions = [
  ['Complete Release 3', 'Ready After PASS', 'Use after Founder marks Executive Review PASS. Closeout will synchronize roadmap, validation records, Decision Ledger, Project State, and Session Log.', '../releases/EXECUTIVE-REVIEW-RELEASE-3.md', 'Review Before Closeout'],
];

const attentionItems = [
  ['Validate Executive Review actions', 'Founder', 'Confirm the review panel includes active supporting links.'],
  ['Approve Release 3 Closeout', 'Founder', 'After Executive Review passes, approve the final synchronized closeout.'],
];

const recentChanges = [
  ['Workspace Navigation', 'PASS', 'Founder validated switching across core workspaces.'],
  ['Bottom Action Bar', 'PASS', 'Founder validated Generate Package appears only in Build Studio.'],
  ['iPad Layout', 'PASS', 'Founder validated portrait and landscape layouts.'],
  ['Executive Review Actions', 'RETEST', 'Executive Review now includes active supporting links.'],
];

const pendingDecisions = [
  ['Executive Review approval', 'Pending', 'Awaiting Founder validation of visible panel and active links.'],
  ['Release 3 closeout approval', 'Pending', 'Requires Executive Review PASS before final closeout.'],
];

const activeRisks = [
  ['Executive Review actions', 'Fixed', 'Supporting links were added to the Mission Control Executive Review panel.'],
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
  queue.innerHTML = `<div class="module-card"><strong>Executive Review</strong><p class="muted">Final Founder review gate before Release 3 closeout.</p>${executiveReview.map(([title, status, detail, href, label]) => missionLinkedRow(title, status, detail, href, label)).join('')}</div><div class="module-card"><strong>Closeout Readiness</strong>${closeoutActions.map(([title, status, detail, href, label]) => missionLinkedRow(title, status, detail, href, label)).join('')}</div><div class="module-card"><strong>What Requires Attention Now</strong>${attentionItems.map(([title, owner, detail]) => missionAction(title, owner, detail)).join('')}</div><div class="module-card"><strong>What Changed Recently</strong>${recentChanges.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Pending Founder Decisions</strong>${pendingDecisions.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Active Risks</strong>${activeRisks.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div>`;
}

function activateMissionControlRuntime() {
  renderMissionControlRuntime();
  document.querySelectorAll('[data-workspace-button="mission"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderMissionControlRuntime, 50)));
  window.addEventListener('hashchange', openWorkspaceFromHash);
  openWorkspaceFromHash();
}

activateMissionControlRuntime();
setTimeout(renderMissionControlRuntime, 300);
