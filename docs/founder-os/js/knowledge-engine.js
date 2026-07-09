const repositoryKnowledge = [
  ['KB-INDEX-001', 'Knowledge Base Index', 'docs/knowledge/INDEX.md', 'Master entry point for canonical project knowledge.'],
  ['KB-FOUNDER-001', 'Founder OS', 'docs/knowledge/founder-os/README.md', 'Operating layer for project state, releases, AI handoffs, and repository intelligence.'],
  ['KB-FOUNDER-002', 'Founder OS Architecture', 'docs/knowledge/founder-os/architecture.md', 'Approved runtime, workspace model, and production layout standard.'],
  ['KB-PRODUCT-001', 'Natural Nation Product', 'docs/knowledge/product/README.md', 'Product vision, MVP areas, and approved product principles.'],
  ['KB-PRODUCT-002', 'MVP Principles', 'docs/knowledge/product/mvp-principles.md', 'Natural Nation MVP rules, value focus, and locked product principles.'],
  ['KB-PRODUCT-003', 'Onboarding', 'docs/knowledge/product/onboarding.md', 'Approved onboarding flow areas and first-session goal.'],
  ['KB-PRODUCT-004', 'Feature Registry', 'docs/knowledge/product/feature-registry-v1.md', 'Natural Nation and Founder OS feature areas.'],
  ['KB-DUEY-001', 'Duey Mentor System', 'docs/knowledge/duey/README.md', 'Duey identity, role, and mentor behavior.'],
  ['KB-DUEY-002', 'Duey Personality', 'docs/knowledge/duey/personality.md', 'Approved Duey tone, response priorities, and safety boundaries.'],
  ['KB-PROTOCOL-002', 'Protocol Library v1', 'docs/knowledge/protocols/library-v1.md', 'Approved Natural Nation wellness protocol categories.'],
  ['KB-PROTOCOL-003', 'Assignment Matrix v1', 'docs/knowledge/protocols/assignment-matrix-v1.md', 'Deterministic protocol assignment rules and priority hierarchy.'],
  ['KB-DESIGN-002', 'Design System v1', 'docs/knowledge/design/system-v1.md', 'Natural Nation and Founder OS UI direction.'],
  ['KB-DESIGN-003', 'Design Assets', 'docs/knowledge/design/assets.md', 'Approved asset areas and Duey asset rules.'],
  ['KB-AI-002', 'AI Context Loading', 'docs/knowledge/ai/context-loading-standard.md', 'Required startup context for major AI work.'],
  ['KB-API-002', 'API Catalog v1', 'docs/knowledge/api/catalog-v1.md', 'API groups, auth context, and isolation standard.'],
  ['KB-QA-002', 'QA Standard v1', 'docs/knowledge/testing/qa-standard-v1.md', 'Validation and definition of done checks.'],
];

function renderRepositoryKnowledge() {
  const results = document.querySelector('[data-knowledge-results]');
  const count = document.querySelector('[data-knowledge-count]');
  const search = document.querySelector('[data-knowledge-search]');
  if (!results || !count) return;

  const q = (search?.value || '').toLowerCase();
  const matches = repositoryKnowledge.filter((item) => item.join(' ').toLowerCase().includes(q));
  count.textContent = `${matches.length} Repository Knowledge Records`;
  results.innerHTML = matches.map(([id, title, path, summary]) => `<div class="module-card"><strong>${id} — ${title}</strong><p class="muted">${summary}</p><div class="record-row"><span>GitHub</span><span>${path}</span></div></div>`).join('') || '<p class="muted">No repository knowledge records matched.</p>';
}

function activateKnowledgeEngine() {
  renderRepositoryKnowledge();
  document.querySelector('[data-knowledge-search]')?.addEventListener('input', renderRepositoryKnowledge);
  document.querySelectorAll('[data-workspace-button="knowledge"]').forEach((button) => button.addEventListener('click', () => setTimeout(renderRepositoryKnowledge, 50)));
}

activateKnowledgeEngine();
setTimeout(renderRepositoryKnowledge, 300);
