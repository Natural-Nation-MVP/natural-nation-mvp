(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const managementPath = window.NNOSPaths.asset('config/workspace-registry.json?v=1.6.1');
  const canonicalPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.1.0');
  let directory = null;
  let directoryPromise = null;
  let navigating = false;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function modulesFor(workspaceId) {
    if (workspaceId === 'founder-os') return [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Operations' },
      { target: 'repo', label: 'Code Status', group: 'Operations' },
      { target: 'knowledge', label: 'System Records', group: 'Records' }
    ];
    if (workspaceId === 'natural-nation') return [
      { target: 'mission', label: 'Product Overview', group: 'Start' },
      { target: 'discovery', label: 'Confirmed Direction', group: 'Planning' },
      { target: 'blueprint', label: 'Approved Plan', group: 'Planning' },
      { target: 'build', label: 'Build Work', group: 'Execution' },
      { target: 'ai', label: 'Assigned AI Team', group: 'Execution' },
      { target: 'repo', label: 'Code Status', group: 'Execution' },
      { target: 'knowledge', label: 'Product Records', group: 'Records' }
    ];
    return [
      { target: 'mission', label: 'Overview', group: 'Start' },
      { target: 'ai', label: 'AI Team', group: 'Execution' },
      { target: 'repo', label: 'Code Status', group: 'Execution' },
      { target: 'knowledge', label: 'Workspace Records', group: 'Records' }
    ];
  }

  function mergeDirectory(management, canonical) {
    const managementById = new Map((management?.workspaces || []).map((item) => [item.id, item]));
    const merged = [];
    const founder = managementById.get('founder-os');
    if (founder) merged.push({ ...founder, modules: modulesFor('founder-os') });
    for (const item of canonical?.workspaces || []) {
      const id = item.workspaceId;
      const base = managementById.get(id);
      if (base) {
        if (!merged.some((workspace) => workspace.id === id)) merged.push({ ...base, workspaceKey: item.workspaceKey || id, modules: modulesFor(id) });
        continue;
      }
      const displayName = item.displayName || item.workspaceKey || id;
      merged.push({
        id,
        workspaceKey: item.workspaceKey || id,
        name: displayName,
        description: item.description || 'Founder-created workspace registered through Founder OS.',
        purpose: id === 'natural-nation' ? 'Build and review the Natural Nation product.' : 'Plan, review, and build this independent product workspace.',
        type: id === 'natural-nation' ? 'Product Workspace' : 'Founder-Created Workspace',
        roleLabel: id === 'natural-nation' ? 'Builds the product' : 'Builds an independent product',
        stage: item.status === 'active' ? 'Active' : 'Foundation',
        status: item.status || 'foundation',
        health: item.health?.summary || 'Workspace foundation initialized',
        progress: item.status === 'active' ? 52 : 15,
        progressLabel: item.status === 'active' ? 'Active workspace' : 'Foundation initialized',
        nextAction: item.status === 'active' ? 'Review current product status' : 'Review the workspace foundation',
        resumeWorkspace: 'mission',
        modules: modulesFor(id)
      });
    }
    return merged;
  }

  async function loadDirectory() {
    if (directory) return directory;
    if (directoryPromise) return directoryPromise;
    directoryPromise = Promise.all([
      fetch(`${managementPath}&linkController=032`, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(`Management registry returned ${response.status}`);
        return response.json();
      }),
      fetch(`${canonicalPath}&linkController=032`, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(`Canonical registry returned ${response.status}`);
        return response.json();
      })
    ]).then(([management, canonical]) => {
      directory = mergeDirectory(management, canonical);
      return directory;
    }).finally(() => { directoryPromise = null; });
    return directoryPromise;
  }

  function renderWorkspaceNavigation(workspace, activeTarget) {
    const nav = $('.nav');
    if (!nav) return;
    const groups = new Map();
    for (const module of workspace.modules || []) {
      if (!$(`[data-workspace="${module.target}"]`)) continue;
      const group = module.group || 'Workspace';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(module);
    }
    nav.innerHTML = `<button class="nav-link back-link" type="button" data-page-link-home>← Founder OS Home</button>
      <div class="nav-context"><small>You are working in</small><strong>${escapeHtml(workspace.name)}</strong><span>${escapeHtml(workspace.roleLabel || workspace.type || 'Workspace')}</span></div>
      ${[...groups.entries()].map(([group, modules]) => `<div class="nav-group"><div class="nav-group-label">${escapeHtml(group)}</div>${modules.map((module) => `<button class="nav-link${module.target === activeTarget ? ' active' : ''}" type="button" data-page-link-view="${escapeHtml(module.target)}" aria-current="${module.target === activeTarget ? 'page' : 'false'}">${escapeHtml(module.label)}</button>`).join('')}</div>`).join('')}`;
  }

  function syncNavigationState(target) {
    $$('[data-page-link-view]').forEach((button) => {
      const active = button.dataset.pageLinkView === target;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function goToView(target) {
    const workspace = window.NNOSActiveWorkspace;
    if (!workspace || !(workspace.modules || []).some((module) => module.target === target)) return false;
    if (!$(`[data-workspace="${target}"]`)) return false;
    syncNavigationState(target);
    window.setWorkspace?.(target);
    $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
    return true;
  }

  async function openWorkspace(workspaceId) {
    if (!workspaceId || navigating) return false;
    navigating = true;
    try {
      const workspaces = await loadDirectory();
      const workspace = workspaces.find((item) => item.id === workspaceId);
      if (!workspace) throw new Error(`Workspace ${workspaceId} is not registered.`);
      window.NNOSActiveWorkspace = workspace;
      const target = workspace.resumeWorkspace || 'mission';
      renderWorkspaceNavigation(workspace, target);
      window.setWorkspace?.(target);
      $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
      return true;
    } catch (error) {
      console.error(error);
      const status = $('[data-workspace-registry-status]');
      if (status) status.textContent = `Unable to open workspace: ${error.message}`;
      return false;
    } finally {
      navigating = false;
    }
  }

  function openHome() {
    window.NNOSActiveWorkspace = null;
    $$('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === 'registry'));
    const nav = $('.nav');
    if (nav) nav.innerHTML = '<button class="nav-link active" type="button" data-page-link-home aria-current="page">Home</button>';
    const title = $('[data-workspace-title]');
    const subtitle = $('[data-workspace-subtitle]');
    const badge = $('[data-workspace-badge]');
    if (title) title.textContent = `${greeting()}, Dewane`;
    if (subtitle) subtitle.textContent = 'Choose Founder OS to manage the system or open a product workspace.';
    if (badge) {
      badge.hidden = false;
      badge.textContent = 'Founder OS Home';
    }
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';
    window.NNOSShowExecutionBar?.('none');
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', { detail: { workspace: null, target: 'registry' } }));
    $('.main')?.scrollTo?.({ top: 0, behavior: 'auto' });
    return true;
  }

  function isolateLegacyLinks() {
    $$('[data-resume-workspace]').forEach((button) => {
      const card = button.closest('.workspace-card');
      if (card) card.dataset.pageLinkWorkspace = button.dataset.resumeWorkspace || card.dataset.workspaceId || '';
      button.removeAttribute('data-resume-workspace');
      button.hidden = true;
      button.setAttribute('aria-hidden', 'true');
      button.tabIndex = -1;
    });
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      if (!card.dataset.pageLinkWorkspace) card.dataset.pageLinkWorkspace = card.dataset.workspaceId;
    });
    $$('[data-context-module]').forEach((button) => {
      button.dataset.pageLinkView = button.dataset.contextModule;
      button.removeAttribute('data-context-module');
    });
    $$('[data-command-center-home]').forEach((button) => {
      button.dataset.pageLinkHome = '';
      button.removeAttribute('data-command-center-home');
    });
  }

  function cardFromEvent(event) {
    const card = event.target.closest?.('.workspace-card[data-page-link-workspace]');
    if (!card || event.target.closest('button,a,input,select,textarea,summary,details')) return null;
    if (card.hidden || card.getAttribute('aria-disabled') === 'true') return null;
    const track = card.closest('[data-workspace-registry-list]');
    if (window.NNOSCarousel?.shouldSuppressClick(track)) return null;
    return card;
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    const card = cardFromEvent(event);
    if (card) {
      event.preventDefault();
      openWorkspace(card.dataset.pageLinkWorkspace);
      return;
    }
    const home = event.target.closest?.('[data-page-link-home]');
    if (home) {
      event.preventDefault();
      openHome();
      return;
    }
    const view = event.target.closest?.('[data-page-link-view]');
    if (view) {
      event.preventDefault();
      goToView(view.dataset.pageLinkView);
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.workspace-card[data-page-link-workspace]')) {
      event.preventDefault();
      if (!window.NNOSCarousel?.shouldSuppressClick(event.target.closest('[data-workspace-registry-list]'))) openWorkspace(event.target.dataset.pageLinkWorkspace);
    }
  });

  window.addEventListener('founder-os:workspace-registry-rendered', () => requestAnimationFrame(isolateLegacyLinks));
  window.addEventListener('founder-os:workspace-view-changed', () => requestAnimationFrame(isolateLegacyLinks));
  new MutationObserver(() => isolateLegacyLinks()).observe(document.body, { childList: true, subtree: true });

  window.NNOSPageLinks = { openWorkspace, openHome, goToView, isolate: isolateLegacyLinks, reloadDirectory: () => { directory = null; return loadDirectory(); } };
  loadDirectory().catch((error) => console.error('Page-link directory preload failed', error));
  isolateLegacyLinks();
})();