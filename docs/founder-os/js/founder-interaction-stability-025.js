(function () {
  'use strict';

  /* FOUNDER-UX-054
     The workspace portfolio is now a static responsive grid.
     Carousel scrolling, snapping, arrows, drag ownership, and click suppression are removed. */
  window.NNOSCarousel = Object.freeze({
    retired: true,
    version: 'FOUNDER-UX-054',
    shouldSuppressClick: function () { return false; }
  });
})();