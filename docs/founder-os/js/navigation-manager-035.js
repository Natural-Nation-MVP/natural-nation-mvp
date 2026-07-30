(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function workspaceIdFromCard(card) {
    return card?.dataset.workspaceId || card?.dataset.pageLinkWorkspace || '';
  }

  function routeWorkspace(card) {
    const workspaceId = workspaceIdFromCard(card);
    if (!workspaceId || card.hidden || card.getAttribute('aria-disabled') === 'true') return false;
    return Boolean(window.NNOSPageLinks?.openWorkspace?.(workspaceId));
  }

  function routeHome() {
    return Boolean(window.NNOSPageLinks?.openHome?.());
  }

  function routeView(control) {
    const target = control?.dataset.pageLinkView || control?.dataset.contextModule || control?.dataset.workspaceButton || '';
    if (!target) return false;
    if (target === 'registry') return routeHome();
    return Boolean(window.NNOSPageLinks?.goToView?.(target));
  }

  function normalizeCards() {
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      const workspaceId = card.dataset.workspaceId;
      card.dataset.pageLinkWorkspace = workspaceId;
      card.classList.remove('is-unavailable');
      card.setAttribute('aria-disabled', 'false');
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
      card.querySelectorAll('[data-resume-workspace]').forEach((button) => {
        button.removeAttribute('data-resume-workspace');
        button.hidden = true;
        button.tabIndex = -1;
        button.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function audit() {
    normalizeCards();
    $$('[data-context-module]').forEach((control) => {
      if (!control.dataset.pageLinkView) control.dataset.pageLinkView = control.dataset.contextModule;
    });
    $$('[data-command-center-home]').forEach((control) => {
      if (!control.hasAttribute('data-page-link-home')) control.setAttribute('data-page-link-home', '');
    });
  }

  document.addEventListener('click', (event) => {
    const greeting = event.target.closest?.('[data-open-founder-settings]');
    if (greeting) return;

    const home = event.target.closest?.('[data-page-link-home], [data-command-center-home], [data-founder-home-tag], [data-workspace-button="registry"]');
    if (home) {
      event.preventDefault();
      event.stopImmediatePropagation();
      routeHome();
      return;
    }

    const view = event.target.closest?.('[data-page-link-view], [data-context-module], [data-workspace-button]');
    if (view) {
      event.preventDefault();
      event.stopImmediatePropagation();
      routeView(view);
      return;
    }

    const card = event.target.closest?.('.workspace-card[data-workspace-id]');
    if (!card || event.target.closest('button,a,input,select,textarea,summary,details')) return;

    const track = card.closest('[data-workspace-registry-list]');
    if (window.NNOSCarousel?.shouldSuppressClick?.(track)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    routeWorkspace(card);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;

    const home = event.target.closest?.('[data-page-link-home], [data-command-center-home], [data-founder-home-tag], [data-workspace-button="registry"]');
    if (home) {
      event.preventDefault();
      event.stopImmediatePropagation();
      routeHome();
      return;
    }

    const view = event.target.closest?.('[data-page-link-view], [data-context-module], [data-workspace-button]');
    if (view) {
      event.preventDefault();
      event.stopImmediatePropagation();
      routeView(view);
      return;
    }

    const card = event.target.closest?.('.workspace-card[data-workspace-id]');
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    routeWorkspace(card);
  }, true);

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed', 'founder-os:workspace-lifecycle-changed'].forEach((name) => {
    window.addEventListener(name, () => requestAnimationFrame(audit));
  });

  new MutationObserver(() => requestAnimationFrame(audit)).observe(document.body, { childList: true, subtree: true });

  window.NNOSNavigationManager = { audit, routeWorkspace, routeHome, routeView };
  audit();
})();
