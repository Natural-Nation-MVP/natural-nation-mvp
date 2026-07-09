const missionSignals = [
  ['Project Health', 'Healthy', 'Release 3 foundation is implemented and in final validation.'],
  ['Release 3', 'Executive Review', 'All planned workspaces and cross-workspace checks have passed Founder validation.'],
  ['Validation Progress', 'Final Gate', 'Executive Review is now surfaced inside Mission Control for Founder validation.'],
  ['Repository Sync', 'Synchronized', 'Project State, Session Log, validation events, Decision Ledger, and Validation Center are aligned.'],
  ['Current Initiative', 'Executive Review', 'Review release readiness and confirm there are no blockers before closeout.'],
  ['Next Up', 'Release 3 Closeout', 'After Executive Review passes, perform final synchronized release closeout.'],
];

const executiveReview = [
  ['Release Status', 'Ready for Review', 'Release 3 Foundation has passed all implementation and layout validations.'],
  ['Validation Summary', 'PASS', 'Build Studio, Knowledge Graph, Repository Intelligence, Mission Control, AI Operations, Navigation, Action Bar, and iPad Layout passed.'],
  ['Repository Sync', 'PASS', 'Project State, Session Log, validation events, and release records are synchronized.'],
  ['Knowledge Base Sync', 'PASS', 'Founder OS knowledge records reference canonical source-of-truth documents.'],
  ['Decision Ledger', 'READY', 'Final release approval can be recorded during closeout.'],
  ['Validation Center', 'READY', 'Final validation result can be recorded during closeout.'],
  ['Blockers', 'None Known', 'No blocking issues are currently reported.'],
];

const attentionItems = [
  ['Validate Executive Review in Mission Control', 'Founder', 'Confirm the review panel is visible and answers the final release questions.'],
  ['Approve Release 3 Closeout', 'Founder', 'After Executive Review passes, approve the final synchronized closeout.'],
];

const recentChanges = [
  ['Workspace Navigation', 'PASS', 'Founder validated switching across core workspaces.'],
  ['Bottom Action Bar', 'PASS', 'Founder validated Generate Package appears only in Build Studio.'],
  ['iPad Layout', 'PASS', 'Founder validated portrait and landscape layouts.'],
  ['Executive Review UI', 'RETEST', 'Executive Review is now accessible inside Mission Control.'],
];

const pendingDecisions = [
  ['Executive Review approval', 'Pending', 'Awaiting Founder validation in Mission Control.'],
  ['Release 3 closeout approval', 'Pending', 'Requires Executive Review PASS before final closeout.'],
];

const activeRisks = [
  ['Executive Review accessibility', 'Fixed', 'Executive Review is now surfaced inside Mission Control instead of only as a Markdown file.'],
  ['Release Closeout', 'Pending', 'Final records still need to be synchronized after Executive Review passes.'],
  ['Duplicate Data Risk', 'Low', 'SSOT standard and reference-based records reduce duplication risk.'],
];

function missionCard(title, value, detail) {
  return `<div class="module-card"><strong>${title}</strong><div class="section-title">${value}</div><p class="muted">${detail}</p></div>`;
}

function missionRow(title, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span></div>`;
}

function missionAction(title, owner, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><span class="status">Next</span></div>`;
}

function renderMissionControlRuntime() {
  const cards = document.querySelector('[data-mission-cards]');
  const queue = document.querySelector('[data-action-queue]');
  if (!cards || !queue) return;

  cards.innerHTML = missionSignals.map(([title, value, detail]) => missionCard(title, value, detail)).join('');
  queue.innerHTML = `<div class="module-card"><strong>Executive Review</strong><p class="muted">Final Founder review gate before Release 3 closeout.</p>${executiveReview.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>What Requires Attention Now</strong>${attentionItems.map(([title, owner, detail]) => missionAction(title, owner, detail)).join('')}</div><div class="module-card"><strong>What Changed Recently</strong>${recentChanges.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Pending Founder Decisions</strong>${pendingDecisions.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Active Risks</strong>${activeRisks.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div>`;
}

function activateMissionControlRuntime() {
  renderMissionControlRuntime();
  document.querySelectorAll('[data-workspace-button="mission"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderMissionControlRuntime, 50)));
}

activateMissionControlRuntime();
setTimeout(renderMissionControlRuntime, 300);
