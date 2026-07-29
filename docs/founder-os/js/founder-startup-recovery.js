(() => {
  // Founder OS startup and touch safety layer.
  // This file intentionally loads last so it can recover the shell even when an earlier enhancement fails.
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let lastPointerAction = 0;

  function clearTransitionState() {
    const main = $('.main');
    main?.classList.remove('view-transition-out', 'view-transition-in');
  }

  function ensureVisibleShell() {
    const shell = $('.app-shell');
    const main = $('.main');
    if (shell) {
      shell.hidden = false;
      shell.removeAttribute('aria-hidden');
      shell.style.removeProperty('display');
      shell.style.removeProperty('visibility');
      shell.style.removeProperty('opacity');
    }
    if (main) {
      main.hidden = false;
      main.style.removeProperty('display');
      main.style.removeProperty('visibility');
      main.style.removeProperty('opacity');
    }
    clearTransitionState();
  }

  function activateHomeDirectly() {
    ensureVisibleShell();
    window.NNOSActiveWorkspace = null;
    $$('[data-workspace]').forEach((view) => {
      const active = view.dataset.workspace === 'registry';
      view.classList.toggle('active', active);
      view.hidden = false;
    });
    $$('[data-execution-bar]').forEach((bar) => { bar.hidden = true; });
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', {
      detail: { workspace: null, target: 'registry', source: 'startup-recovery' }
    }));
    requestAnimationFrame(clearTransitionState);
  }

  function openWorkspaceCard(card) {
    if (!card || card.hidden || card.classList.contains('is-unavailable') || card.getAttribute('aria-disabled') === 'true') return;
    const button = card.querySelector('[data-resume-workspace]:not(:disabled)');
    if (!button) return;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    requestAnimationFrame(clearTransitionState);
  }

  function reportStartupError(message) {
    ensureVisibleShell();
    const status = $('[data-workspace-registry-status]') || $('[data-workspace-manager-status]');
    if (status && !status.dataset.startupErrorShown) {
      status.dataset.startupErrorShown = 'true';
      status.textContent = `Founder OS recovered from a startup error. ${message || 'Refresh once if a control still appears stale.'}`;
    }
  }

  window.addEventListener('error', (event) => {
    reportStartupError(event?.message || 'A page script did not finish loading.');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || String(event?.reason || 'A background request failed.');
    reportStartupError(reason);
  });

  document.addEventListener('pointerup', (event) => {
    const brand = event.target.closest?.('[data-founder-home-tag]');
    if (brand) {
      event.preventDefault();
      event.stopImmediatePropagation();
      lastPointerAction = Date.now();
      activateHomeDirectly();
      return;
    }

    const card = event.target.closest?.('.workspace-card');
    if (card && !event.target.closest('button,a,input,select,textarea,summary,details')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      lastPointerAction = Date.now();
      openWorkspaceCard(card);
    }
  }, true);

  document.addEventListener('click', (event) => {
    if (Date.now() - lastPointerAction < 500) return;
    const brand = event.target.closest?.('[data-founder-home-tag]');
    if (brand) {
      event.preventDefault();
      event.stopImmediatePropagation();
      activateHomeDirectly();
      return;
    }
    const card = event.target.closest?.('.workspace-card');
    if (card && !event.target.closest('button,a,input,select,textarea,summary,details')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openWorkspaceCard(card);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    if (event.target.matches?.('[data-founder-home-tag]')) {
      event.preventDefault();
      activateHomeDirectly();
      return;
    }
    if (event.target.matches?.('.workspace-card')) {
      event.preventDefault();
      openWorkspaceCard(event.target);
    }
  }, true);

  function startupWatchdog() {
    ensureVisibleShell();
    const activeView = $('.workspace-view.active');
    if (!activeView) activateHomeDirectly();
    const registry = $('[data-workspace="registry"]');
    if (document.body.dataset.activeWorkspace === 'registry' && registry) registry.classList.add('active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startupWatchdog, { once: true });
  } else {
    startupWatchdog();
  }
  setTimeout(startupWatchdog, 250);
  setTimeout(startupWatchdog, 1200);
})();
