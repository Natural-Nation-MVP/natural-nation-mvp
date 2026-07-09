const repositorySignals = [
  ['Repository Health', 'Healthy', 'GitHub source of truth is active on main.'],
  ['Canonical Runtime', 'docs/founder-os/', 'Founder OS public runtime is published from the docs folder.'],
  ['Knowledge Base', 'Synchronized', 'docs/knowledge/INDEX.md is active as the canonical knowledge entry point.'],
  ['Build Studio', 'Validated', 'Package preview, queue metadata, and final polish are validated by Founder.'],
  ['Knowledge Graph', 'Active', 'Repository-backed knowledge records are rendering in Founder OS.'],
  ['Release 3', 'In Progress', 'Repository Intelligence is the active implementation milestone.'],
];

const syncItems = [
  ['Knowledge Base Foundation', 'Done', 'KB-001 foundation and core records are published.'],
  ['Continuous Sync Standard', 'Done', 'SYNC-STANDARD.md is active governance.'],
  ['Repository Intelligence Brief', 'Done', 'R3-REPOSITORY-INTELLIGENCE.md is approved.'],
  ['Mission Control Brief', 'Ready', 'R3-MISSION-CONTROL.md is ready for next milestone.'],
  ['AI Operations', 'Pending', 'Awaiting Repository Intelligence foundation.'],
];

const founderActions = [
  ['Validate Knowledge Graph', 'Confirm enhanced status card, categories, tags, and search.'],
  ['Review Repository Intelligence', 'Confirm repository health and sync status are readable.'],
  ['Proceed to Mission Control', 'After Repository Intelligence validation, begin executive dashboard.'],
];

function card(title, status, detail) {
  return `<div class="module-card"><strong>${title}</strong><div class="section-title">${status}</div><p class="muted">${detail}</p></div>`;
}

function row(title, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span></div>`;
}

function renderRepositoryIntelligence() {
  const status = document.querySelector('[data-repo-status]');
  const checklist = document.querySelector('[data-repo-checklist]');
  if (!status || !checklist) return;

  status.innerHTML = repositorySignals.map(([title, value, detail]) => card(title, value, detail)).join('');
  checklist.innerHTML = `<div class="module-card"><strong>Repository Status: Synchronized ✓</strong><p class="muted">Founder OS, Knowledge Base, roadmap, and session tracking are aligned under the Continuous Synchronization Standard.</p></div>${syncItems.map(([title, state, detail]) => row(title, state, detail)).join('')}<div class="module-card"><strong>Next Founder Actions</strong>${founderActions.map(([title, detail]) => row(title, 'Next', detail)).join('')}</div>`;
}

function activateRepositoryIntelligence() {
  renderRepositoryIntelligence();
  document.querySelectorAll('[data-workspace-button="repo"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderRepositoryIntelligence, 50)));
}

activateRepositoryIntelligence();
setTimeout(renderRepositoryIntelligence, 300);
