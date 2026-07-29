(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function clearTransitionState() {
    $('.main')?.classList.remove('view-transition-out', 'view-transition-in');
  }

  function ensureVisibleShell() {
    const shell = $('.app-shell');
    const main = $('.main');
    [shell, main].forEach((node) => {
      if (!node) return;
      node.hidden = false;
      node.removeAttribute('aria-hidden');
      node.style.removeProperty('display');
      node.style.removeProperty('visibility');
      node.style.removeProperty('opacity');
    });
    clearTransitionState();
  }

  function activateHomeDirectly() {
    ensureVisibleShell();
    window.NNOSActiveWorkspace = null;
    $$('[data-workspace]').forEach((view) => view.classList.toggle('active', view.dataset.workspace === 'registry'));
    $$('[data-execution-bar]').forEach((bar) => { bar.hidden = true; });
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', { detail: { workspace: null, target: 'registry', source: 'startup-recovery' } }));
    requestAnimationFrame(clearTransitionState);
  }

  function openWorkspaceCard(card) {
    if (!card || card.hidden || card.classList.contains('is-unavailable') || card.getAttribute('aria-disabled') === 'true') return;
    const button = card.querySelector('[data-resume-workspace]:not(:disabled)');
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
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

  window.addEventListener('error', (event) => reportStartupError(event?.message || 'A page script did not finish loading.'));
  window.addEventListener('unhandledrejection', (event) => reportStartupError(event?.reason?.message || String(event?.reason || 'A background request failed.')));

  document.addEventListener('click', (event) => {
    const brand = event.target.closest?.('[data-founder-home-tag]');
    if (brand) {
      event.preventDefault();
      activateHomeDirectly();
      return;
    }
    const card = event.target.closest?.('.workspace-card');
    if (card && !event.target.closest('button,a,input,select,textarea,summary,details')) {
      event.preventDefault();
      openWorkspaceCard(card);
    }
  });

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
  });

  function startupWatchdog() {
    ensureVisibleShell();
    if (!$('.workspace-view.active')) activateHomeDirectly();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startupWatchdog, { once: true });
  else startupWatchdog();
  setTimeout(startupWatchdog, 250);
})();
