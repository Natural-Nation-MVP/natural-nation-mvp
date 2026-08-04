(function () {
  'use strict';

  var drag = null;
  var snapTimer = 0;

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  function updateButtons() {
    var track = one('[data-workspace-registry-list]');
    if (!track) return;
    var max = Math.max(0, track.scrollWidth - track.clientWidth);
    var previous = one('[data-carousel-direction="previous"]');
    var next = one('[data-carousel-direction="next"]');
    if (previous) previous.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max - 2 || max <= 2;
  }

  function closestCardLeft(track) {
    var cards = all('.workspace-card:not([hidden])', track);
    if (!cards.length) return 0;
    var current = track.scrollLeft;
    var max = Math.max(0, track.scrollWidth - track.clientWidth);
    var target = 0;
    var distance = Number.POSITIVE_INFINITY;
    for (var i = 0; i < cards.length; i += 1) {
      var left = Math.max(0, Math.min(max, cards[i].offsetLeft - track.offsetLeft));
      var delta = Math.abs(left - current);
      if (delta < distance) { distance = delta; target = left; }
    }
    return target;
  }

  function snap(track) {
    window.clearTimeout(snapTimer);
    var left = closestCardLeft(track);
    track.style.scrollSnapType = 'none';
    try { track.scrollTo({ left: left, behavior: 'smooth' }); }
    catch (error) { track.scrollLeft = left; }
    snapTimer = window.setTimeout(function () {
      track.style.removeProperty('scroll-snap-type');
      updateButtons();
    }, 240);
  }

  function bindWorkspaceLinks() {
    var links = all('a[data-workspace-link][data-workspace-id]');
    for (var i = 0; i < links.length; i += 1) {
      var link = links[i];
      if (link.getAttribute('data-direct-route-ready') === '051') continue;
      link.setAttribute('data-direct-route-ready', '051');
      link.addEventListener('click', function (event) {
        if (!window.NNOSNavigationManager || typeof window.NNOSNavigationManager.openWorkspace !== 'function') return;
        var workspaceId = this.getAttribute('data-workspace-id');
        if (!workspaceId) return;
        event.preventDefault();
        window.NNOSNavigationManager.openWorkspace(workspaceId, 'native-anchor-direct');
      }, false);
    }
  }

  function install() {
    var track = one('[data-workspace-registry-list]');
    if (!track || track.getAttribute('data-drag-scroll-ready') === '051') return;
    track.setAttribute('data-drag-scroll-ready', '051');

    /* Safari owns touch scrolling. Mouse dragging never captures or cancels links. */
    track.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'touch' || event.button !== 0) return;
      if (event.target && event.target.closest && event.target.closest('button,input,select,textarea,summary,details')) return;
      drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, moved: false };
      track.classList.add('is-dragging');
    }, false);

    track.addEventListener('pointermove', function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      var delta = event.clientX - drag.x;
      if (Math.abs(delta) > 6) drag.moved = true;
      if (!drag.moved) return;
      track.scrollLeft = drag.left - delta;
    }, false);

    function finish(event) {
      if (!drag || drag.id !== event.pointerId) return;
      var moved = drag.moved;
      drag = null;
      track.classList.remove('is-dragging');
      if (moved) snap(track);
      else track.style.removeProperty('scroll-snap-type');
      updateButtons();
    }

    track.addEventListener('pointerup', finish, false);
    track.addEventListener('pointercancel', finish, false);
    track.addEventListener('scroll', updateButtons, { passive: true });
  }

  function stabilize() {
    bindWorkspaceLinks();
    install();
    updateButtons();
  }

  window.NNOSCarousel = {
    shouldSuppressClick: function () { return false; },
    snap: function () {
      var track = one('[data-workspace-registry-list]');
      if (track) snap(track);
    }
  };

  window.addEventListener('founder-os:workspace-view-changed', stabilize);
  window.addEventListener('founder-os:workspace-registry-rendered', stabilize);
  window.addEventListener('resize', updateButtons);
  stabilize();
})();