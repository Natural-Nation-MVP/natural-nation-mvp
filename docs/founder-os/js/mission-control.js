const missionSignals = [
  ['Project Health', 'Healthy', 'Core Founder OS pillars are implemented and active for Release 3 validation.'],
  ['Release 3', 'Founder Validation', 'Build Studio, Knowledge Graph, Repository Intelligence, Mission Control, and AI Operations foundations are in place.'],
  ['Validation Progress', '4 Passed', 'Build Studio, Knowledge Graph, SSOT foundations, and Repository Intelligence have passed Founder validation.'],
  ['Repository Sync', 'Synchronized', 'Project State, Knowledge Index, Roadmap, Session Log, Decision Ledger, and Validation Center are aligned.'],
  ['Current Initiative', 'Mission Control 2.0', 'Executive command center now summarizes what needs attention, what changed, and what to do next.'],
  ['Next Up', 'AI Operations Validation', 'After Mission Control passes, validate AI Operations and cross-workspace behavior.'],
];

const attentionItems = [
  ['Validate Mission Control 2.0', 'Founder', 'Confirm executive questions, status cards, priorities, decisions, and risks are clear.'],
  ['Validate AI Operations', 'Founder', 'Confirm AI roles, handoff queue, and operating standards are readable.'],
  ['Validate Navigation + Action Bar', 'Founder', 'Confirm workspace switching works and Generate Package only appears in Build Studio.'],
  ['Validate iPad Layout', 'Founder', 'Confirm portrait and landscape usability.'],
];

const recentChanges = [
  ['Knowledge Graph', 'PASS', 'Open Document, Open on GitHub, and Related Records were fixed and revalidated.'],
  ['SSOT Foundation', 'PASS', 'Single Source of Truth, Decision Ledger, and Validation Center foundations were added and validated.'],
  ['Repository Intelligence', 'PASS', 'SSOT health, synchronization checks, and repository risk snapshot were added and validated.'],
  ['Mission Control', 'RETEST', 'Executive dashboard has been upgraded for validation.'],
];

const pendingDecisions = [
  ['Mission Control 2.0 approval', 'Pending', 'Awaiting Founder validation on live GitHub Pages.'],
  ['Release 3 completion approval', 'Pending', 'Requires remaining workspace, navigation, action bar, iPad, and executive review validation.'],
  ['Validation Center runtime build', 'Future', 'Foundation exists; runtime UI can be built after Release 3 foundation validation.'],
];

const activeRisks = [
  ['Runtime Cache', 'Medium', 'Use cache-busting when JavaScript helpers change.'],
  ['Pending Validation', 'Medium', 'Mission Control, AI Operations, navigation, action bar, and iPad layout still need final validation.'],
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
  queue.innerHTML = `<div class="module-card"><strong>What Requires Attention Now</strong>${attentionItems.map(([title, owner, detail]) => missionAction(title, owner, detail)).join('')}</div><div class="module-card"><strong>What Changed Recently</strong>${recentChanges.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Pending Founder Decisions</strong>${pendingDecisions.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div><div class="module-card"><strong>Active Risks</strong>${activeRisks.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div>`;
}

function activateMissionControlRuntime() {
  renderMissionControlRuntime();
  document.querySelectorAll('[data-workspace-button="mission"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderMissionControlRuntime, 50)));
}

activateMissionControlRuntime();
setTimeout(renderMissionControlRuntime, 300);
