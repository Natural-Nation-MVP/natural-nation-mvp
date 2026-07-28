(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-5h5v5"/></svg>',
    workspace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4.5 12h15M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16"/></svg>',
    approvals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
    releases: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/></svg>',
    health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>',
    audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    registry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
    diagnostics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg>',
    founder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14M7.5 7.5l9 9M16.5 7.5l-9 9"/></svg>',
    natural: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 4C11 4 6 8 5 16c4 1 8 0 11-3 3-3 4-9 4-9Z"/><path d="M5 19c2-5 6-8 11-10"/></svg>',
    studio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>'
  };

  function icon(name) {
    return `<span class="nav-icon">${icons[name] || icons.workspace}</span>`;
  }

  function activateHome() {
    document.querySelector('[data-command-center-home]')?.click();
  }

  function openWorkspace(id, target) {
    document.querySelector(`[data-resume-workspace="${id}"]`)?.click();
    if (target) window.setTimeout(() => document.querySelector(`[data-context-module="${target}"]`)?.click(), 80);
  }

  function enhanceBrand() {
    const brand = $('.brand');
    if (!brand || brand.querySelector('.founder-ux-brand-copy')) return;
    const copy = document.createElement('div');
    copy.className = 'founder-ux-brand-copy';
    copy.innerHTML = '<strong>Founder OS</strong><span>Command Center</span>';
    brand.appendChild(copy);
  }

  function renderRegistrySidebar() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    const nav = $('.nav');
    if (!nav) return;
    nav.innerHTML = `
      <button class="nav-link active" type="button" data-ux-home>${icon('home')}<span>Home</span></button>
      <div class="nav-group">
        <div class="nav-group-label">Workspaces</div>
        <button class="nav-link" type="button" data-ux-workspace="founder-os">${icon('workspace')}<span>Founder OS</span></button>
        <button class="nav-link" type="button" data-ux-workspace="natural-nation">${icon('natural')}<span>Natural Nation</span></button>
        <button class="nav-link" type="button" data-ux-workspace="os-studio">${icon('studio')}<span>OS Studio</span></button>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Operations</div>
        <button class="nav-link" type="button" data-ux-target="build">${icon('approvals')}<span>Approvals</span></button>
        <button class="nav-link" type="button" data-ux-target="repo">${icon('releases')}<span>Releases</span></button>
        <button class="nav-link" type="button" data-ux-target="ai">${icon('ai')}<span>AI Activity</span></button>
        <button class="nav-link" type="button" data-ux-target="repo">${icon('health')}<span>System Health</span></button>
        <button class="nav-link" type="button" data-ux-target="knowledge">${icon('audit')}<span>Audit Trail</span></button>
      </div>
      <div class="nav-group nav-group-advanced">
        <div class="nav-group-label">Advanced</div>
        <button class="nav-link" type="button" data-ux-target="knowledge">${icon('registry')}<span>Registry</span></button>
        <button class="nav-link" type="button" data-ux-target="repo">${icon('diagnostics')}<span>Diagnostics</span></button>
      </div>`;
  }

  function enhanceHeader() {
    const hero = $('.hero');
    if (!hero || hero.querySelector('[data-ux-header-tools]')) return;
    const tools = document.createElement('div');
    tools.className = 'founder-ux-header-tools';
    tools.dataset.uxHeaderTools = '';
    tools.innerHTML = `
      <label class="founder-ux-search"><span class="sr-only">Search Founder OS workspaces</span><input type="search" placeholder="Search Founder OS…" data-ux-search /></label>
      <button class="founder-ux-icon-button" type="button" aria-label="Notifications" title="Notifications are available through the Action Center">${icons.ai}</button>
      <span class="founder-ux-avatar" aria-label="Founder profile">D</span>`;
    hero.appendChild(tools);
  }

  function filterWorkspaces(value) {
    const query = value.trim().toLowerCase();
    $$('.workspace-card').forEach((card) => { card.hidden = Boolean(query && !card.textContent.toLowerCase().includes(query)); });
  }

  function addPortfolioHeading() {
    const grid = $('[data-workspace-registry-list]');
    if (!grid) return;
    $$('.founder-ux-section-heading[data-ux-portfolio-heading]').forEach((heading, index) => { if (index > 0) heading.remove(); });
    if (grid.previousElementSibling?.matches('[data-ux-portfolio-heading]')) return;
    const heading = document.createElement('div');
    heading.className = 'founder-ux-section-heading';
    heading.dataset.uxPortfolioHeading = '';
    heading.innerHTML = '<div><div class="eyebrow">Workspace Portfolio</div><p>Your products and system workspaces at a glance.</p></div><button type="button" data-create-workspace>Manage Workspaces</button>';
    grid.parentNode.insertBefore(heading, grid);
  }

  function addOperationsZone() {
    const registry = $('[data-workspace="registry"]');
    if (!registry || registry.querySelector('[data-ux-operations]')) return;
    const zone = document.createElement('section');
    zone.className = 'founder-ux-operations-zone';
    zone.dataset.uxOperations = '';
    zone.innerHTML = `
      <div class="founder-ux-section-heading"><div><div class="eyebrow">Operations &amp; Tools</div><p>Manage approvals, releases, activity, and system health.</p></div></div>
      <div class="founder-ux-operations-grid">
        <button type="button" data-ux-operation="build"><span>Approvals</span><strong>Review founder decisions</strong><small>Open approval workflow →</small></button>
        <button type="button" data-ux-operation="repo"><span>Releases</span><strong>Review code and deployment state</strong><small>Open release status →</small></button>
        <button type="button" data-ux-operation="ai"><span>AI Activity</span><strong>See assignments and handoffs</strong><small>Open AI team →</small></button>
        <button type="button" data-ux-operation="repo"><span>System Health</span><strong>Gateway and repository checks</strong><small>Open diagnostics →</small></button>
      </div>`;
    registry.appendChild(zone);
  }

  function workspaceTheme(id) {
    if (id === 'founder-os') return ['founder', 'Platform'];
    if (id === 'natural-nation') return ['natural', 'Product'];
    return ['studio', 'Workspace'];
  }

  function decorateWorkspaceCards() {
    $$('.workspace-card').forEach((card) => {
      if (card.querySelector('.founder-ux-workspace-header')) return;
      const id = card.dataset.workspaceId || '';
      const top = $('.workspace-card-top', card);
      const purpose = $('.workspace-card-purpose', card);
      if (!top) return;
      const title = $('h2', top)?.textContent?.trim() || 'Workspace';
      const eyebrow = $('.eyebrow', top)?.textContent?.trim() || purpose?.textContent?.trim() || 'Workspace';
      const status = $('.status', top)?.textContent?.trim() || 'Active';
      const [theme, kind] = workspaceTheme(id);
      const header = document.createElement('div');
      header.className = `founder-ux-workspace-header founder-ux-workspace-header--${theme}`;
      header.innerHTML = `
        <div class="founder-ux-workspace-header-row">
          <span class="founder-ux-workspace-icon" aria-hidden="true">${icons[theme]}</span>
          <div class="founder-ux-workspace-header-copy"><div class="eyebrow">${kind}</div><h2>${title}</h2></div>
          <span class="status">${status}</span>
        </div>`;
      card.prepend(header);
    });
  }

  function enhanceRegistry() {
    renderRegistrySidebar();
    enhanceHeader();
    addPortfolioHeading();
    addOperationsZone();
    decorateWorkspaceCards();
  }

  document.addEventListener('click', (event) => {
    const home = event.target.closest('[data-ux-home]'); if (home) return activateHome();
    const workspace = event.target.closest('[data-ux-workspace]'); if (workspace) return openWorkspace(workspace.dataset.uxWorkspace);
    const target = event.target.closest('[data-ux-target]'); if (target) return openWorkspace('founder-os', target.dataset.uxTarget);
    const operation = event.target.closest('[data-ux-operation]'); if (operation) return openWorkspace('founder-os', operation.dataset.uxOperation);
  });

  document.addEventListener('input', (event) => { if (event.target.matches('[data-ux-search]')) filterWorkspaces(event.target.value); });
  window.addEventListener('founder-os:workspace-registry-rendered', enhanceRegistry);
  window.addEventListener('founder-os:workspace-view-changed', () => { if (document.body.dataset.activeWorkspace === 'registry') enhanceRegistry(); });

  enhanceBrand();
  enhanceRegistry();
})();
