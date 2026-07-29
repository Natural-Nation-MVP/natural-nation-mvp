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
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
  };

  function ensureStyles() {
    if ($('[data-workspace-launch-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.NNOSPaths.asset('css/workspace-launch-center.css?v=founder-ux-017');
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

  function startCreation(source) {
    if (!window.NNOSWorkspaceCreation?.open) return setStatus('Workspace creation is still loading. Try again in a moment.');
    window.NNOSWorkspaceCreation.open(source || document.activeElement);
  }

  function setStatus(message) {
    const status = $('[data-launch-status]');
    if (status) status.textContent = message;
  }

  function renderBrand() {
    const brand = $('.brand');
    if (!brand) return;
    brand.innerHTML = `<button class="founder-home-tag" type="button" data-founder-home-tag aria-label="Return to Founder OS Command Center ${VERSION}"><span class="founder-home-tag__icon" aria-hidden="true">☘</span><span class="founder-home-tag__copy"><strong>Founder OS</strong><span><span>Command Center</span><em>${VERSION}</em></span></span></button>`;
  }

  function statusFor(card) {
    const text = card.textContent.toLowerCase();
    if (/archived|soft-deleted|deleted/.test(text)) return 'archived';
    if (/foundation|setup incomplete|created/.test(text) && !['founder-os', 'natural-nation'].includes(card.dataset.workspaceId)) return 'setup';
    return 'active';
  }

  function counts() {
    const result = { all: 0, active: 0, setup: 0, archived: 0 };
    $$('.workspace-card').forEach((card) => { result.all += 1; result[statusFor(card)] += 1; });
    return result;
  }

  function progressFor(card) {
    const inline = card.querySelector('.workspace-progress-track span')?.style.width;
    const numeric = Number.parseInt(inline || '', 10);
    return Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : statusFor(card) === 'archived' ? 100 : 15;
  }

  function applyFilter(filter = 'all') {
    const query = ($('[data-launch-search]')?.value || '').trim().toLowerCase();
    $$('.workspace-card').forEach((card) => {
      const statusMatch = filter === 'all' || statusFor(card) === filter;
      const searchMatch = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !(statusMatch && searchMatch);
    });
    $$('[data-launch-filter]').forEach((button) => {
      const active = button.dataset.launchFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.body.dataset.launchFilter = filter;
    $('[data-workspace-registry-list]')?.scrollTo({ left: 0, behavior: 'smooth' });
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

  function renderNavigation() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    const nav = $('.nav');
    if (!nav) return;
    const c = counts();
    nav.setAttribute('aria-label', 'Workspace Launch Center navigation');
    nav.innerHTML = `
      <section class="nav-group"><div class="nav-group-label">Workspace Actions</div>
        <button class="nav-link active" type="button" data-launch-action="create"><span class="nav-icon">${icons.plus}</span><span>Create Workspace</span></button>
        <button class="nav-link" type="button" data-launch-action="resume" ${hasSavedDraft() ? '' : 'disabled'}><span class="nav-icon">${icons.clock}</span><span>Resume Setup</span></button>
      </section>
      <section class="nav-group"><div class="nav-group-label">Workspace Portfolio</div>
        <button class="nav-link" type="button" data-launch-filter="all"><span class="nav-icon">${icons.search}</span><span>All Workspaces</span><span class="nav-count">${c.all}</span></button>
        <button class="nav-link" type="button" data-launch-filter="active"><span class="nav-icon">${icons.health}</span><span>Active</span><span class="nav-count">${c.active}</span></button>
        <button class="nav-link" type="button" data-launch-filter="setup"><span class="nav-icon">${icons.clock}</span><span>Setup Incomplete</span><span class="nav-count">${c.setup}</span></button>
        <button class="nav-link" type="button" data-launch-filter="archived"><span class="nav-icon">${icons.archive}</span><span>Archived</span><span class="nav-count">${c.archived}</span></button>
      </section>
      <section class="nav-group"><div class="nav-group-label">Management</div>
        <button class="nav-link" type="button" data-launch-action="health"><span class="nav-icon">${icons.health}</span><span>Workspace Health</span></button>
        <button class="nav-link" type="button" data-launch-action="duplicates"><span class="nav-icon">${icons.duplicate}</span><span>Duplicate Review</span></button>
      </section>`;
  }

  function renderHeader() {
    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    if (title) title.textContent = 'Workspace Launch Center';
    if (subtitle) subtitle.textContent = 'Create new workspaces and manage what you are building.';
    $('[data-workspace-badge]')?.setAttribute('hidden', '');
    $('.hero [data-ux-header-tools]')?.remove();
  }

  function renderActions() {
    const panel = $('.command-center-hero');
    if (!panel) return;
    panel.className = 'workspace-launch-panel';
    panel.innerHTML = `<div class="workspace-launch-panel__header"><div><div class="eyebrow">Create a New Workspace</div></div></div>
      <div class="workspace-launch-actions">
        <button class="workspace-launch-action workspace-launch-action--create" type="button" data-launch-action="create"><span class="workspace-launch-action__icon">${icons.plus}</span><span><strong>Guided Workspace</strong><small>Describe what you want to build.</small></span>${icons.arrow}</button>
        <button class="workspace-launch-action workspace-launch-action--resume" type="button" data-launch-action="resume" ${hasSavedDraft() ? '' : 'disabled'}><span class="workspace-launch-action__icon">${icons.clock}</span><span><strong>Resume Setup</strong><small>${hasSavedDraft() ? 'Continue your saved draft.' : 'No saved draft.'}</small></span>${icons.arrow}</button>
        <button class="workspace-launch-action workspace-launch-action--duplicate" type="button" data-launch-action="duplicates"><span class="workspace-launch-action__icon">${icons.duplicate}</span><span><strong>Duplicate Review</strong><small>Compare equivalent workspaces.</small></span>${icons.arrow}</button>
        <button class="workspace-launch-action workspace-launch-action--archive" type="button" data-launch-filter="archived"><span class="workspace-launch-action__icon">${icons.archive}</span><span><strong>Archived Workspaces</strong><small>Restore a previous workspace.</small></span>${icons.arrow}</button>
      </div><p class="workspace-launch-status" data-launch-status aria-live="polite"></p>`;
  }

  function decorateCards() {
    $$('.workspace-card').forEach((card) => {
      const state = statusFor(card);
      const id = card.dataset.workspaceId || '';
      const title = card.querySelector('.workspace-card-top h2')?.textContent?.trim() || 'Workspace';
      const type = id === 'founder-os' ? 'Platform' : id === 'natural-nation' ? 'Product' : 'Workspace';
      const subtitle = id === 'founder-os' ? 'Command Center' : id === 'natural-nation' ? 'Wellness Platform' : 'Independent Workspace';
      const iconName = id === 'founder-os' ? 'founder' : id === 'natural-nation' ? 'natural' : 'studio';
      const progress = progressFor(card);
      const nextAction = card.querySelector('.workspace-next-step strong')?.textContent?.trim() || 'Open workspace and review the next action';
      const button = card.querySelector('[data-resume-workspace]');
      if (button) {
        button.textContent = 'Open Workspace';
        button.setAttribute('aria-label', `Open ${title} workspace`);
      }
      card.dataset.launchStatus = state;
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
      card.setAttribute('aria-label', `Open ${title} workspace`);

      let summary = card.querySelector('[data-launch-card-summary]');
      if (!summary) {
        summary = document.createElement('div');
        summary.dataset.launchCardSummary = '';
        summary.className = 'workspace-launch-card-summary';
        card.prepend(summary);
      }
      summary.innerHTML = `
        <div class="workspace-launch-card-topline"><span class="workspace-card-status-chip workspace-card-status-chip--${state}">${state === 'active' ? 'Active' : state === 'setup' ? 'Setup incomplete' : 'Archived'}</span><span class="workspace-type-chip">${type}</span></div>
        <div class="workspace-launch-card-title"><span class="workspace-launch-card-icon workspace-launch-card-icon--${iconName}">${icons[iconName]}</span><div><h3>${title}</h3><p>${subtitle}</p></div></div>
        <p class="workspace-launch-card-description">${card.querySelector(':scope > p')?.textContent?.trim() || ''}</p>
        <div class="workspace-launch-card-progress"><div><span>Completion</span><strong>${progress}%</strong></div><div class="workspace-launch-card-progress-track"><span style="width:${progress}%"></span></div></div>
        <div class="workspace-launch-card-next"><span>Next action</span><strong>${nextAction}</strong></div>`;
    });
  }

  function renderPortfolio() {
    const registry = $('[data-workspace="registry"]');
    const grid = $('[data-workspace-registry-list]');
    if (!registry || !grid) return;
    $$('[data-home-orientation],[data-ux-portfolio-heading],[data-ux-operations],[data-launch-activity]').forEach((node) => node.remove());
    let shell = $('[data-launch-portfolio]');
    if (!shell) {
      shell = document.createElement('section');
      shell.className = 'workspace-portfolio-shell';
      shell.dataset.launchPortfolio = '';
      grid.parentNode.insertBefore(shell, grid);
      shell.appendChild(grid);
    }
    const c = counts();
    let toolbar = shell.querySelector('.workspace-portfolio-toolbar');
    if (!toolbar) { toolbar = document.createElement('div'); toolbar.className = 'workspace-portfolio-toolbar'; shell.prepend(toolbar); }
    toolbar.innerHTML = `<div><div class="eyebrow">Your Workspaces</div></div><label class="workspace-portfolio-search"><span class="sr-only">Search workspace portfolio</span><input type="search" placeholder="Search workspaces by name or description…" data-launch-search /></label>`;
    let tabs = shell.querySelector('.workspace-filter-tabs');
    if (!tabs) { tabs = document.createElement('div'); tabs.className = 'workspace-filter-tabs'; toolbar.insertAdjacentElement('afterend', tabs); }
    tabs.innerHTML = `<div class="workspace-filter-tabs__items"><button type="button" data-launch-filter="all">All <span class="count">${c.all}</span></button><button type="button" data-launch-filter="active">Active <span class="count">${c.active}</span></button><button type="button" data-launch-filter="setup">Setup incomplete <span class="count">${c.setup}</span></button><button type="button" data-launch-filter="archived">Archived <span class="count">${c.archived}</span></button></div><div class="workspace-carousel-controls"><button type="button" data-carousel-direction="previous" aria-label="Previous workspaces">‹</button><button type="button" data-carousel-direction="next" aria-label="Next workspaces">›</button></div>`;
  }

  function enhanceRegistry() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    ensureStyles(); renderBrand(); renderHeader(); renderActions(); decorateCards(); renderPortfolio(); renderNavigation();
    applyFilter(document.body.dataset.launchFilter || 'all');
  }

  function openCard(card) {
    card.querySelector('[data-resume-workspace]')?.click();
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-founder-home-tag]')) { event.preventDefault(); activateHome(); return; }
    const dialogClose = event.target.closest('.workspace-compare-dialog [value="close"], [data-close-duplicate-review]');
    if (dialogClose) { event.preventDefault(); dialogClose.closest('dialog')?.close(); return; }
    const carousel = event.target.closest('[data-carousel-direction]');
    if (carousel) {
      event.preventDefault();
      const grid = $('[data-workspace-registry-list]');
      const amount = grid ? grid.clientWidth : 0;
      grid?.scrollBy({ left: carousel.dataset.carouselDirection === 'next' ? amount : -amount, behavior: 'smooth' });
      return;
    }
    const action = event.target.closest('[data-launch-action]');
    if (action) {
      event.preventDefault();
      const name = action.dataset.launchAction;
      if (name === 'create' || name === 'resume') startCreation(action);
      else if (name === 'duplicates') openDuplicateReview();
      else if (name === 'health') scrollToPortfolio('all');
      return;
    }
    const filter = event.target.closest('[data-launch-filter]');
    if (filter) { event.preventDefault(); scrollToPortfolio(filter.dataset.launchFilter); return; }
    const card = event.target.closest('.workspace-card');
    if (card && !event.target.closest('button,summary,details,a,input,select,textarea')) openCard(card);
  });

  document.addEventListener('keydown', (event) => {
    const card = event.target.closest?.('.workspace-card');
    if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openCard(card); }
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-launch-search]')) applyFilter(document.body.dataset.launchFilter || 'all');
  });

  window.addEventListener('founder-os:workspace-registry-rendered', enhanceRegistry);
  window.addEventListener('founder-os:workspace-view-changed', () => { renderBrand(); if (document.body.dataset.activeWorkspace === 'registry') setTimeout(enhanceRegistry, 0); });
  window.addEventListener('founder-os:workspace-lifecycle-changed', () => setTimeout(enhanceRegistry, 0));

  ensureStyles(); renderBrand(); enhanceRegistry();
})();