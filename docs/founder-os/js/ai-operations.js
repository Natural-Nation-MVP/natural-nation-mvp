const aiAgents = [
  ['Art', 'Architecture', 'Active', 'Defines system standards, operating model, and milestone direction.'],
  ['Codex', 'Implementation', 'Ready', 'Receives build-ready packages and repository implementation tasks.'],
  ['Gemini', 'Design Review', 'Ready', 'Reviews UI, UX, layout quality, and visual direction.'],
  ['GPose', 'Strategy', 'Ready', 'Supports prompts, summaries, founder-facing documentation, and planning.'],
  ['Duey', 'Wellness Logic', 'Ready', 'Reviews wellness mentor behavior, protocols, and Natural Nation guidance.'],
  ['Founder', 'Approval', 'Required', 'Approves locked decisions, production standards, and milestone completion.'],
];

const aiHandoffs = [
  ['AI Operations Foundation', 'Art', 'In Progress', 'Create the first AI workforce coordination view.'],
  ['Repository Intelligence Validation', 'Founder', 'Next', 'Validate repository health and sync status on live GitHub Pages.'],
  ['Knowledge Graph Validation', 'Founder', 'Next', 'Validate repository-backed knowledge categories and search.'],
  ['Build Package Execution', 'Codex', 'Ready', 'Use Build Studio packages for implementation handoff.'],
  ['Design Review Pass', 'Gemini', 'Ready', 'Review Founder OS workspace polish and iPad usability.'],
];

const aiStandards = [
  ['Context Loading', 'Required', 'Load Knowledge Base, Project State, Roadmap, Session Log, and relevant ADRs before major work.'],
  ['Founder Approval', 'Required', 'Locked decisions and production standards require Founder approval.'],
  ['Continuous Sync', 'Required', 'Every approved change updates implementation, knowledge, roadmap, and session tracking.'],
  ['Role Clarity', 'Required', 'Each AI agent should have a clear owner role and output target.'],
];

function aiCard(role, duty, status, detail) {
  return `<div class="module-card"><strong>${role}</strong><div class="section-title">${status}</div><p class="muted">${duty}</p><div class="record-row"><span>Scope</span><span>${detail}</span></div></div>`;
}

function aiRow(title, owner, status, detail) {
  return `<div class="record-row"><span><strong>${title}</strong><br><small>${detail}</small></span><span>${owner}</span><span class="status">${status}</span></div>`;
}

function renderAiOperationsRuntime() {
  const roles = document.querySelector('[data-ai-roles]');
  const handoffs = document.querySelector('[data-ai-handoffs]');
  if (!roles || !handoffs) return;

  roles.innerHTML = aiAgents.map(([role, duty, status, detail]) => aiCard(role, duty, status, detail)).join('');
  handoffs.innerHTML = `<div class="module-card"><strong>AI Handoff Queue</strong>${aiHandoffs.map(([title, owner, status, detail]) => aiRow(title, owner, status, detail)).join('')}</div><div class="module-card"><strong>Operating Standards</strong>${aiStandards.map(([title, status, detail]) => aiRow(title, 'System', status, detail)).join('')}</div>`;
}

function activateAiOperationsRuntime() {
  renderAiOperationsRuntime();
  document.querySelectorAll('[data-workspace-button="ai"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderAiOperationsRuntime, 50)));
}

activateAiOperationsRuntime();
setTimeout(renderAiOperationsRuntime, 300);
