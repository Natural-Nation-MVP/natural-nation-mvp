(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const VERSION = 'v0.8.0';
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  const icons = {
    founder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14M7.5 7.5l9 9M16.5 7.5l-9 9"/></svg>',
    natural: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 4C11 4 6 8 5 16c4 1 8 0 11-3 3-3 4-9 4-9Z"/><path d="M5 19c2-5 6-8 11-10"/></svg>',
    studio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
    duplicate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16v13H4zM3 4h18v3H3zM9 11h6"/></svg>',
    health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 13h4l2-5 4 10 2-5h4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>'
  };

  function ensureLaunchStyles() {
    if ($('[data-workspace-launch-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.NNOSPaths.asset('css/workspace-launch-center.css?v=founder-ux-015');
    link.dataset.workspaceLaunchStyles = '';
    document.head.appendChild(link);
  }

  function activateHome() {
    const route = document.createElement('button');
    route.type = 'button';
    route.hidden = true;
    route.dataset.commandCenterHome = '';
    document.body.appendChild(route);
    route.click();
    route.remove();
  }

  function hasSavedDraft() {
    try { return Boolean(localStorage.getItem(DRAFT_KEY)); } catch { return false; }
  }

  function startWorkspaceCreation() {
    const trigger = $('[data-create-workspace]');
    trigger?.click();
  }

  function renderBrandHomeTag() {
    const brand = $('.brand');
    if (!brand) return;
    brand.innerHTML = `<button class="founder-home-tag" type="button" data-founder-home-tag aria-label="Return to Founder OS Command Center ${VERSION}" title="Return to Founder OS Command Center"><span class="founder-home-tag__icon" aria-hidden="true">☘</span><span class="founder-home-tag__copy"><strong>Founder OS</strong><span><span>Command Center</span><em>${VERSION}</em></span></span></button>`;
  }

  function workspaceStatus(card) {
    const text = card.textContent.toLowerCase();
    if (/archived|soft-deleted|deleted/.test(text)) return 'archived';
    if (/foundation|setup incomplete|created/.test(text) && card.dataset.workspaceId !== 'founder-os' && card.dataset.workspaceId !== 'natural-nation') return 'setup';
    return 'active';
  }

  function workspaceCounts() {
    const cards = $$('.workspace-card');
    const counts = { all: cards.length, active: 0, setup: 0, archived: 0 };
    cards.forEach((card) => { counts[workspaceStatus(card)] += 1; });
    return counts;
  }

  function applyFilter(filter = 'all') {
    $$('.workspace-card').forEach((card) => {
      const matchesStatus = filter === 'all' || workspaceStatus(card) === filter;
      const query = ($('[data-launch-search]')?.value || '').trim().toLowerCase();
      const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !(matchesStatus && matchesSearch);
    });
    $$('[data-launch-filter]').forEach((button) => {
      const active = button.dataset.launchFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.body.dataset.launchFilter = filter;
  }

  function scrollToPortfolio(filter = 'all') {
    applyFilter(filter);
    $('[data-launch-portfolio]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openDuplicateReview() {
    const button = $('[data-open-duplicate-review]');
    if (button) button.click();
    else setStatus('No duplicate workspace records currently require review.');
  }

  function setStatus(message) {
    const status = $('[data-launch-status]');
    if (status) status.textContent = message;
  }

  function renderRegistryNavigation() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    const nav = $('.nav');
    if (!nav) return;
    const counts = workspaceCounts();
    nav.setAttribute('aria-label', 'Workspace Launch Center navigation');
    nav.innerHTML = `
      <section class="nav-group" aria-label="Workspace actions">
        <div class="nav-group-label">Workspace Actions</div>
        <button class="nav-link active" type="button" data-launch-action="create"><span class="nav-icon">${icons.plus}</span><span>Create Workspace</span></button>
        <button class="nav-link" type="button" data-launch-action="resume" ${hasSavedDraft() ? '' : 'disabled'}><span class="nav-icon">${icons.clock}</span><span>Resume Setup</span></button>
      </section>
      <section class="nav-group" aria-label="Workspace portfolio">
        <div class="nav-group-label">Workspace Portfolio</div>
        <button class="nav-link" type="button" data-launch-filter="all"><span class="nav-icon">${icons.search}</span><span>All Workspaces</span><span class="nav-count">${counts.all}</span></button>
        <button class="nav-link" type="button" data-launch-filter="active"><span class="nav-icon">${icons.health}</span><span>Active</span><span class="nav-count">${counts.active}</span></button>
        <button class="nav-link" type="button" data-launch-filter="setup"><span class="nav-icon">${icons.clock}</span><span>Setup Incomplete</span><span class="nav-count">${counts.setup}</span></button>
        <button class="nav-link" type="button" data-launch-filter="archived"><span class="nav-icon">${icons.archive}</span><span>Archived</span><span class="nav-count">${counts.archived}</span></button>
      </section>
      <section class="nav-group" aria-label="Workspace management">
        <div class="nav-group-label">Management</div>
        <button class="nav-link" type="button" data-launch-action="health"><span class="nav-icon">${icons.health}</span><span>Workspace Health</span></button>
        <button class="nav-link" type="button" data-launch-action="duplicates"><span class="nav-icon">${icons.duplicate}</span><span>Duplicate Review</span></button>
      </section>`;
  }

  function renderHeader() {
    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    if (title) title.textContent = 'Welcome back, Dewane';
    if (subtitle) subtitle.textContent = 'This is your Workspace Launch Center. Create new workspaces and manage what you are building.';
    $('[data-workspace-badge]')?.setAttribute('hidden', '');
    const hero = $('.hero');
    if (!hero || hero.querySelector('[data-ux-header-tools]')) return;
    const tools = document.createElement('div');
    tools.className = 'founder-ux-header-tools';
    tools.dataset.uxHeaderTools = '';
    tools.innerHTML = `<label class="founder-ux-search"><span class="sr-only">Search workspaces</span><input type="search" placeholder="Search workspaces…" data-launch-search /></label><span class="founder-ux-avatar" aria-label="Founder profile">D</span>`;
    hero.appendChild(tools);
  }

  function renderLaunchActions() {
    const hero = $('.command-center-hero');
    if (!hero) return;
    hero.className = 'workspace-launch-panel';
    hero.innerHTML = `
      <div class="workspace-launch-panel__header"><div><div class="eyebrow">Create a New Workspace</div><h2>How do you want to start?</h2><p>Choose a workspace action. Founder OS keeps each workspace isolated and governed.</p></div></div>
      <div class="workspace-launch-actions">
        <button class="workspace-launch-action workspace-launch-action--create" type="button" data-launch-action="create"><span class="workspace-launch-action__icon">${icons.plus}</span><strong>Guided Workspace</strong><p>Describe what you want to build and let Founder OS draft the workspace foundation.</p><small>Start workspace →</small></button>
        <button class="workspace-launch-action workspace-launch-action--resume" type="button" data-launch-action="resume" ${hasSavedDraft() ? '' : 'disabled'}><span class="workspace-launch-action__icon">${icons.clock}</span><strong>Resume Setup</strong><p>Continue the workspace discovery draft saved on this device.</p><small>${hasSavedDraft() ? 'Continue setup →' : 'No saved draft'}</small></button>
        <button class="workspace-launch-action workspace-launch-action--duplicate" type="button" data-launch-action="duplicates"><span class="workspace-launch-action__icon">${icons.duplicate}</span><strong>Review Duplicates</strong><p>Compare equivalent workspace records before creating or retaining another workspace.</p><small>Open review →</small></button>
        <button class="workspace-launch-action workspace-launch-action--archive" type="button" data-launch-filter="archived"><span class="workspace-launch-action__icon">${icons.archive}</span><strong>Archived Workspaces</strong><p>Restore a previous workspace instead of creating an unnecessary replacement.</p><small>View archive →</small></button>
      </div>
      <p class="workspace-launch-status" data-launch-status aria-live="polite"></p>`;
  }

  function decorateCards() {
    $$('.workspace-card').forEach((card) => {
      const state = workspaceStatus(card);
      card.dataset.launchStatus = state;
      if (!card.querySelector('.founder-ux-workspace-header')) {
        const top = $('.workspace-card-top', card);
        const title = $('h2', top)?.textContent?.trim() || 'Workspace';
        const status = $('.status', top)?.textContent?.trim() || 'Active';
        const id = card.dataset.workspaceId || '';
        const [theme, kind] = id === 'founder-os' ? ['founder', 'Platform'] : id === 'natural-nation' ? ['natural', 'Product'] : ['studio', 'Workspace'];
        const header = document.createElement('div');
        header.className = `founder-ux-workspace-header founder-ux-workspace-header--${theme}`;
        header.innerHTML = `<div class="founder-ux-workspace-header-row"><span class="founder-ux-workspace-icon" aria-hidden="true">${icons[theme]}</span><div class="founder-ux-workspace-header-copy"><div class="eyebrow">${kind}</div><h2>${title}</h2></div><span class="status">${status}</span></div>`;
        card.prepend(header);
      }
      let chip = card.querySelector('.workspace-card-status-chip');
      if (!chip) {
        chip = document.createElement('span');
        chip.className = `workspace-card-status-chip workspace-card-status-chip--${state}`;
        const header = card.querySelector('.founder-ux-workspace-header');
        header?.insertAdjacentElement('afterend', chip);
      }
      chip.textContent = state === 'active' ? 'Active' : state === 'setup' ? 'Setup incomplete' : 'Archived';
    });
  }

  function renderPortfolio() {
    const registry = $('[data-workspace="registry"]');
    const grid = $('[data-workspace-registry-list]');
    if (!registry || !grid) return;
    $$('[data-home-orientation],[data-ux-portfolio-heading],[data-ux-operations]').forEach((node) => node.remove());
    let shell = $('[data-launch-portfolio]');
    if (!shell) {
      shell = document.createElement('section');
      shell.className = 'workspace-portfolio-shell';
      shell.dataset.launchPortfolio = '';
      grid.parentNode.insertBefore(shell, grid);
      shell.appendChild(grid);
    }
    const counts = workspaceCounts();
    let toolbar = shell.querySelector('.workspace-portfolio-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'workspace-portfolio-toolbar';
      shell.prepend(toolbar);
    }
    toolbar.innerHTML = `<div><div class="eyebrow">Your Workspaces</div><h2>Workspace Portfolio</h2></div><div class="workspace-portfolio-controls"><label><span class="sr-only">Search workspace portfolio</span><input type="search" placeholder="Search by name or description…" data-launch-search /></label><button type="button" data-launch-action="create">Create Workspace</button></div>`;
    let tabs = shell.querySelector('.workspace-filter-tabs');
    if (!tabs) {
      tabs = document.createElement('div');
      tabs.className = 'workspace-filter-tabs';
      toolbar.insertAdjacentElement('afterend', tabs);
    }
    tabs.innerHTML = `<button class="active" type="button" data-launch-filter="all">All <span class="count">${counts.all}</span></button><button type="button" data-launch-filter="active">Active <span class="count">${counts.active}</span></button><button type="button" data-launch-filter="setup">Setup incomplete <span class="count">${counts.setup}</span></button><button type="button" data-launch-filter="archived">Archived <span class="count">${counts.archived}</span></button>`;

    let activity = registry.querySelector('[data-launch-activity]');
    if (!activity) {
      activity = document.createElement('section');
      activity.className = 'workspace-creation-activity';
      activity.dataset.launchActivity = '';
      registry.appendChild(activity);
    }
    activity.innerHTML = `<article class="workspace-creation-stat"><span>Total Workspaces</span><strong>${counts.all}</strong><small>Across all lifecycle states</small></article><article class="workspace-creation-stat"><span>Active</span><strong>${counts.active}</strong><small>Ready to open and manage</small></article><article class="workspace-creation-stat"><span>Setup Incomplete</span><strong>${counts.setup}</strong><small>Needs workspace definition</small></article><article class="workspace-creation-stat"><span>Archived</span><strong>${counts.archived}</strong><small>Available for restoration</small></article>`;
  }

  function enhanceRegistry() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    ensureLaunchStyles();
    renderBrandHomeTag();
    renderHeader();
    renderLaunchActions();
    decorateCards();
    renderPortfolio();
    renderRegistryNavigation();
    applyFilter(document.body.dataset.launchFilter || 'all');
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-founder-home-tag]')) { event.preventDefault(); activateHome(); return; }
    const action = event.target.closest('[data-launch-action]');
    if (action) {
      event.preventDefault();
      const name = action.dataset.launchAction;
      if (name === 'create' || name === 'resume') startWorkspaceCreation();
      if (name === 'duplicates') openDuplicateReview();
      if (name === 'health') scrollToPortfolio('all');
      return;
    }
    const filter = event.target.closest('[data-launch-filter]');
    if (filter) { event.preventDefault(); scrollToPortfolio(filter.dataset.launchFilter); }
  });

  document.addEventListener('input', (event) => {
    if (!event.target.matches('[data-launch-search]')) return;
    $$('[data-launch-search]').forEach((input) => { if (input !== event.target) input.value = event.target.value; });
    applyFilter(document.body.dataset.launchFilter || 'all');
  });

  window.addEventListener('founder-os:workspace-registry-rendered', enhanceRegistry);
  window.addEventListener('founder-os:workspace-view-changed', () => {
    renderBrandHomeTag();
    if (document.body.dataset.activeWorkspace === 'registry') window.setTimeout(enhanceRegistry, 0);
  });
  window.addEventListener('founder-os:workspace-lifecycle-changed', () => window.setTimeout(enhanceRegistry, 0));

  ensureLaunchStyles();
  renderBrandHomeTag();
  enhanceRegistry();
})();
