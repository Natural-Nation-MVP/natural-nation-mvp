const repositoryKnowledge = [
  { id: 'KB-INDEX-001', title: 'Knowledge Base Index', category: 'Core', path: 'docs/knowledge/INDEX.md', summary: 'Master entry point for canonical project knowledge.', related: ['PROJECT_STATE', 'SYNC-STANDARD', 'AI Context'] },
  { id: 'KB-FOUNDER-001', title: 'Founder OS', category: 'Founder OS', path: 'docs/knowledge/founder-os/README.md', summary: 'Operating layer for project state, releases, AI handoffs, and repository intelligence.', related: ['Release 3', 'Build Studio', 'Mission Control'] },
  { id: 'KB-FOUNDER-002', title: 'Founder OS Architecture', category: 'Founder OS', path: 'docs/knowledge/founder-os/architecture.md', summary: 'Approved runtime, workspace model, and production layout standard.', related: ['ADR-001', 'Release 3', 'Knowledge Graph'] },
  { id: 'KB-FOUNDER-003', title: 'Repository Intelligence', category: 'Founder OS', path: 'docs/knowledge/founder-os/repository-intelligence.md', summary: 'Repository health, synchronization, and canonical implementation awareness.', related: ['GitHub', 'Sync', 'Mission Control'] },
  { id: 'KB-FOUNDER-004', title: 'Mission Control', category: 'Founder OS', path: 'docs/knowledge/founder-os/mission-control.md', summary: 'Executive dashboard for founder priorities, project health, risks, and current initiative.', related: ['Founder OS', 'Repository Intelligence', 'AI Operations'] },
  { id: 'KB-FOUNDER-005', title: 'Founder OS Operating Model', category: 'Founder OS', path: 'docs/knowledge/founder-os/operating-model-v1.md', summary: 'Approved operating loop connecting Mission Control, Knowledge Graph, Repository Intelligence, Build Studio, AI Operations, GitHub, and the Knowledge Base.', related: ['Mission Control', 'Build Studio', 'AI Operations'] },
  { id: 'KB-FOUNDER-006', title: 'AI Operations', category: 'Founder OS', path: 'docs/knowledge/founder-os/ai-operations.md', summary: 'AI workforce coordination view for roles, handoffs, approval, and synchronization standards.', related: ['Art', 'Codex', 'Gemini', 'GPose', 'Duey'] },
  { id: 'KB-FOUNDER-007', title: 'Single Source of Truth Standard', category: 'Founder OS', path: 'docs/knowledge/founder-os/source-of-truth.md', summary: 'Founder OS standard for preventing duplicate data by using canonical ownership and references.', related: ['Decision Ledger', 'Validation Center', 'Sync'] },
  { id: 'KB-DECISION-002', title: 'Decision Ledger', category: 'Decisions', path: 'docs/decisions/DECISION-LEDGER.md', summary: 'Founder approval event log that references canonical records instead of duplicating source documents.', related: ['SSOT', 'Founder Approval', 'ADR'] },
  { id: 'KB-RELEASE-002', title: 'Validation Center', category: 'Releases', path: 'docs/releases/VALIDATION-CENTER.md', summary: 'Release validation event system that tracks pass, fail, fix, and retest status by reference.', related: ['Release 3', 'Validation', 'SSOT'] },
  { id: 'KB-PRODUCT-001', title: 'Natural Nation Product', category: 'Product', path: 'docs/knowledge/product/README.md', summary: 'Product vision, MVP areas, and approved product principles.', related: ['Duey', 'Protocols', 'MVP'] },
  { id: 'KB-PRODUCT-002', title: 'MVP Principles', category: 'Product', path: 'docs/knowledge/product/mvp-principles.md', summary: 'Natural Nation MVP rules, value focus, and locked product principles.', related: ['Guest First', 'Duey', 'Scores'] },
  { id: 'KB-PRODUCT-003', title: 'Onboarding', category: 'Product', path: 'docs/knowledge/product/onboarding.md', summary: 'Approved onboarding flow areas and first-session goal.', related: ['Duey Summary', 'Blueprint', 'Day 1'] },
  { id: 'KB-PRODUCT-004', title: 'Feature Registry', category: 'Product', path: 'docs/knowledge/product/feature-registry-v1.md', summary: 'Natural Nation and Founder OS feature areas.', related: ['MVP', 'Phase 2', 'Release 3'] },
  { id: 'KB-DUEY-001', title: 'Duey Mentor System', category: 'Duey', path: 'docs/knowledge/duey/README.md', summary: 'Duey identity, role, and mentor behavior.', related: ['Personality', 'Protocols', 'Product'] },
  { id: 'KB-DUEY-002', title: 'Duey Personality', category: 'Duey', path: 'docs/knowledge/duey/personality.md', summary: 'Approved Duey tone, response priorities, and safety boundaries.', related: ['Mentor', 'Safety', 'Recognition'] },
  { id: 'KB-PROTOCOL-002', title: 'Protocol Library v1', category: 'Protocols', path: 'docs/knowledge/protocols/library-v1.md', summary: 'Approved Natural Nation wellness protocol categories.', related: ['Daily Foundations', 'Duey', 'Matrix'] },
  { id: 'KB-PROTOCOL-003', title: 'Assignment Matrix v1', category: 'Protocols', path: 'docs/knowledge/protocols/assignment-matrix-v1.md', summary: 'Deterministic protocol assignment rules and priority hierarchy.', related: ['Safety', 'Sleep', 'Recovery'] },
  { id: 'KB-DESIGN-002', title: 'Design System v1', category: 'Design', path: 'docs/knowledge/design/system-v1.md', summary: 'Natural Nation and Founder OS UI direction.', related: ['Build Studio', 'iPad', 'Components'] },
  { id: 'KB-DESIGN-003', title: 'Design Assets', category: 'Design', path: 'docs/knowledge/design/assets.md', summary: 'Approved asset areas and Duey asset rules.', related: ['Duey Robot', 'Icons', 'Images'] },
  { id: 'KB-AI-002', title: 'AI Context Loading', category: 'AI', path: 'docs/knowledge/ai/context-loading-standard.md', summary: 'Required startup context for major AI work.', related: ['Art', 'Codex', 'Gemini'] },
  { id: 'KB-API-002', title: 'API Catalog v1', category: 'API', path: 'docs/knowledge/api/catalog-v1.md', summary: 'API groups, auth context, and isolation standard.', related: ['Auth', 'Protocols', 'Dashboard'] },
  { id: 'KB-QA-002', title: 'QA Standard v1', category: 'Testing', path: 'docs/knowledge/testing/qa-standard-v1.md', summary: 'Validation and definition of done checks.', related: ['Definition of Done', 'Validation', 'Sync'] },
];

