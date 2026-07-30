(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let drag = null;
  let snapTimer = 0;
  let suppressClicksUntil = 0;

  function closeDialog(dialog) {
    if (!dialog) return;
    try { dialog.close(); } catch { dialog.removeAttribute('open'); }
  }

  function prepareCards() {
    $$('.workspace-card').forEach((card) => {
      card.tabIndex = card.getAttribute('aria-disabled') === 'true' ? -1 : 0;
      card.setAttribute('role', 'link');
      const title = $('.workspace-launch-card-title h3, .workspace-card-top h2', card)?.textContent?.trim() || 'workspace';
      card.setAttribute('aria-label', `Open ${title}`);
    });
  }

  function updateCarouselButtons() {
    const track = $('[data-workspace-registry-list]');
    if (!track) return;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    const previous = $('[data-carousel-direction="previous"]');
    const next = $('[data-carousel-direction="next"]');
    if (previous) previous.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max - 2 || max <= 2;
  }

  function closestCardLeft(track) {
    const cards = $$('.workspace-card:not([hidden])', track);
    if (!cards.length) return 0;
    const current = track.scrollLeft;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    let target = 0;
    let distance = Number.POSITIVE_INFINITY;
    for (const card of cards) {
      const left = Math.max(0, Math.min(max, card.offsetLeft - track.offsetLeft));
      const delta = Math.abs(left - current);
      if (delta < distance) {
        distance = delta;
        target = left;
      }
    }
    return target;
  }

  function snapToClosestCard(track) {
    window.clearTimeout(snapTimer);
    const left = closestCardLeft(track);
    track.style.scrollSnapType = 'none';
    track.scrollTo({ left, behavior: 'smooth' });
    snapTimer = window.setTimeout(() => {
      track.style.removeProperty('scroll-snap-type');
      updateCarouselButtons();
    }, 240);
  }

  function finishDrag(track, event) {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    try { track.releasePointerCapture?.(event.pointerId); } catch {}
    track.classList.remove('is-dragging');
    drag = null;
    if (moved) {
      suppressClicksUntil = performance.now() + 400;
      track.dataset.carouselSuppressUntil = String(suppressClicksUntil);
      requestAnimationFrame(() => snapToClosestCard(track));
    } else {
      track.style.removeProperty('scroll-snap-type');
    }
    updateCarouselButtons();
  }

  function installDragScroll() {
    const track = $('[data-workspace-registry-list]');
    if (!track || track.dataset.dragScrollReady === '032') return;
    track.dataset.dragScrollReady = '032';

    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.button !== 0 || event.target.closest('button,a,input,select,textarea,summary,details')) return;
      window.clearTimeout(snapTimer);
      track.style.scrollSnapType = 'none';
      drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, moved: false };
      track.setPointerCapture?.(event.pointerId);
      track.classList.add('is-dragging');
    });

    track.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const delta = event.clientX - drag.x;
      if (Math.abs(delta) > 6) drag.moved = true;
      if (!drag.moved) return;
      event.preventDefault();
      track.scrollLeft = drag.left - delta;
    });

    track.addEventListener('pointerup', (event) => finishDrag(track, event));
    track.addEventListener('pointercancel', (event) => finishDrag(track, event));
    track.addEventListener('lostpointercapture', () => {
      track.classList.remove('is-dragging');
      if (drag?.moved) {
        suppressClicksUntil = performance.now() + 400;
        track.dataset.carouselSuppressUntil = String(suppressClicksUntil);
        requestAnimationFrame(() => snapToClosestCard(track));
      }
      drag = null;
      updateCarouselButtons();
    });
    track.addEventListener('scroll', updateCarouselButtons, { passive: true });
  }

  function stabilizeHome() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    prepareCards();
    installDragScroll();
    updateCarouselButtons();
  }

  document.addEventListener('click', (event) => {
    const close = event.target.closest?.('dialog [value="close"], dialog [data-close-duplicate-review], dialog [aria-label="Close dialog"]');
    if (close) {
      event.preventDefault();
      closeDialog(close.closest('dialog'));
      return;
    }
    const track = event.target.closest?.('[data-workspace-registry-list]');
    if (track && performance.now() < Number(track.dataset.carouselSuppressUntil || 0)) {
      event.preventDefault();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const dialog = $('dialog[open]');
      if (dialog) {
        event.preventDefault();
        closeDialog(dialog);
      }
    }
  }, true);

  window.NNOSCarousel = {
    shouldSuppressClick(track = $('[data-workspace-registry-list]')) {
      return Boolean(track && performance.now() < Number(track.dataset.carouselSuppressUntil || 0));
    },
    snap: () => {
      const track = $('[data-workspace-registry-list]');
      if (track) snapToClosestCard(track);
    }
  };

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (!event.detail?.workspace) requestAnimationFrame(stabilizeHome);
  });
  window.addEventListener('founder-os:workspace-registry-rendered', () => requestAnimationFrame(stabilizeHome));
  window.addEventListener('resize', updateCarouselButtons);
  stabilizeHome();
})();