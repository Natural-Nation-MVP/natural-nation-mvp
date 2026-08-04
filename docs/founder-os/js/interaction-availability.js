(function () {
  'use strict';

  var DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  function hasSavedDraft() {
    try { return Boolean(window.localStorage.getItem(DRAFT_KEY)); }
    catch (error) { return false; }
  }

  function setUnavailable(control, unavailable, reason) {
    if (!control) return;
    if ('disabled' in control) control.disabled = unavailable;
    control.classList.toggle('is-unavailable', unavailable);
    control.setAttribute('aria-disabled', unavailable ? 'true' : 'false');
    if (unavailable) {
      control.title = reason;
      control.setAttribute('data-unavailable-reason', reason);
    } else {
      control.removeAttribute('title');
      control.removeAttribute('data-unavailable-reason');
    }
  }

  function refresh() {
    var resumeControls = document.querySelectorAll('[data-launch-action="resume"]');
    for (var i = 0; i < resumeControls.length; i += 1) {
      setUnavailable(resumeControls[i], !hasSavedDraft(), 'No saved workspace setup is available.');
    }

    var duplicateAvailable = Boolean(document.querySelector('[data-open-duplicate-review]'));
    var duplicateControls = document.querySelectorAll('[data-launch-action="duplicates"]');
    for (var j = 0; j < duplicateControls.length; j += 1) {
      setUnavailable(duplicateControls[j], !duplicateAvailable, 'No duplicate workspace records require review.');
    }

    var archivedAvailable = false;
    var cards = document.querySelectorAll('.workspace-card');
    for (var c = 0; c < cards.length; c += 1) {
      if (cards[c].getAttribute('data-launch-status') === 'archived') archivedAvailable = true;
    }
    var archivedControls = document.querySelectorAll('[data-launch-filter="archived"]');
    for (var k = 0; k < archivedControls.length; k += 1) {
      setUnavailable(archivedControls[k], !archivedAvailable, 'No archived workspaces are available.');
    }

    /* Native anchors are never disabled or intercepted here. Navigation ownership
       belongs exclusively to the browser and Navigation Manager. */
  }

  function queueRefresh() {
    if (window.requestAnimationFrame) window.requestAnimationFrame(refresh);
    else window.setTimeout(refresh, 0);
  }

  window.addEventListener('founder-os:workspace-registry-rendered', queueRefresh);
  window.addEventListener('founder-os:workspace-view-changed', queueRefresh);
  window.addEventListener('founder-os:workspace-lifecycle-changed', queueRefresh);
  window.addEventListener('storage', refresh);

  refresh();
})();