const repositoryRoot = 'https://github.com/Natural-Nation-MVP/natural-nation-mvp/blob/main/';

function categorySummary(records) {
  const counts = records.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, count]) => `<button class="pill" onclick="NNOSActions.startKnowledgeReview('${name}')">${name}: ${count}</button>`).join('');
}

function documentUrl(path) {
  return `../${path.replace('docs/', '')}`;
}

function githubUrl(path) {
  return `${repositoryRoot}${path}`;
}

function relationMatches(source, candidate) {
  if (source.id === candidate.id) return false;
  const haystack = `${candidate.id} ${candidate.title} ${candidate.category} ${candidate.summary} ${candidate.related.join(' ')}`.toLowerCase();
  return source.related.some((tag) => haystack.includes(tag.toLowerCase())) || candidate.related.some((tag) => source.title.toLowerCase().includes(tag.toLowerCase()));
}

function relatedRecords(item) {
  const matches = repositoryKnowledge.filter((candidate) => relationMatches(item, candidate)).slice(0, 4);
  if (!matches.length) return '<small>No related records mapped yet</small>';
  return matches.map((record) => `<button class="pill" onclick="NNOSActions.startKnowledgeReview('${record.title.replace(/'/g, '')}')">${record.title}</button>`).join('');
}

function renderKnowledgeCard(item) {
  const related = item.related.map((tag) => `<small>${tag}</small>`).join('');
  return `<div class="module-card"><strong>${item.id} — ${item.title}</strong><p class="muted">${item.summary}</p><div class="record-row"><span>${item.category}</span><span>${item.path}</span></div><div class="queue-meta">${related}</div><div class="section-title">Related Records</div><div class="summary-pills">${relatedRecords(item)}</div><div class="record-row"><a class="btn small" href="${documentUrl(item.path)}" target="_blank" rel="noopener">Open Document</a><a class="btn small secondary" href="${githubUrl(item.path)}" target="_blank" rel="noopener">Open on GitHub</a><button class="btn small secondary" onclick="NNOSActions.startKnowledgeReview('${item.title.replace(/'/g, '')}')">Review Record</button></div></div>`;
}

function renderRepositoryKnowledge() {
  const results = document.querySelector('[data-knowledge-results]');
  const count = document.querySelector('[data-knowledge-count]');
  const search = document.querySelector('[data-knowledge-search]');
  if (!results || !count) return;

  const q = (search?.value || '').toLowerCase();
  const matches = repositoryKnowledge.filter((item) => `${item.id} ${item.title} ${item.category} ${item.path} ${item.summary} ${item.related.join(' ')}`.toLowerCase().includes(q));
  count.textContent = `${matches.length} Knowledge Records Loaded`;
  results.innerHTML = `<div data-knowledge-action-output></div><div class="module-card"><strong>Knowledge Actions</strong><p class="muted">Use these controls to operate on the Knowledge Graph instead of only opening documents.</p><div class="record-row"><button class="btn small" onclick="NNOSActions.runKnowledgeAudit()">Run Knowledge Audit</button><button class="btn small secondary" onclick="NNOSActions.startKnowledgeReview('Single Source')">Review SSOT Records</button><button class="btn small secondary" onclick="NNOSActions.startKnowledgeReview('Validation')">Review Validation Records</button></div></div><div class="module-card"><strong>Repository Status: Synchronized ✓</strong><p class="muted">GitHub Canonical Knowledge Base is active for Founder OS.</p><div class="summary-pills">${categorySummary(matches)}</div></div>${matches.map(renderKnowledgeCard).join('') || '<p class="muted">No repository knowledge records matched.</p>'}`;
}

function activateKnowledgeEngine() {
  renderRepositoryKnowledge();
  document.querySelector('[data-knowledge-search]')?.addEventListener('input', renderRepositoryKnowledge);
  document.querySelectorAll('[data-workspace-button="knowledge"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderRepositoryKnowledge, 50)));
}

activateKnowledgeEngine();
setTimeout(renderRepositoryKnowledge, 300);
