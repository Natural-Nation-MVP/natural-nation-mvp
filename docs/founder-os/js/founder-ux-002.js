(function () {
  'use strict';

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  var VERSION = 'v0.9.0';
  var DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';
  var icons = { plus: '＋', clock: '◷', duplicate: '⧉', archive: '▣', health: '⌁', arrow: '›' };

  function hasSavedDraft() { try { return Boolean(localStorage.getItem(DRAFT_KEY)); } catch (error) { return false; } }
  function statusFor(card) {
    var text = card.textContent.toLowerCase();
    if (/archived|soft-deleted|deleted/.test(text)) return 'archived';
    if (/foundation|setup incomplete|created/.test(text) && ['founder-os', 'natural-nation'].indexOf(card.getAttribute('data-workspace-id')) === -1) return 'setup';
    return 'active';
  }
  function counts() {
    var result = { all: 0, active: 0, setup: 0, archived: 0 };
    all('.workspace-card').forEach(function (card) { result.all += 1; result[statusFor(card)] += 1; });
    return result;
  }
  function setStatus(message) { var status = one('[data-launch-status]'); if (status) status.textContent = message; }

  function renderBrand() {
    var brand = one('.brand');
    if (!brand) return;
    brand.innerHTML = '<button class="founder-home-tag" type="button" data-nav-home aria-label="Return to Founder OS Command Center ' + VERSION + '"><span class="founder-home-tag__icon" aria-hidden="true">☘</span><span class="founder-home-tag__copy"><strong>Founder OS</strong><span><span>Command Center</span><em>' + VERSION + '</em></span></span></button>';
  }

  function renderHeader() {
    if (document.body.getAttribute('data-active-workspace') !== 'registry') return;
    var title = one('[data-workspace-title]');
    var subtitle = one('[data-workspace-subtitle]');
    var badge = one('[data-workspace-badge]');
    if (title) title.textContent = 'Workspace Launch Center';
    if (subtitle) subtitle.textContent = 'Create new workspaces and manage what you are building.';
    if (badge) badge.setAttribute('hidden', '');
  }

  function renderActions() {
    var panel = one('.command-center-hero');
    if (!panel || panel.getAttribute('data-home-actions-ready') === 'true') return;
    panel.setAttribute('data-home-actions-ready', 'true');
    panel.className = 'workspace-launch-panel';
    panel.innerHTML = '<div class="workspace-launch-panel__header"><div class="eyebrow">Create a New Workspace</div></div>' +
      '<div class="workspace-launch-actions">' +
      '<button class="workspace-launch-action workspace-launch-action--create" type="button" data-launch-action="create"><span class="workspace-launch-action__icon">' + icons.plus + '</span><span><strong>Guided Workspace</strong><small>Describe what you want to build.</small></span><span>' + icons.arrow + '</span></button>' +
      '<button class="workspace-launch-action workspace-launch-action--resume" type="button" data-launch-action="resume" ' + (hasSavedDraft() ? '' : 'disabled') + '><span class="workspace-launch-action__icon">' + icons.clock + '</span><span><strong>Resume Setup</strong><small>' + (hasSavedDraft() ? 'Continue your saved draft.' : 'No saved draft.') + '</small></span><span>' + icons.arrow + '</span></button>' +
      '<button class="workspace-launch-action workspace-launch-action--duplicate" type="button" data-launch-action="duplicates"><span class="workspace-launch-action__icon">' + icons.duplicate + '</span><span><strong>Duplicate Review</strong><small>Compare equivalent workspaces.</small></span><span>' + icons.arrow + '</span></button>' +
      '<button class="workspace-launch-action workspace-launch-action--archive" type="button" data-launch-filter="archived"><span class="workspace-launch-action__icon">' + icons.archive + '</span><span><strong>Archived Workspaces</strong><small>Restore a previous workspace.</small></span><span>' + icons.arrow + '</span></button>' +
      '</div><p class="workspace-launch-status" data-launch-status aria-live="polite"></p>';
  }

  function decorateCards() {
    all('.workspace-card[data-workspace-id]').forEach(function (card) {
      var state = statusFor(card);
      var id = card.getAttribute('data-workspace-id');
      var oldTitle = card.querySelector('.workspace-card-top h2');
      var title = oldTitle ? oldTitle.textContent.trim() : id;
      var type = id === 'founder-os' ? 'Platform' : id === 'natural-nation' ? 'Product' : 'Workspace';
      var subtitle = id === 'founder-os' ? 'Command Center' : id === 'natural-nation' ? 'Wellness Platform' : 'Independent Workspace';
      var progressBar = card.querySelector('.workspace-progress-track span');
      var progress = parseInt(progressBar && progressBar.style.width ? progressBar.style.width : '', 10) || (state === 'archived' ? 100 : 15);
      var oldNext = card.querySelector('.workspace-next-step strong');
      var nextAction = oldNext ? oldNext.textContent.trim() : 'Open workspace and review the next action';
      card.setAttribute('data-launch-status', state);
      card.removeAttribute('tabindex');
      card.removeAttribute('role');
      card.removeAttribute('aria-label');

      var summary = card.querySelector('[data-launch-card-summary]');
      if (!summary) {
        summary = document.createElement('div');
        summary.setAttribute('data-launch-card-summary', '');
        summary.className = 'workspace-launch-card-summary';
        card.insertBefore(summary, card.firstChild);
      }
      summary.innerHTML = '<div class="workspace-launch-card-topline"><span class="workspace-card-status-chip workspace-card-status-chip--' + state + '">' + (state === 'active' ? 'Active' : state === 'setup' ? 'Setup incomplete' : 'Archived') + '</span><span class="workspace-type-chip">' + type + '</span></div>' +
        '<div class="workspace-launch-card-title"><span class="workspace-launch-card-icon">' + (id === 'founder-os' ? '✦' : id === 'natural-nation' ? '⌁' : '◇') + '</span><div><h3>' + title + '</h3><p>' + subtitle + '</p></div></div>' +
        '<div class="workspace-launch-card-progress"><div><span>Completion</span><strong>' + progress + '%</strong></div><div class="workspace-launch-card-progress-track"><span style="width:' + progress + '%"></span></div></div>' +
        '<div class="workspace-launch-card-next"><span>Next action</span><strong>' + nextAction + '</strong></div>';
    });
  }

  function applyFilter(filter) {
    filter = filter || 'all';
    var search = one('[data-launch-search]');
    var query = search ? search.value.trim().toLowerCase() : '';
    all('.workspace-card').forEach(function (card) {
      var visible = (filter === 'all' || statusFor(card) === filter) && (!query || card.textContent.toLowerCase().indexOf(query) !== -1);
      card.hidden = !visible;
    });
    all('[data-launch-filter]').forEach(function (button) {
      var active = button.getAttribute('data-launch-filter') === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.body.setAttribute('data-launch-filter', filter);
  }

  function renderPortfolio() {
    var grid = one('[data-workspace-registry-list]');
    if (!grid) return;
    var shell = one('[data-launch-portfolio]');
    if (!shell) {
      shell = document.createElement('section');
      shell.className = 'workspace-portfolio-shell';
      shell.setAttribute('data-launch-portfolio', '');
      grid.parentNode.insertBefore(shell, grid);
      shell.appendChild(grid);
    }
    var c = counts();
    var toolbar = shell.querySelector('.workspace-portfolio-toolbar');
    if (!toolbar) { toolbar = document.createElement('div'); toolbar.className = 'workspace-portfolio-toolbar'; shell.insertBefore(toolbar, shell.firstChild); }
    toolbar.innerHTML = '<div><div class="eyebrow">Your Workspaces</div></div><label class="workspace-portfolio-search"><span class="sr-only">Search workspace portfolio</span><input type="search" placeholder="Search workspaces by name or description…" data-launch-search></label>';
    var tabs = shell.querySelector('.workspace-filter-tabs');
    if (!tabs) { tabs = document.createElement('div'); tabs.className = 'workspace-filter-tabs'; toolbar.parentNode.insertBefore(tabs, toolbar.nextSibling); }
    tabs.innerHTML = '<div class="workspace-filter-tabs__items"><button type="button" data-launch-filter="all">All <span class="count">' + c.all + '</span></button><button type="button" data-launch-filter="active">Active <span class="count">' + c.active + '</span></button><button type="button" data-launch-filter="setup">Setup incomplete <span class="count">' + c.setup + '</span></button><button type="button" data-launch-filter="archived">Archived <span class="count">' + c.archived + '</span></button></div>';
  }

  function renderHomeNavigation() {
    if (document.body.getAttribute('data-active-workspace') !== 'registry') return;
    var nav = one('.nav');
    if (!nav) return;
    var c = counts();
    nav.innerHTML = '<section class="nav-group"><div class="nav-group-label">Workspace Actions</div><button class="nav-link active" type="button" data-launch-action="create">' + icons.plus + ' Create Workspace</button><button class="nav-link" type="button" data-launch-action="resume" ' + (hasSavedDraft() ? '' : 'disabled') + '>' + icons.clock + ' Resume Setup</button></section>' +
      '<section class="nav-group"><div class="nav-group-label">Workspace Portfolio</div><button class="nav-link" type="button" data-launch-filter="all">All Workspaces <span class="nav-count">' + c.all + '</span></button><button class="nav-link" type="button" data-launch-filter="active">Active <span class="nav-count">' + c.active + '</span></button><button class="nav-link" type="button" data-launch-filter="setup">Setup Incomplete <span class="nav-count">' + c.setup + '</span></button><button class="nav-link" type="button" data-launch-filter="archived">Archived <span class="nav-count">' + c.archived + '</span></button></section>' +
      '<section class="nav-group"><div class="nav-group-label">Management</div><button class="nav-link" type="button" data-launch-action="health">' + icons.health + ' Workspace Health</button><button class="nav-link" type="button" data-launch-action="duplicates">' + icons.duplicate + ' Duplicate Review</button></section>';
  }

  function enhanceHome() {
    if (document.body.getAttribute('data-active-workspace') !== 'registry') return;
    renderBrand(); renderHeader(); renderActions(); decorateCards(); renderPortfolio(); renderHomeNavigation();
    applyFilter(document.body.getAttribute('data-launch-filter') || 'all');
  }

  document.addEventListener('click', function (event) {
    var action = event.target.closest ? event.target.closest('[data-launch-action]') : null;
    if (action) {
      event.preventDefault();
      var name = action.getAttribute('data-launch-action');
      if (name === 'create' || name === 'resume') {
        if (window.NNOSWorkspaceCreation && window.NNOSWorkspaceCreation.open) window.NNOSWorkspaceCreation.open(action);
        else setStatus('Workspace creation is still loading. Try again in a moment.');
      } else if (name === 'duplicates') {
        var control = one('[data-open-duplicate-review]');
        if (control) control.click(); else setStatus('No duplicate workspace records currently require review.');
      } else if (name === 'health') {
        var portfolio = one('[data-launch-portfolio]'); if (portfolio) portfolio.scrollIntoView();
      }
      return;
    }
    var filter = event.target.closest ? event.target.closest('[data-launch-filter]') : null;
    if (filter) { event.preventDefault(); applyFilter(filter.getAttribute('data-launch-filter')); }
  }, false);

  document.addEventListener('input', function (event) {
    if (event.target && event.target.matches && event.target.matches('[data-launch-search]')) applyFilter(document.body.getAttribute('data-launch-filter') || 'all');
  }, false);

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-lifecycle-changed'].forEach(function (name) {
    window.addEventListener(name, function () { requestAnimationFrame(enhanceHome); });
  });
  window.addEventListener('founder-os:workspace-view-changed', function () {
    requestAnimationFrame(function () { renderBrand(); if (document.body.getAttribute('data-active-workspace') === 'registry') enhanceHome(); });
  });

  renderBrand();
  enhanceHome();
})();
