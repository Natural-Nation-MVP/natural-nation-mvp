(function () {
  'use strict';

  function one(selector) { return document.querySelector(selector); }
  function all(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  function releasePage() {
    document.body.classList.remove('founder-dialog-open', 'is-transitioning', 'is-loading');
    document.documentElement.classList.remove('founder-dialog-open', 'is-transitioning', 'is-loading');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    var main = one('.main');
    if (main) {
      main.hidden = false;
      main.classList.remove('view-transition-out', 'view-transition-in', 'is-transitioning', 'is-loading');
      main.style.removeProperty('display');
      main.style.removeProperty('visibility');
      main.style.removeProperty('opacity');
      main.style.removeProperty('pointer-events');
    }
  }

  function removeBlockingPopups(reason) {
    var selector = '[data-founder-system-dialog], [data-founder-settings-overlay], .founder-settings-overlay, .workspace-compare-dialog';
    all(selector).forEach(function (node) {
      try {
        if (node.tagName === 'DIALOG' && typeof node.close === 'function' && node.open) node.close();
      } catch (error) {}
      if (node.parentNode) node.parentNode.removeChild(node);
    });
    releasePage();
    window.dispatchEvent(new CustomEvent('founder-os:popup-layer-cleared', { detail: { reason: reason || 'recovery' } }));
  }

  function ensureInitialView() {
    removeBlockingPopups('startup');
    if (one('.workspace-view.active')) return;
    var registry = one('[data-workspace="registry"]');
    if (!registry) return;
    registry.classList.add('active');
    registry.hidden = false;
    registry.setAttribute('aria-hidden', 'false');
    document.body.setAttribute('data-active-workspace', 'registry');
    document.body.setAttribute('data-active-view', 'registry');
  }

  function report(message) {
    removeBlockingPopups('runtime-error');
    var status = one('[data-workspace-registry-status]') || one('[data-workspace-manager-status]');
    if (status && !status.getAttribute('data-startup-error-shown')) {
      status.setAttribute('data-startup-error-shown', 'true');
      status.textContent = 'Founder OS recovered from an error. ' + (message || 'Refresh once if a control appears stale.');
    }
  }

  window.addEventListener('error', function (event) { report(event && event.message); });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    report(reason && reason.message ? reason.message : String(reason || 'A background request failed.'));
  });

  window.addEventListener('pageshow', function () { removeBlockingPopups('pageshow'); });
  window.addEventListener('pagehide', function () { removeBlockingPopups('pagehide'); });
  window.addEventListener('founder-os:workspace-view-changed', function () { removeBlockingPopups('view-change'); });
  window.addEventListener('founder-os:navigation-home-render-requested', function () { removeBlockingPopups('home-route'); });

  window.NNOSPopupRecovery = {
    clear: removeBlockingPopups,
    releasePage: releasePage
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureInitialView, { once: true });
  else ensureInitialView();
})();
