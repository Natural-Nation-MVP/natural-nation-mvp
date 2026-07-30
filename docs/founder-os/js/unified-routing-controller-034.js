(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let lastRouteAt = 0;

  function routeOnce(action) {
    const now = performance.now();
    if (now - lastRouteAt < 120) return false;
    lastRouteAt = now;
    action();
    return true;
  }

  function workspaceIdFromCard(card) {
    return card?.dataset.pageLinkWorkspace || card?.dataset.workspaceId || '';
  }

  function openWorkspace(card) {
    const workspaceId = workspaceIdFromCard(card);
    if (!workspaceId || card.hidden || card.getAttribute('aria-disabled') === 'true') return false;
    return routeOnce(() => window.NNOSPageLinks?.openWorkspace(workspaceId));
  }

  function openHome() {
    return routeOnce(() => window.NNOSPageLinks?.openHome());
  }

  function openView(control) {
    const target = control?.dataset.pageLinkView || control?.dataset.contextModule || '';
    if (!target) return false;
    return routeOnce(() => window.NNOSPageLinks?.goToView(target));
  }

  function forwardGreeting(button) {
    if (!button || button.dataset.routingForward === 'true') return false;
    button.dataset.routingForward = 'true';
    queueMicrotask(() => {
      button.click();
      delete button.dataset.routingForward;
    });
    return true;
  }

  function syncWorkspaceConfirmation(checkbox) {
    const createButton = $('[data-workspace-create-protected]');
    if (!checkbox || !createButton) return;
    createButton.disabled = !checkbox.checked;
    createButton.setAttribute('aria-disabled', String(!checkbox.checked));
    checkbox.closest('.workspace-confirmation')?.classList.toggle('is-confirmed', checkbox.checked);
  }

  function auditRoutes() {
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      if (!card.dataset.pageLinkWorkspace) card.dataset.pageLinkWorkspace = card.dataset.workspaceId;
      card.classList.remove('is-unavailable');
      card.setAttribute('aria-disabled', 'false');
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
    });

    $$('[data-context-module]').forEach((control) => {
      control.dataset.pageLinkView = control.dataset.contextModule;
    });

    const checkbox = $('[data-workspace-confirm]');
    if (checkbox) syncWorkspaceConfirmation(checkbox);
  }

  document.addEventListener('click', (event) => {
    const greeting = event.target.closest?.('[data-open-founder-settings]');
    if (greeting) {
      if (greeting.dataset.routingForward === 'true') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      forwardGreeting(greeting);
      return;
    }

    const checkbox = event.target.closest?.('[data-workspace-confirm]');
    if (checkbox) {
      queueMicrotask(() => syncWorkspaceConfirmation(checkbox));
      return;
    }

    const home = event.target.closest?.('[data-page-link-home], [data-command-center-home], [data-founder-home-tag]');
    if (home) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openHome();
      return;
    }

    const view = event.target.closest?.('[data-page-link-view], [data-context-module]');
    if (view) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openView(view);
      return;
    }

    const card = event.target.closest?.('.workspace-card');
    if (card && !event.target.closest('button,a,input,select,textarea,summary,details')) {
      const track = card.closest('[data-workspace-registry-list]');
      if (window.NNOSCarousel?.shouldSuppressClick(track)) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      openWorkspace(card);
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;

    const greeting = event.target.closest?.('[data-open-founder-settings]');
    if (greeting) {
      event.preventDefault();
      event.stopImmediatePropagation();
      forwardGreeting(greeting);
      return;
    }

    const home = event.target.closest?.('[data-page-link-home], [data-command-center-home], [data-founder-home-tag]');
    if (home) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openHome();
      return;
    }

    const view = event.target.closest?.('[data-page-link-view], [data-context-module]');
    if (view) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openView(view);
      return;
    }

    const card = event.target.closest?.('.workspace-card');
    if (card) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openWorkspace(card);
    }
  }, true);

  document.addEventListener('change', (event) => {
    if (event.target.matches?.('[data-workspace-confirm]')) syncWorkspaceConfirmation(event.target);
  }, true);

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed', 'founder-os:workspace-lifecycle-changed'].forEach((name) => {
    window.addEventListener(name, () => requestAnimationFrame(auditRoutes));
  });

  new MutationObserver(() => requestAnimationFrame(auditRoutes)).observe(document.body, { childList: true, subtree: true });

  window.NNOSUnifiedRouting = { audit: auditRoutes, openWorkspace, openHome, openView };
  auditRoutes();
})();