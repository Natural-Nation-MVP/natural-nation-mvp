const missionSignals = [
  ['Project Health', 'Ready', 'Founder OS core runtime is active and synchronized.'],
  ['Current Release', 'Release 3', 'Production workspace, Knowledge Graph, and Repository Intelligence are active.'],
  ['Knowledge Base', 'Active', 'GitHub Knowledge Base is the canonical source of truth.'],
  ['Build Studio', 'Validated', 'Build Studio is the production package-generation baseline.'],
  ['Repository Intel', 'Active', 'Repository status and sync checks are now available.'],
  ['Next Milestone', 'Mission Control', 'Executive overview and decision dashboard are now being implemented.'],
];

const founderPriorities = [
  ['Validate workspace action bar', 'Confirm Generate Package only appears in Build Studio.'],
  ['Validate Repository Intel', 'Confirm health cards and sync checklist load correctly.'],
  ['Validate Knowledge Graph', 'Confirm categories, related tags, and repository status render.'],
  ['Proceed to AI Operations', 'Begin agent handoff dashboard after Mission Control foundation.'],
];

const activeRisks = [
  ['Documentation Drift', 'Low', 'Continuous sync standard is active.'],
  ['Runtime Cache', 'Medium', 'Use cache-busting when scripts change.'],
  ['Module Completeness', 'Medium', 'AI Operations and Mission Control still need expansion.'],
];

function missionCard(title, value, detail) {
  return `<div class="module-card"><strong>${title}</strong><div class="section-title">${value}</div><p class="muted">${detail}</p></div>`;
}

function missionRow(title, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span></div>`;
}

function renderMissionControlRuntime() {
  const cards = document.querySelector('[data-mission-cards]');
  const queue = document.querySelector('[data-action-queue]');
  if (!cards || !queue) return;

  cards.innerHTML = missionSignals.map(([title, value, detail]) => missionCard(title, value, detail)).join('');
  queue.innerHTML = `<div class="module-card"><strong>Founder Priorities</strong>${founderPriorities.map(([title, detail]) => missionRow(title, 'Next', detail)).join('')}</div><div class="module-card"><strong>Active Risks</strong>${activeRisks.map(([title, status, detail]) => missionRow(title, status, detail)).join('')}</div>`;
}

function activateMissionControlRuntime() {
  renderMissionControlRuntime();
  document.querySelectorAll('[data-workspace-button="mission"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderMissionControlRuntime, 50)));
}

activateMissionControlRuntime();
setTimeout(renderMissionControlRuntime, 300);
