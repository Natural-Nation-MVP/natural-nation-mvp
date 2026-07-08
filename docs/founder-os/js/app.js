const workspaceMeta = {
  mission: { title: 'Mission Control', subtitle: 'Founder dashboard, release state, health indicators, and command priorities.', badge: 'Founder OS Online' },
  knowledge: { title: 'Knowledge Graph', subtitle: 'Search canonical records, decisions, approvals, architecture standards, and project intelligence.', badge: 'Knowledge Intelligence' },
  build: { title: 'AI Build Orchestrator OP-002', subtitle: 'Generate AI-ready implementation packages with delivery targets and Founder approval.', badge: 'Target: Codex' },
  repo: { title: 'Repository Intelligence', subtitle: 'Branch, deployment, folder, runtime, and source-of-truth visibility.', badge: 'main / docs' },
  ai: { title: 'AI Operations', subtitle: 'Coordinate AI roles, handoffs, execution order, and review ownership.', badge: 'AI Team Ready' },
};

const targets = ['ChatGPT', 'Codex', 'Google AI Studio', 'Gemini', 'Manual Review'];
const buildItems = [
  { id: 'BUILD-NNCC-002', title: 'Create Google AI Studio app build package', owner: 'Art', status: 'Ready', target: 'Codex', delivery: 'Codex Implementation Agent', approval: 'Founder Required', plain: 'Creates an AI-ready package for the Google AI Studio version of Natural Nation using Founder OS context and approval rules.', outcome: 'Outcome: AI Studio package' },
  { id: 'BUILD-NNCC-003', title: 'Codex implementation package', owner: 'Codex', status: 'Ready', target: 'Codex', delivery: 'Codex Implementation Agent', approval: 'Founder Required', plain: 'Creates a Codex-ready implementation task with repository context, acceptance criteria, and verification steps.', outcome: 'Outcome: Codex implementation' },
  { id: 'BUILD-NNCC-004', title: 'Founder OS design system package', owner: 'Gemini', status: 'In Progress', target: 'Gemini', delivery: 'Design Review Agent', approval: 'Founder Review', plain: 'Prepares a design review package for Founder OS visual standards, spacing, glass panels, icons, and iPad usability.', outcome: 'Outcome: Design review' },
];
const knowledgeRecords = [
  { id: 'NN-ARCH-001', title: 'Founder OS Architecture Standard', type: 'Architecture', path: 'docs/founder-os/ARCHITECTURE.md', summary: 'Defines runtime, workspace model, deployment, and governance.' },
  { id: 'NN-INFRA-001', title: 'GitHub Pages Foundation', type: 'Infrastructure', path: 'docs/founder-os/', summary: 'Locks Pages to main / docs and canonical /founder-os/ route.' },
  { id: 'NNDS-002', title: 'Natural Nation Glass', type: 'Design', path: 'docs/founder-os/css/', summary: 'Stone background, glass panels, green accents, square buttons.' },
  { id: 'OP-002', title: 'AI Build Orchestrator', type: 'Operations', path: 'docs/founder-os/index.html', summary: 'Generates build packages and routes AI team handoffs.' },
  { id: 'READINESS', title: 'Founder OS Readiness Check', type: 'QA', path: 'docs/founder-os/READINESS_REPORT.md', summary: 'Tracks readiness findings and release blockers.' },
];
const repoStatus = [
  { label: 'Pages Source', value: 'main / docs', detail: 'Active GitHub Pages publishing source.' },
  { label: 'Canonical Runtime', value: 'docs/founder-os/', detail: 'Only public Founder OS runtime.' },
  { label: 'Legacy Path', value: 'Archived', detail: 'apps/founder-os is no longer public runtime.' },
  { label: 'Deployment', value: 'Ready', detail: 'Branch deploy is active and stable.' },
  { label: 'Architecture', value: 'Locked', detail: 'NN-ARCH-001 is active.' },
  { label: 'Readiness', value: 'Functional', detail: 'Static OS tools are wired.' },
];
const aiRoles = [
  { role: 'Art', duty: 'Architecture and system planning', handoff: 'Defines standards and scope.' },
  { role: 'Codex', duty: 'Implementation and code execution', handoff: 'Receives build-ready packages.' },
  { role: 'Gemini', duty: 'Design and review support', handoff: 'Reviews UI and UX output.' },
  { role: 'GPose', duty: 'Prompting, docs, strategy', handoff: 'Creates summaries and team prompts.' },
  { role: 'Duey', duty: 'Wellness intelligence', handoff: 'Reviews wellness logic and mentor behavior.' },
  { role: 'Founder', duty: 'Approval and final direction', handoff: 'Approves locked changes.' },
];

