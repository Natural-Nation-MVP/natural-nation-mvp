(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const VERSION = 'v0.8.0';
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  const icons = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
    duplicate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16v13H4zM3 4h18v3H3zM9 11h6"/></svg>',
    health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 13h4l2-5 4 10 2-5h4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>'
  };

  function ensureStyles() {
    if ($('[data-workspace-launch-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.NNOSPaths.asset('css/workspace-launch-center.css?v=founder-ux-016');
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
    if (title) title.textContent = 'Welcome back, Dewane';
    if (subtitle) subtitle.textContent = 'Create, organize, and enter your workspaces.';
    $('[data-workspace-badge]')?.setAttribute('hidden', '');
    $('.hero [data-ux-header-tools]')?.remove();
  }

  function renderActions() {
    const panel = $('.command-center-hero');
    if (!panel) return;
    panel.className = 'workspace-launch-panel';
    panel.innerHTML = `<div class="workspace-launch-panel__header"><div><div class="eyebrow">Create a New Workspace</div><h2>How do you want to start?</h2><p>Use the guided flow, continue a saved setup, review duplicates, or restore an archive.</p></div></div>
      <div class="workspace-launch-actions">
        <button class="workspace-launch-action workspace-launch-action--create" type="button" data-launch-action="create"><span class="workspace-launch-action__icon">${icons.plus}</span><strong>Guided Workspace</strong><p>Describe what you want to build and let Founder OS draft the foundation.</p><small>Start workspace →</small></button>
        <button class="workspace-launch-action workspace-launch-action--resume" type="button" data-launch-action="resume" ${hasSavedDraft() ? '' : 'disabled'}><span class="workspace-launch-action__icon">${icons.clock}</span><strong>Resume Setup</strong><p>Continue the workspace discovery draft saved on this device.</p><small>${hasSavedDraft() ? 'Continue setup →' : 'No saved draft'}</small></button>
        <button class="workspace-launch-action workspace-launch-action--duplicate" type="button" data-launch-action="duplicates"><span class="workspace-launch-action__icon">${icons.duplicate}</span><strong>Review Duplicates</strong><p>Compare equivalent records before creating another workspace.</p><small>Open review →</small></button>
        <button class="workspace-launch-action workspace-launch-action--archive" type="button" data-launch-filter="archived"><span class="workspace-launch-action__icon">${icons.archive}</span><strong>Archived Workspaces</strong><p>Restore a previous workspace instead of creating a replacement.</p><small>View archive →</small></button>
      </div><p class="workspace-launch-status" data-launch-status aria-live="polite"></p>`;
  }

  function decorateCards() {
    $$('.workspace-card').forEach((card) => {
      const state = statusFor(card);
      card.dataset.launchStatus = state;
      let chip = card.querySelector('.workspace-card-status-chip');
      if (!chip) {
        chip = document.createElement('span');
        card.querySelector('.workspace-card-top')?.insertAdjacentElement('afterend', chip);
      }
      chip.className = `workspace-card-status-chip workspace-card-status-chip--${state}`;
      chip.textContent = state === 'active' ? 'Active' : state === 'setup' ? 'Setup incomplete' : 'Archived';
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
    toolbar.innerHTML = `<div><div class="eyebrow">Your Workspaces</div><h2>Workspace Portfolio</h2></div><label class="workspace-portfolio-search"><span class="sr-only">Search workspace portfolio</span><input type="search" placeholder="Search workspaces…" data-launch-search /></label>`;
    let tabs = shell.querySelector('.workspace-filter-tabs');
    if (!tabs) { tabs = document.createElement('div'); tabs.className = 'workspace-filter-tabs'; toolbar.insertAdjacentElement('afterend', tabs); }
    tabs.innerHTML = `<button type="button" data-launch-filter="all">All <span class="count">${c.all}</span></button><button type="button" data-launch-filter="active">Active <span class="count">${c.active}</span></button><button type="button" data-launch-filter="setup">Setup incomplete <span class="count">${c.setup}</span></button><button type="button" data-launch-filter="archived">Archived <span class="count">${c.archived}</span></button>`;
  }

  function enhanceRegistry() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    ensureStyles(); renderBrand(); renderHeader(); renderActions(); decorateCards(); renderPortfolio(); renderNavigation();
    applyFilter(document.body.dataset.launchFilter || 'all');
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-founder-home-tag]')) { event.preventDefault(); activateHome(); return; }
    const dialogClose = event.target.closest('.workspace-compare-dialog [value="close"], [data-close-duplicate-review]');
    if (dialogClose) { event.preventDefault(); dialogClose.closest('dialog')?.close(); return; }
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
    if (filter) { event.preventDefault(); scrollToPortfolio(filter.dataset.launchFilter); }
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-launch-search]')) applyFilter(document.body.dataset.launchFilter || 'all');
  });

  window.addEventListener('founder-os:workspace-registry-rendered', enhanceRegistry);
  window.addEventListener('founder-os:workspace-view-changed', () => { renderBrand(); if (document.body.dataset.activeWorkspace === 'registry') setTimeout(enhanceRegistry, 0); });
  window.addEventListener('founder-os:workspace-lifecycle-changed', () => setTimeout(enhanceRegistry, 0));

  ensureStyles(); renderBrand(); enhanceRegistry();
})();