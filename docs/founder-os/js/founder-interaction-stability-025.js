(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let drag = null;
  let cardPointer = null;
  let suppressCardClickUntil = 0;
  let snapTimer = 0;

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
      const legacyButton = $('[data-resume-workspace]', card);
      if (legacyButton) {
        card.dataset.pageLinkWorkspace = legacyButton.dataset.resumeWorkspace || card.dataset.workspaceId || '';
        legacyButton.removeAttribute('data-resume-workspace');
        legacyButton.hidden = true;
        legacyButton.setAttribute('aria-hidden', 'true');
        legacyButton.tabIndex = -1;
      }
    });
  }

  function openCard(card) {
    if (!card || card.hidden || card.getAttribute('aria-disabled') === 'true') return;
    const workspaceId = card.dataset.pageLinkWorkspace || card.dataset.workspaceId;
    if (!workspaceId) return;
    window.NNOSPageLinks?.openWorkspace(workspaceId);
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
      suppressCardClickUntil = performance.now() + 350;
      requestAnimationFrame(() => snapToClosestCard(track));
    } else {
      track.style.removeProperty('scroll-snap-type');
    }
    updateCarouselButtons();
  }

  function installDragScroll() {
    const track = $('[data-workspace-registry-list]');
    if (!track || track.dataset.dragScrollReady === '031') return;
    track.dataset.dragScrollReady = '031';
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
      if (drag?.moved) requestAnimationFrame(() => snapToClosestCard(track));
      drag = null;
      updateCarouselButtons();
    });
    track.addEventListener('scroll', updateCarouselButtons, { passive: true });
  }

  function stabilizeHome() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    prepareCards();
    window.NNOSPageLinks?.isolate();
    installDragScroll();
    updateCarouselButtons();
  }

  document.addEventListener('pointerdown', (event) => {
    const card = event.target.closest?.('.workspace-card');
    if (card && !event.target.closest('button,a,input,select,textarea,summary,details')) {
      cardPointer = { card, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    }
  }, true);

  document.addEventListener('pointerup', (event) => {
    const close = event.target.closest?.('dialog [value="close"], dialog [data-close-duplicate-review], dialog [aria-label="Close dialog"]');
    if (close) {
      event.preventDefault();
      closeDialog(close.closest('dialog'));
      return;
    }
    const dialog = event.target instanceof HTMLDialogElement ? event.target : null;
    if (dialog?.open) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        event.preventDefault();
        closeDialog(dialog);
        return;
      }
    }
    if (!cardPointer || cardPointer.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - cardPointer.x, event.clientY - cardPointer.y);
    const card = cardPointer.card;
    cardPointer = null;
    if (distance > 8 || drag?.moved || performance.now() < suppressCardClickUntil) return;
    event.preventDefault();
    openCard(card);
  }, true);

  document.addEventListener('click', (event) => {
    const close = event.target.closest?.('dialog [value="close"], dialog [data-close-duplicate-review], dialog [aria-label="Close dialog"]');
    if (close) {
      event.preventDefault();
      closeDialog(close.closest('dialog'));
      return;
    }
    const card = event.target.closest?.('.workspace-card');
    if (card && performance.now() < suppressCardClickUntil) event.preventDefault();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const dialog = $('dialog[open]');
      if (dialog) {
        event.preventDefault();
        closeDialog(dialog);
      }
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.workspace-card')) {
      event.preventDefault();
      openCard(event.target);
    }
  }, true);

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (!event.detail?.workspace) requestAnimationFrame(stabilizeHome);
  });
  window.addEventListener('founder-os:workspace-registry-rendered', () => requestAnimationFrame(stabilizeHome));
  window.addEventListener('resize', updateCarouselButtons);
  stabilizeHome();
})();