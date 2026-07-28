(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function activateHome() {
    document.querySelector('[data-command-center-home]')?.click();
  }

  function openWorkspace(id, target) {
    const workspaceButton = document.querySelector(`[data-resume-workspace="${id}"]`);
    workspaceButton?.click();
    if (target) {
      window.setTimeout(() => document.querySelector(`[data-context-module="${target}"]`)?.click(), 80);
    }
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
      <button class="nav-link active" type="button" data-ux-home><span aria-hidden="true">⌂</span> Home</button>
      <div class="nav-group">
        <div class="nav-group-label">Workspaces</div>
        <button class="nav-link" type="button" data-ux-workspace="founder-os">Founder OS</button>
        <button class="nav-link" type="button" data-ux-workspace="natural-nation">Natural Nation</button>
        <button class="nav-link" type="button" data-ux-workspace="os-studio">OS Studio</button>
      </div>
      <div class="nav-group">
        <div class="nav-group-label">Operations</div>
        <button class="nav-link" type="button" data-ux-target="build">Approvals</button>
        <button class="nav-link" type="button" data-ux-target="repo">Releases</button>
        <button class="nav-link" type="button" data-ux-target="ai">AI Activity</button>
        <button class="nav-link" type="button" data-ux-target="repo">System Health</button>
        <button class="nav-link" type="button" data-ux-target="knowledge">Audit Trail</button>
      </div>
      <div class="nav-group nav-group-advanced">
        <div class="nav-group-label">Advanced</div>
        <button class="nav-link" type="button" data-ux-target="knowledge">Registry</button>
        <button class="nav-link" type="button" data-ux-target="repo">Diagnostics</button>
      </div>`;
  }

  function enhanceHeader() {
    const hero = $('.hero');
    if (!hero || hero.querySelector('[data-ux-header-tools]')) return;
    const tools = document.createElement('div');
    tools.className = 'founder-ux-header-tools';
    tools.dataset.uxHeaderTools = '';
    tools.innerHTML = `
      <label class="founder-ux-search">
        <span class="sr-only">Search Founder OS workspaces</span>
        <input type="search" placeholder="Search Founder OS…" data-ux-search />
      </label>
      <button class="founder-ux-icon-button" type="button" aria-label="Notifications" title="Notifications are available through the Action Center">♢</button>
      <span class="founder-ux-avatar" aria-label="Founder profile">D</span>`;
    hero.appendChild(tools);
  }

  function filterWorkspaces(value) {
    const query = value.trim().toLowerCase();
    $$('.workspace-card').forEach((card) => {
      const match = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
    });
  }

  function addPortfolioHeading() {
    const grid = $('[data-workspace-registry-list]');
    if (!grid || grid.previousElementSibling?.matches('[data-ux-portfolio-heading]')) return;
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
      <div class="founder-ux-section-heading">
        <div><div class="eyebrow">Operations &amp; Tools</div><p>Manage approvals, releases, activity, and system health.</p></div>
      </div>
      <div class="founder-ux-operations-grid">
        <button type="button" data-ux-operation="build"><span>Approvals</span><strong>Review founder decisions</strong><small>Open approval workflow →</small></button>
        <button type="button" data-ux-operation="repo"><span>Releases</span><strong>Review code and deployment state</strong><small>Open release status →</small></button>
        <button type="button" data-ux-operation="ai"><span>AI Activity</span><strong>See assignments and handoffs</strong><small>Open AI team →</small></button>
        <button type="button" data-ux-operation="repo"><span>System Health</span><strong>Gateway and repository checks</strong><small>Open diagnostics →</small></button>
      </div>`;
    registry.appendChild(zone);
  }

  function decorateWorkspaceCards() {
    $$('.workspace-card').forEach((card) => {
      if (card.querySelector('.founder-ux-workspace-icon')) return;
      const heading = $('.workspace-card-top > div', card);
      if (!heading) return;
      const id = card.dataset.workspaceId || '';
      const icon = document.createElement('span');
      icon.className = 'founder-ux-workspace-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = id === 'founder-os' ? '✣' : id === 'natural-nation' ? '◒' : '◇';
      heading.prepend(icon);
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
    const home = event.target.closest('[data-ux-home]');
    if (home) return activateHome();

    const workspace = event.target.closest('[data-ux-workspace]');
    if (workspace) return openWorkspace(workspace.dataset.uxWorkspace);

    const target = event.target.closest('[data-ux-target]');
    if (target) return openWorkspace('founder-os', target.dataset.uxTarget);

    const operation = event.target.closest('[data-ux-operation]');
    if (operation) return openWorkspace('founder-os', operation.dataset.uxOperation);
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-ux-search]')) filterWorkspaces(event.target.value);
  });

  window.addEventListener('founder-os:workspace-registry-rendered', enhanceRegistry);
  window.addEventListener('founder-os:workspace-view-changed', () => {
    if (document.body.dataset.activeWorkspace === 'registry') enhanceRegistry();
  });

  enhanceBrand();
  enhanceRegistry();
})();