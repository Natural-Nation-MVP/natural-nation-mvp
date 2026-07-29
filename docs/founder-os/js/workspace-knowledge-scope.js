(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const KNOWLEDGE_BASES = {
    'founder-os': {
      knowledgeBaseId: 'founder-os-kb',
      title: 'System Records',
      subtitle: 'Search Founder OS architecture, governance, operations, workspace lifecycle, gateway, repository, release, and UX records.',
      records: [
        { title: 'Founder OS Architecture', type: 'Architecture', summary: 'Canonical Founder OS architecture and system boundaries.', path: 'knowledge/founder-os/architecture.md' },
        { title: 'Repository Intelligence', type: 'Repository', summary: 'Repository health, structure, verification, and release intelligence.', path: 'knowledge/founder-os/repository-intelligence.md' },
        { title: 'Mission Control', type: 'Operations', summary: 'Founder OS mission-control responsibilities and operating state.', path: 'knowledge/founder-os/mission-control.md' },
        { title: 'Founder OS Operating Model', type: 'Governance', summary: 'Founder-controlled operating model and AI-team workflow.', path: 'knowledge/founder-os/operating-model-v1.md' },
        { title: 'AI Operations', type: 'AI Operations', summary: 'AI orchestration, handoffs, provider roles, and protected execution.', path: 'knowledge/founder-os/ai-operations.md' },
        { title: 'Source of Truth Standard', type: 'Governance', summary: 'Canonical record, synchronization, and evidence requirements.', path: 'knowledge/founder-os/source-of-truth.md' }
      ]
    },
    'natural-nation': {
      knowledgeBaseId: 'natural-nation-kb',
      title: 'Product Records',
      subtitle: 'Search Natural Nation product, Duey, onboarding, protocol, design, API, testing, release, and product-decision records.',
      records: [
        { title: 'Natural Nation MVP Principles', type: 'Product', summary: 'Approved Natural Nation MVP principles and scope controls.', path: 'knowledge/product/mvp-principles.md' },
        { title: 'Natural Nation Onboarding', type: 'Product', summary: 'Approved onboarding structure and first-session flow.', path: 'knowledge/product/onboarding.md' },
        { title: 'Feature Registry', type: 'Product', summary: 'Canonical Natural Nation feature inventory and implementation state.', path: 'knowledge/product/feature-registry-v1.md' },
        { title: 'Duey Personality Standard', type: 'Duey', summary: 'Approved Duey personality, response, and mentor rules.', path: 'knowledge/duey/personality.md' },
        { title: 'Protocol Library', type: 'Protocols', summary: 'Approved Natural Nation wellness protocol library.', path: 'knowledge/protocols/library-v1.md' },
        { title: 'Protocol Assignment Matrix', type: 'Protocols', summary: 'Deterministic protocol assignment and priority rules.', path: 'knowledge/protocols/assignment-matrix-v1.md' },
        { title: 'Design System', type: 'Design', summary: 'Natural Nation visual system, components, and interface standards.', path: 'knowledge/design/system-v1.md' },
        { title: 'API Catalog', type: 'API', summary: 'Natural Nation API contract and endpoint catalog.', path: 'knowledge/api/catalog-v1.md' },
        { title: 'QA Standard', type: 'Testing', summary: 'Natural Nation quality-assurance and validation requirements.', path: 'knowledge/testing/qa-standard-v1.md' }
      ]
    }
  };

  function activeScope() {
    const workspaceId = window.NNOSActiveWorkspace?.id || document.body.dataset.activeWorkspace || '';
    if (KNOWLEDGE_BASES[workspaceId]) return { workspaceId, ...KNOWLEDGE_BASES[workspaceId] };
    if (workspaceId && workspaceId !== 'registry') {
      return {
        workspaceId,
        knowledgeBaseId: `${workspaceId}-kb`,
        title: 'Workspace Records',
        subtitle: 'This workspace has an isolated knowledge base. No records have been registered yet.',
        records: []
      };
    }
    return null;
  }

  function render() {
    if (document.body.dataset.activeView !== 'knowledge') return;
    const scope = activeScope();
    const search = $('[data-knowledge-search]');
    const results = $('[data-knowledge-results]');
    const count = $('[data-knowledge-count]');
    const heading = $('[data-workspace="knowledge"] .section-title');
    const description = $('[data-workspace="knowledge"] article:first-child p');
    if (!scope || !results) return;

    if (heading) heading.textContent = scope.title;
    if (description) description.textContent = scope.subtitle;
    if (search) search.placeholder = `Search ${scope.title.toLowerCase()}…`;

    const query = (search?.value || '').trim().toLowerCase();
    const records = scope.records.filter((record) => !query || `${record.title} ${record.type} ${record.summary}`.toLowerCase().includes(query));
    if (count) count.textContent = `${records.length} ${records.length === 1 ? 'Matching Record' : 'Matching Records'} · ${scope.knowledgeBaseId}`;

    results.innerHTML = records.length
      ? records.map((record) => `<article class="glass-panel knowledge-record" data-knowledge-workspace="${scope.workspaceId}" data-knowledge-base="${scope.knowledgeBaseId}"><div class="eyebrow">${record.type}</div><h3>${record.title}</h3><p>${record.summary}</p><small>${record.path}</small></article>`).join('')
      : `<div class="founder-empty-state"><strong>No records found in ${scope.title}.</strong><p>Results are restricted to ${scope.knowledgeBaseId}. Records from other workspaces are intentionally excluded.</p></div>`;
  }

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-knowledge-search]')) render();
  });
  window.addEventListener('founder-os:workspace-view-changed', render);
  window.addEventListener('founder-os:workspace-registry-rendered', render);
  document.addEventListener('DOMContentLoaded', render, { once: true });
})();
