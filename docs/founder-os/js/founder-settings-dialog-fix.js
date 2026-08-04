(function () {
  'use strict';

  var touch = null;
  var ignoreClickUntil = 0;
  var TOUCH_LIMIT = 14;

  function now() {
    return window.performance && typeof window.performance.now === 'function'
      ? window.performance.now()
      : Date.now();
  }

  function closest(target, selector) {
    return target && target.closest ? target.closest(selector) : null;
  }

  function actionable(target) {
    return closest(target, 'a[data-workspace-link][data-workspace-id],[data-open-founder-settings]');
  }

  function openWorkspace(link, source) {
    var manager = window.NNOSNavigationManager;
    var workspaceId = link && link.getAttribute('data-workspace-id');
    if (!manager || typeof manager.openWorkspace !== 'function' || !workspaceId) return false;
    manager.openWorkspace(workspaceId, source || 'direct');
    return true;
  }

  function openSettings(source) {
    var home = window.NNOSFounderHome;
    if (!home || typeof home.openSettings !== 'function') return false;
    home.openSettings(source || 'direct');
    return true;
  }

  function activate(control, source, event) {
    if (!control) return false;

    if (control.matches && control.matches('a[data-workspace-link][data-workspace-id]')) {
      if (!openWorkspace(control, source)) return false;
      if (event && event.cancelable) event.preventDefault();
      return true;
    }

    if (control.matches && control.matches('[data-open-founder-settings]')) {
      if (!openSettings(source)) return false;
      if (event && event.cancelable) event.preventDefault();
      return true;
    }

    return false;
  }

  function controlAtPoint(x, y, fallback) {
    var hit = null;
    try { hit = document.elementFromPoint(x, y); } catch (error) {}
    return actionable(hit) || actionable(fallback);
  }

  document.addEventListener('touchstart', function (event) {
    if (!event.touches || event.touches.length !== 1) {
      touch = null;
      return;
    }

    var control = actionable(event.target);
    if (!control) {
      touch = null;
      return;
    }

    var point = event.touches[0];
    touch = {
      control: control,
      id: point.identifier,
      x: point.clientX,
      y: point.clientY
    };

    /* The greeting is not scrollable, so activate immediately on touchstart.
       This avoids WebKit losing the later click after compositing changes. */
    if (control.matches('[data-open-founder-settings]')) {
      ignoreClickUntil = now() + 900;
      activate(control, 'touchstart-settings', event);
      touch = null;
    }
  }, { capture: true, passive: false });

  document.addEventListener('touchend', function (event) {
    if (!touch || !event.changedTouches) return;

    for (var i = 0; i < event.changedTouches.length; i += 1) {
      var point = event.changedTouches[i];
      if (point.identifier !== touch.id) continue;

      var dx = point.clientX - touch.x;
      var dy = point.clientY - touch.y;
      var distance = Math.sqrt((dx * dx) + (dy * dy));
      var fallback = touch.control;
      touch = null;

      if (distance > TOUCH_LIMIT) return;

      var control = controlAtPoint(point.clientX, point.clientY, fallback);
      if (!control) return;

      ignoreClickUntil = now() + 900;
      activate(control, 'touchend-hit-test', event);
      return;
    }
  }, { capture: true, passive: false });

  document.addEventListener('touchcancel', function () {
    touch = null;
  }, true);

  document.addEventListener('click', function (event) {
    var control = actionable(event.target);
    if (!control) return;

    if (now() < ignoreClickUntil) {
      if (event.cancelable) event.preventDefault();
      return;
    }

    activate(control, 'click-hit-test', event);
  }, true);

  window.NNOSSafariInteraction = Object.freeze({
    version: 'FOUNDER-UX-053',
    activate: activate,
    actionable: actionable
  });
})();
