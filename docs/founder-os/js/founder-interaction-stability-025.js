(function () {
  'use strict';

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

  function install() {
    var track = one('[data-workspace-registry-list]');
    if (!track || track.getAttribute('data-carousel-ready') === '052') return;
    track.setAttribute('data-carousel-ready', '052');

    /* Native touch scrolling and native link activation remain entirely browser-owned. */
    track.addEventListener('scroll', updateButtons, { passive: true });
  }

  function stabilize() {
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
