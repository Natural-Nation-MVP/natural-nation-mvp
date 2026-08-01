(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const VERSION = 'v0.8.0';
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  const icons = {
    plus: '＋', clock: '◷', duplicate: '⧉', archive: '▣', health: '⌁', search: '⌕', arrow: '›'
  };

  function hasSavedDraft() {
    try { return Boolean(localStorage.getItem(DRAFT_KEY)); } catch { return false; }
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

  function setStatus(message) {
    const status = $('[data-launch-status]');
    if (status) status.textContent = message;
  }

  function renderBrand() {
    const brand = $('.brand');
    if (!brand) return;
    brand.innerHTML = `<button class="founder-home-tag" type="button" data-nav-home aria-label="Return to Founder OS Command Center ${VERSION}"><span class="founder-home-tag__icon" aria-hidden="true">☘</span><span class="founder-home-tag__copy"><strong>Founder OS</strong><span><span>Command Center</span><em>${VERSION}</em></span></span></button>`;
  }

  function renderHeader() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    if (title) title.textContent = 'Workspace Launch Center';
    if (subtitle) subtitle.textContent = 'Create new workspaces and manage what you are building.';
    $('[data-workspace-badge]')?.setAttribute('hidden', '');
  }

  function renderActions() {
    const panel = $('.command-center-hero');
    if (!panel || panel.dataset.homeActionsReady === 'true') return;
    panel.dataset.homeActionsReady = 'true';
    panel.className = 'workspace-launch-panel';
    panel.innerHTML = `<div class="workspace-launch-panel__header"><div class="eyebrow">Create a New Workspace</div></div>
      <div class="workspace-launch-actions">
        <button class="workspace-launch-action workspace-launch-action--create" type="button" data-launch-action="create"><span class="workspace-launch-action__icon">${icons.plus}</span><span><strong>Guided Workspace</strong><small>Describe what you want to build.</small></span><span>${icons.arrow}</span></button>
        <button class="workspace-launch-action workspace-launch-action--resume" type="button" data-launch-action="resume" ${hasSavedDraft() ? '' : 'disabled'}><span class="workspace-launch-action__icon">${icons.clock}</span><span><strong>Resume Setup</strong><small>${hasSavedDraft() ? 'Continue your saved draft.' : 'No saved draft.'}</small></span><span>${icons.arrow}</span></button>
        <button class="workspace-launch-action workspace-launch-action--duplicate" type="button" data-launch-action="duplicates"><span class="workspace-launch-action__icon">${icons.duplicate}</span><span><strong>Duplicate Review</strong><small>Compare equivalent workspaces.</small></span><span>${icons.arrow}</span></button>
        <button class="workspace-launch-action workspace-launch-action--archive" type="button" data-launch-filter="archived"><span class="workspace-launch-action__icon">${icons.archive}</span><span><strong>Archived Workspaces</strong><small>Restore a previous workspace.</small></span><span>${icons.arrow}</span></button>
      </div><p class="workspace-launch-status" data-launch-status aria-live="polite"></p>`;
  }

  function decorateCards() {
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      const state = statusFor(card);
      const id = card.dataset.workspaceId;
      const title = card.querySelector('.workspace-card-top h2')?.textContent?.trim() || id;
      const type = id === 'founder-os' ? 'Platform' : id === 'natural-nation' ? 'Product' : 'Workspace';
      const subtitle = id === 'founder-os' ? 'Command Center' : id === 'natural-nation' ? 'Wellness Platform' : 'Independent Workspace';
      const progress = Number.parseInt(card.querySelector('.workspace-progress-track span')?.style.width || '', 10) || (state === 'archived' ? 100 : 15);
      const nextAction = card.querySelector('.workspace-next-step strong')?.textContent?.trim() || 'Open workspace and review the next action';

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
      summary.innerHTML = `<div class="workspace-launch-card-topline"><span class="workspace-card-status-chip workspace-card-status-chip--${state}">${state === 'active' ? 'Active' : state === 'setup' ? 'Setup incomplete' : 'Archived'}</span><span class="workspace-type-chip">${type}</span></div>
        <div class="workspace-launch-card-title"><span class="workspace-launch-card-icon">${id === 'founder-os' ? '✦' : id === 'natural-nation' ? '⌁' : '◇'}</span><div><h3>${title}</h3><p>${subtitle}</p></div></div>
        <div class="workspace-launch-card-progress"><div><span>Completion</span><strong>${progress}%</strong></div><div class="workspace-launch-card-progress-track"><span style="width:${progress}%"></span></div></div>
        <div class="workspace-launch-card-next"><span>Next action</span><strong>${nextAction}</strong></div>`;
    });
  }

  function applyFilter(filter = 'all') {
    const query = ($('[data-launch-search]')?.value || '').trim().toLowerCase();
    $$('.workspace-card').forEach((card) => {
      const visible = (filter === 'all' || statusFor(card) === filter) && (!query || card.textContent.toLowerCase().includes(query));
      card.hidden = !visible;
    });
    $$('[data-launch-filter]').forEach((button) => {
      const active = button.dataset.launchFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.body.dataset.launchFilter = filter;
    window.NNOSNavigationManager?.audit?.();
  }

  function renderPortfolio() {
    const grid = $('[data-workspace-registry-list]');
    if (!grid) return;
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

  function renderHomeNavigation() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    const nav = $('.nav');
    if (!nav) return;
    const c = counts();
    nav.innerHTML = `<section class="nav-group"><div class="nav-group-label">Workspace Actions</div><button class="nav-link active" type="button" data-launch-action="create">${icons.plus} Create Workspace</button><button class="nav-link" type="button" data-launch-action="resume" ${hasSavedDraft() ? '' : 'disabled'}>${icons.clock} Resume Setup</button></section><section class="nav-group"><div class="nav-group-label">Workspace Portfolio</div><button class="nav-link" type="button" data-launch-filter="all">All Workspaces <span class="nav-count">${c.all}</span></button><button class="nav-link" type="button" data-launch-filter="active">Active <span class="nav-count">${c.active}</span></button><button class="nav-link" type="button" data-launch-filter="setup">Setup Incomplete <span class="nav-count">${c.setup}</span></button><button class="nav-link" type="button" data-launch-filter="archived">Archived <span class="nav-count">${c.archived}</span></button></section><section class="nav-group"><div class="nav-group-label">Management</div><button class="nav-link" type="button" data-launch-action="health">${icons.health} Workspace Health</button><button class="nav-link" type="button" data-launch-action="duplicates">${icons.duplicate} Duplicate Review</button></section>`;
  }

  function enhanceHome() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    renderBrand();
    renderHeader();
    renderActions();
    decorateCards();
    renderPortfolio();
    renderHomeNavigation();
    applyFilter(document.body.dataset.launchFilter || 'all');
  }

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-launch-action]');
    if (action) {
      event.preventDefault();
      const name = action.dataset.launchAction;
      if (name === 'create' || name === 'resume') {
        if (window.NNOSWorkspaceCreation?.open) window.NNOSWorkspaceCreation.open(action);
        else setStatus('Workspace creation is still loading. Try again in a moment.');
      } else if (name === 'duplicates') {
        const control = $('[data-open-duplicate-review]');
        if (control) control.click(); else setStatus('No duplicate workspace records currently require review.');
      } else if (name === 'health') {
        $('[data-launch-portfolio]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    const filter = event.target.closest('[data-launch-filter]');
    if (filter) {
      event.preventDefault();
      applyFilter(filter.dataset.launchFilter);
      $('[data-launch-portfolio]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-launch-search]')) applyFilter(document.body.dataset.launchFilter || 'all');
  });

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-lifecycle-changed'].forEach((name) => window.addEventListener(name, () => requestAnimationFrame(enhanceHome)));
  window.addEventListener('founder-os:workspace-view-changed', () => requestAnimationFrame(() => {
    renderBrand();
    if (document.body.dataset.activeWorkspace === 'registry') enhanceHome();
  }));

  renderBrand();
  enhanceHome();
})();