const aiAgents = [
  ['Art', 'Architecture', 'Working', 'Mission Control, Repository Intelligence, SSOT standards, and Release 3 validation direction.'],
  ['Codex', 'Implementation', 'Ready', 'Build Studio packages, repository updates, technical fixes, and implementation handoffs.'],
  ['Gemini', 'Design Review', 'Ready', 'UI, UX, visual polish, iPad usability, and workspace layout review.'],
  ['GPose', 'Strategy + Docs', 'Ready', 'Founder summaries, prompts, documentation structure, and release communication.'],
  ['Duey', 'Wellness Logic', 'Idle', 'Natural Nation mentor behavior, wellness protocol logic, and safety language when product work resumes.'],
  ['Founder', 'Approval', 'Waiting', 'Release 3 validation, locked decisions, production standards, and final closeout approval.'],
];

const activeInitiatives = [
  ['Founder Action Layer v1', 'Art', 'Active', 'Convert Founder OS screens from informational dashboards into operational workspaces.'],
  ['Release 3 Validation', 'Founder', 'Active', 'Revalidate Executive Review actions and proceed to closeout.'],
  ['Repository Intelligence 2.0', 'Founder', 'Passed', 'SSOT health, sync checks, and repository risk snapshot passed validation.'],
  ['Mission Control 2.0', 'Founder', 'Passed', 'Executive dashboard passed validation.'],
  ['Knowledge Graph', 'Founder', 'Passed', 'Open Document, Open on GitHub, and Related Records passed validation.'],
];

const aiHandoffs = [
  ['Dispatch Art', 'Art', 'Ready', 'Prepare architecture or operating-standard work.'],
  ['Dispatch Codex', 'Codex', 'Ready', 'Prepare implementation and repository-change work.'],
  ['Dispatch Gemini', 'Gemini', 'Ready', 'Prepare UX and layout review work.'],
  ['Dispatch GPose', 'GPose', 'Ready', 'Prepare strategy, prompt, or summary work.'],
  ['Dispatch Duey', 'Duey', 'Idle', 'Prepare Natural Nation wellness-domain review when product work resumes.'],
];

const approvalQueue = [
  ['Executive Review actions', 'Pending', 'Awaiting Founder validation after action links and controls were added.'],
  ['Release 3 Closeout', 'Pending', 'Final executive review and release approval.'],
];

const aiStandards = [
  ['Context Loading', 'Required', 'Major AI work must reference canonical records before execution.'],
  ['Founder Approval', 'Required', 'Locked decisions and production standards require Founder approval.'],
  ['Continuous Sync', 'Required', 'Approved work updates implementation, knowledge, roadmap, project state, and session tracking.'],
  ['Single Source of Truth', 'Required', 'AI Operations references canonical records instead of duplicating project content.'],
];

function aiCard(role, duty, status, detail) {
  return `<div class="module-card"><strong>${role}</strong><div class="section-title">${status}</div><p class="muted">${duty}</p><div class="record-row"><span>Current Scope</span><span>${detail}</span></div><div class="record-row"><button class="btn small" onclick="NNOSActions.startAiHandoff('${role}')">Prepare Handoff</button><button class="btn small secondary" onclick="NNOSActions.switchWorkspace('build')">Open Build Studio</button></div></div>`;
}

function aiRow(title, owner, status, detail) {
  const agent = owner === 'Art' || owner === 'Codex' || owner === 'Gemini' || owner === 'GPose' || owner === 'Duey' ? owner : 'Art';
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><span class="status">${status}</span><button class="btn small" onclick="NNOSActions.startAiHandoff('${agent}')">Start</button></div>`;
}

function renderAiOperationsRuntime() {
  const roles = document.querySelector('[data-ai-roles]');
  const handoffs = document.querySelector('[data-ai-handoffs]');
  if (!roles || !handoffs) return;

  roles.innerHTML = aiAgents.map(([role, duty, status, detail]) => aiCard(role, duty, status, detail)).join('');
  handoffs.innerHTML = `<div data-ai-action-output></div><div class="module-card"><strong>Active Initiatives</strong>${activeInitiatives.map(([title, owner, status, detail]) => aiRow(title, owner, status, detail)).join('')}</div><div class="module-card"><strong>AI Handoff Queue</strong>${aiHandoffs.map(([title, owner, status, detail]) => aiRow(title, owner, status, detail)).join('')}</div><div class="module-card"><strong>Founder Approval Queue</strong>${approvalQueue.map(([title, status, detail]) => aiRow(title, 'Founder', status, detail)).join('')}</div><div class="module-card"><strong>Operating Standards</strong>${aiStandards.map(([title, status, detail]) => aiRow(title, 'System', status, detail)).join('')}</div>`;
}

function activateAiOperationsRuntime() {
  renderAiOperationsRuntime();
  document.querySelectorAll('[data-workspace-button="ai"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderAiOperationsRuntime, 50)));
}

activateAiOperationsRuntime();
setTimeout(renderAiOperationsRuntime, 300);
