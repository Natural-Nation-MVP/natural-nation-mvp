const aiAgents = [
  ['Art', 'Architecture', 'Working', 'Mission Control, Repository Intelligence, SSOT standards, and Release 3 validation direction.'],
  ['Codex', 'Implementation', 'Ready', 'Build Studio packages, repository updates, technical fixes, and implementation handoffs.'],
  ['Gemini', 'Design Review', 'Ready', 'UI, UX, visual polish, iPad usability, and workspace layout review.'],
  ['GPose', 'Strategy + Docs', 'Ready', 'Founder summaries, prompts, documentation structure, and release communication.'],
  ['Duey', 'Wellness Logic', 'Idle', 'Natural Nation mentor behavior, wellness protocol logic, and safety language when product work resumes.'],
  ['Founder', 'Approval', 'Waiting', 'Release 3 validation, locked decisions, production standards, and final closeout approval.'],
];

const activeInitiatives = [
  ['AI Operations 2.0', 'Art', 'In Progress', 'Upgrade AI Operations into the Release 3 AI command center.'],
  ['Release 3 Validation', 'Founder', 'Active', 'Validate AI Operations, navigation, action bar, iPad layout, and executive review.'],
  ['Repository Intelligence 2.0', 'Founder', 'Passed', 'SSOT health, sync checks, and repository risk snapshot passed validation.'],
  ['Mission Control 2.0', 'Founder', 'Passed', 'Executive dashboard passed validation.'],
  ['Knowledge Graph', 'Founder', 'Passed', 'Open Document, Open on GitHub, and Related Records passed validation.'],
];

const aiHandoffs = [
  ['Context Load', 'System', 'Required', 'Load Knowledge Base, Project State, Roadmap, Session Log, Decision Ledger, and Validation Center.'],
  ['Implementation', 'Art', 'Active', 'AI Operations 2.0 implementation is the current approved build.'],
  ['Founder Validation', 'Founder', 'Next', 'Validate AI Operations on live GitHub Pages.'],
  ['Navigation Validation', 'Founder', 'Next', 'Validate workspace switching and title updates after AI Operations passes.'],
  ['Release Closeout', 'Founder', 'Pending', 'Approve Release 3 foundation after remaining validations pass.'],
];

const approvalQueue = [
  ['AI Operations 2.0', 'Pending', 'Awaiting Founder validation after deployment.'],
  ['Workspace Navigation', 'Pending', 'Validate after AI Operations passes.'],
  ['Bottom Action Bar', 'Pending', 'Validate Generate Package visibility behavior.'],
  ['iPad Layout', 'Pending', 'Validate portrait and landscape behavior.'],
  ['Release 3 Closeout', 'Pending', 'Final executive review and release approval.'],
];

const aiStandards = [
  ['Context Loading', 'Required', 'Major AI work must reference canonical records before execution.'],
  ['Founder Approval', 'Required', 'Locked decisions and production standards require Founder approval.'],
  ['Continuous Sync', 'Required', 'Approved work updates implementation, knowledge, roadmap, project state, and session tracking.'],
  ['Single Source of Truth', 'Required', 'AI Operations references canonical records instead of duplicating project content.'],
];

function aiCard(role, duty, status, detail) {
  return `<div class="module-card"><strong>${role}</strong><div class="section-title">${status}</div><p class="muted">${duty}</p><div class="record-row"><span>Current Scope</span><span>${detail}</span></div></div>`;
}

function aiRow(title, owner, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><span class="status">${status}</span></div>`;
}

function renderAiOperationsRuntime() {
  const roles = document.querySelector('[data-ai-roles]');
  const handoffs = document.querySelector('[data-ai-handoffs]');
  if (!roles || !handoffs) return;

  roles.innerHTML = aiAgents.map(([role, duty, status, detail]) => aiCard(role, duty, status, detail)).join('');
  handoffs.innerHTML = `<div class="module-card"><strong>Active Initiatives</strong>${activeInitiatives.map(([title, owner, status, detail]) => aiRow(title, owner, status, detail)).join('')}</div><div class="module-card"><strong>AI Handoff Queue</strong>${aiHandoffs.map(([title, owner, status, detail]) => aiRow(title, owner, status, detail)).join('')}</div><div class="module-card"><strong>Founder Approval Queue</strong>${approvalQueue.map(([title, status, detail]) => aiRow(title, 'Founder', status, detail)).join('')}</div><div class="module-card"><strong>Operating Standards</strong>${aiStandards.map(([title, status, detail]) => aiRow(title, 'System', status, detail)).join('')}</div>`;
}

function activateAiOperationsRuntime() {
  renderAiOperationsRuntime();
  document.querySelectorAll('[data-workspace-button="ai"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderAiOperationsRuntime, 50)));
}

activateAiOperationsRuntime();
setTimeout(renderAiOperationsRuntime, 300);
