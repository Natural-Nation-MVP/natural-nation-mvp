(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const VERSION = 'v0.8.0';

  const icons = {
    founder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14M7.5 7.5l9 9M16.5 7.5l-9 9"/></svg>',
    natural: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 4C11 4 6 8 5 16c4 1 8 0 11-3 3-3 4-9 4-9Z"/><path d="M5 19c2-5 6-8 11-10"/></svg>',
    studio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
    approvals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="4"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/></svg>',
    records: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>'
  };

  const icon = (name) => `<span class="nav-icon">${icons[name]}</span>`;

  function activateHome() {
    // The registry controller owns home activation. Use its delegated route hook
    // without depending on a visible Home button that subsidiary pages replace.
    const routeTrigger = document.createElement('button');
    routeTrigger.type = 'button';
    routeTrigger.hidden = true;
    routeTrigger.dataset.commandCenterHome = '';
    document.body.appendChild(routeTrigger);
    routeTrigger.click();
    routeTrigger.remove();
  }

  function workspaceCardsByName(name) {
    const normalized = name.trim().toLowerCase();
    return $$('.workspace-card').filter((card) => $('h2', card)?.textContent?.trim().toLowerCase() === normalized);
  }

  function openWorkspace(id, { preferCanonical = false } = {}) {
    let button = $(`[data-resume-workspace="${CSS.escape(id)}"]`);
    if (!button && id === 'os-studio') {
      const cards = workspaceCardsByName('OS Studio');
      const selected = preferCanonical
        ? cards.find((card) => String(card.dataset.workspaceId || '').startsWith('ws_')) || cards[0]
        : cards[0];
      button = selected?.querySelector('[data-resume-workspace]');
    }
    button?.click();
  }

  function openSystemView(target) {
    openWorkspace('founder-os');
    window.setTimeout(() => window.setWorkspace?.(target), 80);
  }

  const navigationGroups = [
    { label: 'Workspaces', items: [
      { id: 'founder-os', label: 'Founder OS', icon: 'founder', action: () => openWorkspace('founder-os') },
      { id: 'natural-nation', label: 'Natural Nation', icon: 'natural', action: () => openWorkspace('natural-nation') },
      { id: 'os-studio', label: 'OS Studio', icon: 'studio', action: () => openWorkspace('os-studio', { preferCanonical: true }) }
    ]},
    { label: 'Operations', items: [
      { id: 'approvals', label: 'Approval Inbox', icon: 'approvals', action: () => openSystemView('approvals') },
      { id: 'ai', label: 'AI Team', icon: 'ai', action: () => openSystemView('ai') },
      { id: 'repo', label: 'Code & Deployments', icon: 'code', action: () => openSystemView('repo') },
      { id: 'knowledge', label: 'System Records', icon: 'records', action: () => openSystemView('knowledge') }
    ]}
  ];

  function setActiveNavigation(id) {
    $$('[data-main-nav-id]').forEach((button) => {
      const active = button.dataset.mainNavId === id;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function renderBrandHomeTag() {
    const brand = $('.brand');
    if (!brand) return;
    brand.innerHTML = `<button class="founder-home-tag" type="button" data-founder-home-tag aria-label="Return to Founder OS Command Center ${VERSION}" title="Return to Founder OS Command Center"><span class="founder-home-tag__icon" aria-hidden="true">☘</span><span class="founder-home-tag__copy"><strong>Founder OS</strong><span><span>Command Center</span><em>${VERSION}</em></span></span></button>`;
  }

  function renderMainNavigation() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    const nav = $('.nav');
    if (!nav) return;
    nav.setAttribute('aria-label', 'Founder OS main navigation');
    nav.innerHTML = navigationGroups.map((group) => `<section class="nav-group" aria-label="${group.label}"><div class="nav-group-label">${group.label}</div>${group.items.map((item) => `<button class="nav-link" type="button" data-main-nav-id="${item.id}" title="${item.label}">${icon(item.icon)}<span>${item.label}</span></button>`).join('')}</section>`).join('');
    navigationGroups.flatMap((group) => group.items).forEach((item) => {
      $(`[data-main-nav-id="${item.id}"]`, nav)?.addEventListener('click', () => {
        setActiveNavigation(item.id);
        item.action();
      });
    });
  }

  function enhanceHeader() {
    const hero = $('.hero');
    if (!hero || hero.querySelector('[data-ux-header-tools]')) return;
    const tools = document.createElement('div');
    tools.className = 'founder-ux-header-tools';
    tools.dataset.uxHeaderTools = '';
    tools.innerHTML = `<label class="founder-ux-search"><span class="sr-only">Search workspaces</span><input type="search" placeholder="Search workspaces…" data-ux-search /></label><button class="founder-ux-icon-button" type="button" aria-label="Open AI Team" title="Open AI Team">${icons.ai}</button><span class="founder-ux-avatar" aria-label="Founder profile">D</span>`;
    hero.appendChild(tools);
    $('.founder-ux-icon-button', tools)?.addEventListener('click', () => openSystemView('ai'));
  }

  function filterWorkspaces(value) {
    const query = value.trim().toLowerCase();
    $$('.workspace-card').forEach((card) => {
      card.hidden = Boolean(query && !card.textContent.toLowerCase().includes(query));
    });
  }

  function addPortfolioHeading() {
    const grid = $('[data-workspace-registry-list]');
    if (!grid) return;
    $$('[data-ux-portfolio-heading]').forEach((heading, index) => { if (index > 0) heading.remove(); });
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
    zone.innerHTML = `<div class="founder-ux-section-heading"><div><div class="eyebrow">Operations &amp; Tools</div><p>Open the same system areas available in the navigation panel.</p></div></div><div class="founder-ux-operations-grid"><button type="button" data-operation-target="approvals"><span>Approval Inbox</span><strong>Review evidence and Founder decisions</strong><small>Open approvals →</small></button><button type="button" data-operation-target="ai"><span>AI Team</span><strong>Review assignments and verified handoffs</strong><small>Open AI Team →</small></button><button type="button" data-operation-target="repo"><span>Code &amp; Deployments</span><strong>Review repository and release readiness</strong><small>Open code status →</small></button><button type="button" data-operation-target="knowledge"><span>System Records</span><strong>Find approved platform decisions and records</strong><small>Open records →</small></button></div>`;
    registry.appendChild(zone);
    $$('[data-operation-target]', zone).forEach((button) => button.addEventListener('click', () => openSystemView(button.dataset.operationTarget)));
  }

  function decorateWorkspaceCards() {
    $$('.workspace-card').forEach((card) => {
      if (card.querySelector('.founder-ux-workspace-header')) return;
      const id = card.dataset.workspaceId || '';
      const top = $('.workspace-card-top', card);
      if (!top) return;
      const title = $('h2', top)?.textContent?.trim() || 'Workspace';
      const status = $('.status', top)?.textContent?.trim() || 'Active';
      const [theme, kind] = id === 'founder-os' ? ['founder', 'Platform'] : id === 'natural-nation' ? ['natural', 'Product'] : ['studio', 'Workspace'];
      const header = document.createElement('div');
      header.className = `founder-ux-workspace-header founder-ux-workspace-header--${theme}`;
      header.innerHTML = `<div class="founder-ux-workspace-header-row"><span class="founder-ux-workspace-icon" aria-hidden="true">${icons[theme]}</span><div class="founder-ux-workspace-header-copy"><div class="eyebrow">${kind}</div><h2>${title}</h2></div><span class="status">${status}</span></div>`;
      card.prepend(header);
    });
  }

  function synchronizeNavigation() {
    renderBrandHomeTag();
    $$('[data-command-center-home]').forEach((button) => button.remove());
    if (document.body.dataset.activeWorkspace === 'registry') renderMainNavigation();
  }

  function enhanceRegistry() {
    synchronizeNavigation();
    enhanceHeader();
    addPortfolioHeading();
    addOperationsZone();
    decorateWorkspaceCards();
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-founder-home-tag]')) {
      event.preventDefault();
      activateHome();
    }
  });
  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-ux-search]')) filterWorkspaces(event.target.value);
  });
  window.addEventListener('founder-os:workspace-registry-rendered', enhanceRegistry);
  window.addEventListener('founder-os:workspace-view-changed', () => {
    window.setTimeout(synchronizeNavigation, 0);
    if (document.body.dataset.activeWorkspace === 'registry') enhanceRegistry();
  });

  synchronizeNavigation();
  enhanceRegistry();
})();