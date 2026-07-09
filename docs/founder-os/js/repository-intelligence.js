const repositorySignals = [
  ['Repository Health', 'Healthy', 'GitHub source of truth is active on main.'],
  ['Canonical Runtime', 'docs/founder-os/', 'Founder OS public runtime is published from the docs folder.'],
  ['Knowledge Base', 'Synced', 'docs/knowledge/INDEX.md is active as the canonical knowledge entry point.'],
  ['Single Source of Truth', 'Active', 'Founder OS uses references instead of duplicating project content.'],
  ['Decision Ledger', 'Active', 'Founder approvals are recorded as lightweight decision events.'],
  ['Validation Center', 'Active', 'Release validation is tracked as event records with canonical references.'],
];

const syncItems = [
  ['Knowledge Base Index', 'PASS', 'Canonical knowledge index includes SSOT, Decision Ledger, and Validation Center records.'],
  ['Project State', 'PASS', 'Project state points to validation checklist, Decision Ledger, and Validation Center.'],
  ['Session Log', 'PASS', 'Session log records the SSOT foundation build.'],
  ['Release 3 Roadmap', 'PASS', 'Roadmap is in Founder Validation and links the validation checklist.'],
  ['Knowledge Graph Links', 'PASS', 'Open Document, GitHub links, and Related Records were fixed and revalidated.'],
  ['Repository Intelligence', 'RETEST', 'This workspace is now upgraded for SSOT health and needs Founder validation.'],
];

const repositoryActions = [
  ['Validate Repository Intelligence', 'Founder', 'Confirm SSOT, Decision Ledger, Validation Center, and sync checks display clearly.'],
  ['Check Knowledge Graph SSOT Records', 'Founder', 'Search Single Source, Decision Ledger, and Validation Center.'],
  ['Continue Release 3 Validation', 'Founder', 'Proceed to Mission Control, AI Operations, navigation, action bar, and iPad layout.'],
];

const healthChecks = [
  ['Duplicate Data Risk', 'Low', 'SSOT standard assigns one canonical owner per information type.'],
  ['Unsynced Records', '0 Known', 'Latest project state, knowledge index, session log, and roadmap were synchronized.'],
  ['Open Validation Items', '6 Pending', 'Repository Intelligence, Mission Control, AI Operations, Navigation, Action Bar, and iPad Layout remain to validate.'],
  ['Critical Issues', '0 Known', 'Knowledge Graph Step 3 issue was fixed and passed Founder retest.'],
];

function card(title, status, detail) {
  return `<div class="module-card"><strong>${title}</strong><div class="section-title">${status}</div><p class="muted">${detail}</p></div>`;
}

function row(title, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span></div>`;
}

function actionRow(title, owner, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><span class="status">Next</span></div>`;
}

function renderRepositoryIntelligence() {
  const status = document.querySelector('[data-repo-status]');
  const checklist = document.querySelector('[data-repo-checklist]');
  if (!status || !checklist) return;

  status.innerHTML = repositorySignals.map(([title, value, detail]) => card(title, value, detail)).join('');
  checklist.innerHTML = `<div class="module-card"><strong>Repository Status: Synchronized ✓</strong><p class="muted">Founder OS is using canonical records and reference-based validation to reduce duplicate data risk.</p></div><div class="module-card"><strong>Synchronization Health</strong>${syncItems.map(([title, state, detail]) => row(title, state, detail)).join('')}</div><div class="module-card"><strong>Repository Risk Snapshot</strong>${healthChecks.map(([title, state, detail]) => row(title, state, detail)).join('')}</div><div class="module-card"><strong>Next Founder Actions</strong>${repositoryActions.map(([title, owner, detail]) => actionRow(title, owner, detail)).join('')}</div>`;
}

function activateRepositoryIntelligence() {
  renderRepositoryIntelligence();
  document.querySelectorAll('[data-workspace-button="repo"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderRepositoryIntelligence, 50)));
}

activateRepositoryIntelligence();
setTimeout(renderRepositoryIntelligence, 300);
