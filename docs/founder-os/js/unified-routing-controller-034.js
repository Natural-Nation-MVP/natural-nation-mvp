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

  function openView(controlOrTarget) {
    const target = typeof controlOrTarget === 'string'
      ? controlOrTarget
      : controlOrTarget?.dataset.pageLinkView || controlOrTarget?.dataset.contextModule || controlOrTarget?.dataset.workspaceButton || '';
    if (!target) return false;
    if (target === 'registry') return openHome();
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

  function restoreCompatibilitySelectors() {
    $$('.workspace-card[data-workspace-id]').forEach((card) => {
      const workspaceId = workspaceIdFromCard(card) || card.dataset.workspaceId;
      if (!workspaceId) return;
      card.dataset.pageLinkWorkspace = workspaceId;
      card.classList.remove('is-unavailable');
      card.setAttribute('aria-disabled', 'false');
      card.tabIndex = 0;
      card.setAttribute('role', 'link');

      const legacyOpenButton = $('.generate, button', card);
      if (legacyOpenButton && !legacyOpenButton.dataset.resumeWorkspace) {
        legacyOpenButton.dataset.resumeWorkspace = workspaceId;
      }
    });

    $$('[data-page-link-view]').forEach((control) => {
      if (!control.dataset.contextModule) control.dataset.contextModule = control.dataset.pageLinkView;
    });
    $$('[data-context-module]').forEach((control) => {
      if (!control.dataset.pageLinkView) control.dataset.pageLinkView = control.dataset.contextModule;
    });

    $$('[data-page-link-home]').forEach((control) => {
      if (!control.hasAttribute('data-command-center-home')) control.setAttribute('data-command-center-home', '');
    });
    $$('[data-command-center-home]').forEach((control) => {
      if (!control.hasAttribute('data-page-link-home')) control.setAttribute('data-page-link-home', '');
    });
  }

  function auditRoutes() {
    restoreCompatibilitySelectors();
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

    const home = event.target.closest?.('[data-page-link-home], [data-command-center-home], [data-founder-home-tag], [data-workspace-button="registry"]');
    if (home) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openHome();
      return;
    }

    const reviewBlueprint = event.target.closest?.('[data-review-blueprint]');
    if (reviewBlueprint && !reviewBlueprint.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openView(document.body.dataset.nnosFlowStage === 'build-ready' ? 'build' : 'blueprint');
      return;
    }

    const view = event.target.closest?.('[data-page-link-view], [data-context-module], [data-workspace-button]');
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

    const home = event.target.closest?.('[data-page-link-home], [data-command-center-home], [data-founder-home-tag], [data-workspace-button="registry"]');
    if (home) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openHome();
      return;
    }

    const view = event.target.closest?.('[data-page-link-view], [data-context-module], [data-workspace-button]');
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