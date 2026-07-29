(() => {
  const $ = (selector) => document.querySelector(selector);

  function clearStrandedTransition() {
    const main = $('.main');
    if (!main) return;
    main.classList.remove('view-transition-out', 'view-transition-in');
    main.hidden = false;
    main.style.removeProperty('display');
    main.style.removeProperty('visibility');
    main.style.removeProperty('opacity');
  }

  function ensureInitialView() {
    clearStrandedTransition();
    if ($('.workspace-view.active')) return;
    const registry = $('[data-workspace="registry"]');
    if (!registry) return;
    registry.classList.add('active');
    document.body.dataset.activeWorkspace = 'registry';
    document.body.dataset.activeView = 'registry';
  }

  function report(message) {
    clearStrandedTransition();
    const status = $('[data-workspace-registry-status]') || $('[data-workspace-manager-status]');
    if (status && !status.dataset.startupErrorShown) {
      status.dataset.startupErrorShown = 'true';
      status.textContent = `Founder OS recovered from an error. ${message || 'Refresh once if a control appears stale.'}`;
    }
  }

  window.addEventListener('error', (event) => report(event?.message));
  window.addEventListener('unhandledrejection', (event) => report(event?.reason?.message || String(event?.reason || 'A background request failed.')));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureInitialView, { once: true });
  else ensureInitialView();
})();
