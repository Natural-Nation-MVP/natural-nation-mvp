(function () {
  'use strict';

  var ACTIVE_SELECTOR = '[data-founder-system-dialog], [data-founder-settings-overlay], .founder-settings-overlay, .workspace-compare-dialog';

  function all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function releasePage() {
    document.body.classList.remove('founder-dialog-open');
    document.documentElement.classList.remove('founder-dialog-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    var main = document.querySelector('.main');
    if (main) main.style.removeProperty('pointer-events');
  }

  function closeNode(node) {
    if (!node) return;
    try {
      if (node.tagName === 'DIALOG' && typeof node.close === 'function' && node.open) node.close();
    } catch (error) {}
    if (node.parentNode) node.parentNode.removeChild(node);
  }

  function closeAll(reason) {
    all(ACTIVE_SELECTOR).forEach(closeNode);
    releasePage();
    window.dispatchEvent(new CustomEvent('founder-os:modal-state-cleared', { detail: { reason: reason || 'manual' } }));
  }

  function prepare(node) {
    closeAll('before-open');
    if (!node) return null;
    node.setAttribute('data-founder-modal-managed', 'true');
    return node;
  }

  function isBlocked() {
    return all(ACTIVE_SELECTOR).some(function (node) {
      if (node.tagName === 'DIALOG') return Boolean(node.open);
      var style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.pointerEvents !== 'none';
    });
  }

  document.addEventListener('click', function (event) {
    var overlay = event.target && event.target.closest ? event.target.closest('.founder-settings-overlay,[data-founder-settings-overlay]') : null;
    if (overlay && event.target === overlay) {
      event.preventDefault();
      closeAll('backdrop-click');
    }
  }, false);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isBlocked()) {
      event.preventDefault();
      closeAll('escape');
    }
  }, false);

  window.addEventListener('pageshow', function () { closeAll('pageshow'); });
  window.addEventListener('pagehide', function () { closeAll('pagehide'); });
  window.addEventListener('founder-os:workspace-view-changed', function () { closeAll('view-change'); });
  window.addEventListener('founder-os:navigation-home-render-requested', function () { closeAll('home-route'); });

  window.NNOSModalManager = {
    prepare: prepare,
    closeAll: closeAll,
    isBlocked: isBlocked,
    releasePage: releasePage
  };

  closeAll('startup');
})();
