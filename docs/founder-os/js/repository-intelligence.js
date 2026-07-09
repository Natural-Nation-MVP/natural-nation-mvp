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
  ['Repository Intelligence', 'PASS', 'SSOT health and sync checks passed Founder validation.'],
];

const repositoryActions = [
  ['Run Sync Check', 'System', 'Check the visible repository and knowledge synchronization references.'],
  ['Review Knowledge Records', 'Founder', 'Jump to Knowledge Graph and review synchronized records.'],
  ['Review Executive Gate', 'Founder', 'Jump to Mission Control for Executive Review and closeout readiness.'],
];

const healthChecks = [
  ['Duplicate Data Risk', 'Low', 'SSOT standard assigns one canonical owner per information type.'],
  ['Unsynced Records', '0 Known', 'Latest project state, knowledge index, session log, and roadmap were synchronized.'],
  ['Open Validation Items', '2 Pending', 'Executive Review action revalidation and Release 3 closeout remain.'],
  ['Critical Issues', '0 Known', 'Executive Review action links were fixed and await retest.'],
];

function card(title, status, detail) {
  return `<div class="module-card"><strong>${title}</strong><div class="section-title">${status}</div><p class="muted">${detail}</p></div>`;
}

function row(title, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span class="status">${status}</span></div>`;
}

function actionRow(title, owner, detail) {
  const action = title === 'Run Sync Check'
    ? 'NNOSActions.runSyncCheck()'
    : title === 'Review Knowledge Records'
      ? "NNOSActions.startKnowledgeReview('')"
      : "NNOSActions.switchWorkspace('mission')";
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><button class="btn small" onclick="${action}">Run</button></div>`;
}

function renderRepositoryIntelligence() {
  const status = document.querySelector('[data-repo-status]');
  const checklist = document.querySelector('[data-repo-checklist]');
  if (!status || !checklist) return;

  status.innerHTML = repositorySignals.map(([title, value, detail]) => card(title, value, detail)).join('');
  checklist.innerHTML = `<div data-repo-action-output></div><div class="module-card"><strong>Repository Status: Synchronized ✓</strong><p class="muted">Founder OS is using canonical records and reference-based validation to reduce duplicate data risk.</p></div><div class="module-card"><strong>Repository Actions</strong>${repositoryActions.map(([title, owner, detail]) => actionRow(title, owner, detail)).join('')}</div><div class="module-card"><strong>Synchronization Health</strong>${syncItems.map(([title, state, detail]) => row(title, state, detail)).join('')}</div><div class="module-card"><strong>Repository Risk Snapshot</strong>${healthChecks.map(([title, state, detail]) => row(title, state, detail)).join('')}</div>`;
}

function activateRepositoryIntelligence() {
  renderRepositoryIntelligence();
  document.querySelectorAll('[data-workspace-button="repo"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderRepositoryIntelligence, 50)));
}

activateRepositoryIntelligence();
setTimeout(renderRepositoryIntelligence, 300);