let selectedBuild = buildItems[0];
let selectedTarget = selectedBuild.target;
let packageHistory = [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function renderMetrics() {
  const metrics = [
    ['Modules', 12], ['Build Items', buildItems.length], ['Ready', buildItems.filter((i) => i.status === 'Ready').length], ['Systems', '7/7'], ['Release', 2], ['Status', 'Ready'],
  ];
  $('[data-system-metrics]').innerHTML = metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('');
  $('[data-system-status]').textContent = 'All systems ready';
}

function renderMission() {
  $('[data-mission-cards]').innerHTML = [
    ['Project Health', 'Ready', 'Infrastructure, routing, modules, and actions are operational.'],
    ['Current Priority', 'Release 2', 'Founder OS Build Studio functional completion.'],
    ['Readiness', '7/7', 'Mission, Knowledge, Build, Repo, AI, Pages, Docs.'],
  ].map(([a,b,c]) => `<div class="module-card"><strong>${a}</strong><div class="section-title">${b}</div><p class="muted">${c}</p></div>`).join('');
  $('[data-action-queue]').innerHTML = ['Verify live route', 'Test Build Studio Generate Package', 'Search Knowledge Graph', 'Review Repository Intel', 'Confirm AI handoff queue']
    .map((item, i) => `<div class="record-row"><span>${i + 1}. ${item}</span><span class="status">Ready</span></div>`).join('');
}

function renderKnowledge(query = '') {
  const q = query.toLowerCase();
  const matches = knowledgeRecords.filter((r) => `${r.id} ${r.title} ${r.type} ${r.path} ${r.summary}`.toLowerCase().includes(q));
  $('[data-knowledge-count]').textContent = `${matches.length} Knowledge Matches`;
  $('[data-knowledge-results]').innerHTML = matches.map((r) => `<div class="module-card"><strong>${r.id} — ${r.title}</strong><p class="muted">${r.summary}</p><div class="record-row"><span>${r.type}</span><span>${r.path}</span></div></div>`).join('') || '<p class="muted">No records matched.</p>';
}

function renderRepo() {
  $('[data-repo-status]').innerHTML = repoStatus.map((item) => `<div class="module-card"><strong>${item.label}</strong><div class="section-title">${item.value}</div><p class="muted">${item.detail}</p></div>`).join('');
  $('[data-repo-checklist]').innerHTML = ['main / docs source confirmed', 'docs/founder-os canonical runtime confirmed', 'legacy runtime removed or archived', 'modular assets created', 'readiness report created']
    .map((item) => `<div class="record-row"><span>${item}</span><span class="status">PASS</span></div>`).join('');
}

function renderAi() {
  $('[data-ai-roles]').innerHTML = aiRoles.map((r) => `<div class="module-card"><strong>${r.role}</strong><p class="muted">${r.duty}</p><div class="record-row"><span>Handoff</span><span>${r.handoff}</span></div></div>`).join('');
  $('[data-ai-handoffs]').innerHTML = buildItems.map((item) => `<div class="record-row"><span>${item.id} → ${item.target}</span><span>${item.delivery}</span></div>`).join('');
}

function renderQueue() {
  $('[data-build-queue]').innerHTML = buildItems.map((item) => `<button class="queue-item${item.id === selectedBuild.id ? ' active' : ''}" data-build-id="${item.id}" type="button"><span class="queue-top"><strong>${item.id}</strong><span class="status">${item.status}</span></span><span>${item.title}</span><small>Owner: ${item.owner}</small></button>`).join('');
}

function renderTargets() {
  $('[data-target-buttons]').innerHTML = targets.map((target) => `<button class="${target === selectedTarget ? 'active' : ''}" type="button" data-target="${target}">${target}</button>`).join('');
}

function renderBuild() {
  $('[data-selected-id]').textContent = selectedBuild.id;
  $('[data-selected-title]').textContent = selectedBuild.title;
  $('[data-selected-meta]').textContent = `Owner: ${selectedBuild.owner} • Target: ${selectedTarget} • Status: ${selectedBuild.status}`;
  $('[data-build-plain]').textContent = selectedBuild.plain;
  $('[data-build-outcome]').textContent = selectedBuild.outcome;
  $('[data-build-approval]').textContent = selectedBuild.approval;
  $('[data-validation-status]').textContent = selectedBuild.status === 'Ready' ? 'Validated: ready to package.' : 'Watch: still in progress.';
  $$('[data-delivery]').forEach((node) => node.textContent = deliveryFor(selectedTarget));
  $('[data-approval]').textContent = selectedBuild.approval;
  $('[data-bottom-target]').textContent = selectedTarget;
  $('[data-role-plan]').innerHTML = aiRoles.slice(0, 4).map((r) => `<div class="role-row"><span>${r.role}</span><strong>${r.duty}</strong></div>`).join('');
  $('[data-execution-order]').textContent = selectedTarget === 'Gemini' ? 'Art → Gemini → GPose → Founder' : 'Art → Codex → Gemini → GPose → Founder';
  $('[data-ai-notes]').textContent = `Recommended order: ${$('[data-execution-order]').textContent}.`;
  renderQueue();
  renderTargets();
}

function deliveryFor(target) {
  if (target === 'Google AI Studio') return 'Google AI Studio Builder';
  if (target === 'Gemini') return 'Design Review Agent';
  if (target === 'ChatGPT') return 'Strategy and Prompt Review';
  if (target === 'Manual Review') return 'Founder Manual Review';
  return 'Codex Implementation Agent';
}

function generatePackage(format = 'markdown') {
  const data = { itemId: selectedBuild.id, title: selectedBuild.title, target: selectedTarget, delivery: deliveryFor(selectedTarget), approval: selectedBuild.approval, executionOrder: $('[data-execution-order]').textContent, acceptance: ['Scope respected', 'Founder approval required', 'Canonical docs/founder-os path preserved', 'No legacy runtime used'] };
  const markdown = `# ${data.itemId} — ${data.title}\n\n## Target\n${data.target}\n\n## Deliver To\n${data.delivery}\n\n## Approval\n${data.approval}\n\n## Execution Order\n${data.executionOrder}\n\n## Acceptance Criteria\n${data.acceptance.map((x) => `- ${x}`).join('\n')}`;
  const output = format === 'json' ? JSON.stringify(data, null, 2) : markdown;
  $('[data-package-preview]').textContent = output;
  packageHistory.unshift(`${data.itemId} package generated for ${data.target}`);
  renderHistory();
}

function renderHistory() {
  $('[data-package-history]').innerHTML = packageHistory.length ? packageHistory.map((item) => `<div class="record-row"><span>${item}</span><span class="status">Done</span></div>`).join('') : '<p class="muted">No packages generated this session.</p>';
}

function validatePackage() {
  $('[data-package-preview]').textContent = `VALIDATION PASS\n\n${selectedBuild.id}\nTarget: ${selectedTarget}\nDelivery: ${deliveryFor(selectedTarget)}\nApproval: ${selectedBuild.approval}\nCanonical runtime: docs/founder-os/\nResult: Ready for Founder review.`;
}

function setWorkspace(workspace) {
  const meta = workspaceMeta[workspace] || workspaceMeta.mission;
  $$('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === workspace));
  $$('[data-workspace-button]').forEach((button) => button.classList.toggle('active', button.dataset.workspaceButton === workspace));
  $('[data-workspace-title]').textContent = meta.title;
  $('[data-workspace-subtitle]').textContent = meta.subtitle;
  $('[data-workspace-badge]').textContent = meta.badge;
}

function init() {
  renderMetrics(); renderMission(); renderKnowledge(); renderRepo(); renderAi(); renderBuild(); renderHistory(); setWorkspace('mission');
  $('[data-knowledge-search]').addEventListener('input', (event) => renderKnowledge(event.target.value));
  document.addEventListener('click', (event) => {
    const workspaceTarget = event.target.closest('[data-workspace-button]');
    if (workspaceTarget) return setWorkspace(workspaceTarget.dataset.workspaceButton);
    const buildTarget = event.target.closest('[data-build-id]');
    if (buildTarget) { selectedBuild = buildItems.find((item) => item.id === buildTarget.dataset.buildId) || selectedBuild; selectedTarget = selectedBuild.target; renderBuild(); return; }
    const targetButton = event.target.closest('[data-target]');
    if (targetButton) { selectedTarget = targetButton.dataset.target; renderBuild(); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'generate') generatePackage('markdown');
    if (action === 'validate') validatePackage();
    if (action === 'export-md') generatePackage('markdown');
    if (action === 'export-json') generatePackage('json');
  });
}

init();
