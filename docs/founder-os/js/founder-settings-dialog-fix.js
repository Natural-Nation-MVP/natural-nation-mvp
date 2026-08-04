(function () {
  'use strict';

  var touch = null;
  var TOUCH_LIMIT = 14;

  function closest(target, selector) {
    return target && target.closest ? target.closest(selector) : null;
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

  function activate(target, source, event) {
    var workspaceLink = closest(target, 'a[data-workspace-link][data-workspace-id]');
    if (workspaceLink && openWorkspace(workspaceLink, source)) {
      if (event && event.cancelable) event.preventDefault();
      return true;
    }

    var settings = closest(target, '[data-open-founder-settings]');
    if (settings && openSettings(source)) {
      if (event && event.cancelable) event.preventDefault();
      return true;
    }
    return false;
  }

  document.addEventListener('click', function (event) {
    activate(event.target, 'click-direct', event);
  }, false);

  document.addEventListener('touchstart', function (event) {
    if (!event.touches || event.touches.length !== 1) { touch = null; return; }
    var target = closest(event.target, 'a[data-workspace-link][data-workspace-id],[data-open-founder-settings]');
    if (!target) { touch = null; return; }
    var point = event.touches[0];
    touch = { target: target, id: point.identifier, x: point.clientX, y: point.clientY };
  }, { capture: false, passive: true });

  document.addEventListener('touchend', function (event) {
    if (!touch || !event.changedTouches) return;
    for (var i = 0; i < event.changedTouches.length; i += 1) {
      var point = event.changedTouches[i];
      if (point.identifier !== touch.id) continue;
      var dx = point.clientX - touch.x;
      var dy = point.clientY - touch.y;
      var distance = Math.sqrt((dx * dx) + (dy * dy));
      var action = touch;
      touch = null;
      if (distance <= TOUCH_LIMIT) activate(action.target, 'touch-direct', event);
      return;
    }
  }, { capture: false, passive: false });

  document.addEventListener('touchcancel', function () { touch = null; }, false);

  window.NNOSSafariInteraction = Object.freeze({
    version: 'FOUNDER-UX-052',
    activate: activate
  });
})();
