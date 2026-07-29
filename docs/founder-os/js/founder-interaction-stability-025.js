(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let drag = null;
  let cardPointer = null;
  let suppressCardClickUntil = 0;

  function activeWorkspace() { return window.NNOSActiveWorkspace || null; }
  function closeDialog(dialog) { if (!dialog) return; try { dialog.close(); } catch { dialog.removeAttribute('open'); } }

  function syncWorkspaceNavigation(target = document.body.dataset.activeView || 'mission') {
    const workspace = activeWorkspace();
    if (!workspace) return;
    const nav = $('.nav');
    if (!nav) return;
    const expectedTargets = new Set((workspace.modules || []).map((module) => module.target));
    const currentTargets = $$('[data-context-module]', nav).map((button) => button.dataset.contextModule);
    const stale = currentTargets.length !== expectedTargets.size || currentTargets.some((item) => !expectedTargets.has(item));
    if (stale) {
      const groups = new Map();
      (workspace.modules || []).forEach((module) => { const group = module.group || 'Workspace'; if (!groups.has(group)) groups.set(group, []); groups.get(group).push(module); });
      const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
      nav.innerHTML = `<button class="nav-link back-link" type="button" data-command-center-home>← Founder OS Home</button><div class="nav-context"><small>You are working in</small><strong>${esc(workspace.name)}</strong><span>${esc(workspace.roleLabel || workspace.type || 'Workspace')}</span></div>${[...groups.entries()].map(([group, modules]) => `<div class="nav-group"><div class="nav-group-label">${esc(group)}</div>${modules.map((module) => `<button class="nav-link${module.target === target ? ' active' : ''}" type="button" data-context-module="${esc(module.target)}">${esc(module.label)}</button>`).join('')}</div>`).join('')}`;
    }
    $$('[data-context-module]', nav).forEach((button) => button.classList.toggle('active', button.dataset.contextModule === target));
  }

  function prepareCards() {
    $$('.workspace-card').forEach((card) => {
      card.tabIndex = card.getAttribute('aria-disabled') === 'true' ? -1 : 0;
      card.setAttribute('role', 'link');
      const title = $('.workspace-launch-card-title h3, .workspace-card-top h2', card)?.textContent?.trim() || 'workspace';
      card.setAttribute('aria-label', `Open ${title}`);
      const button = $('[data-resume-workspace]', card);
      if (button) { button.hidden = true; button.setAttribute('aria-hidden', 'true'); button.tabIndex = -1; }
    });
  }

  function openCard(card) {
    if (!card || card.hidden || card.getAttribute('aria-disabled') === 'true') return;
    const button = $('[data-resume-workspace]', card);
    if (!button || button.disabled) return;
    // Use the registry's real control so its authoritative workspace lookup and routing run unchanged.
    button.click();
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

  function finishDrag(track, event) {
    if (!drag || drag.id !== event.pointerId) return;
    const moved = drag.moved;
    try { track.releasePointerCapture?.(event.pointerId); } catch {}
    track.classList.remove('is-dragging');
    drag = null;
    if (moved) suppressCardClickUntil = performance.now() + 350;
    updateCarouselButtons();
  }

  function installDragScroll() {
    const track = $('[data-workspace-registry-list]');
    if (!track || track.dataset.dragScrollReady === '027') return;
    track.dataset.dragScrollReady = '027';
    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.button !== 0 || event.target.closest('button,a,input,select,textarea,summary,details')) return;
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
    track.addEventListener('lostpointercapture', () => { track.classList.remove('is-dragging'); drag = null; updateCarouselButtons(); });
    track.addEventListener('scroll', updateCarouselButtons, { passive: true });
  }

  function stabilizeHome() {
    if (document.body.dataset.activeWorkspace !== 'registry') return;
    prepareCards();
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
    if (close) { event.preventDefault(); event.stopImmediatePropagation(); closeDialog(close.closest('dialog')); return; }
    const dialog = event.target instanceof HTMLDialogElement ? event.target : null;
    if (dialog?.open) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { event.preventDefault(); event.stopImmediatePropagation(); closeDialog(dialog); return; }
    }
    if (!cardPointer || cardPointer.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - cardPointer.x, event.clientY - cardPointer.y);
    const card = cardPointer.card;
    cardPointer = null;
    // Pointer capture changes the pointerup target to the carousel. The original card is still authoritative.
    if (distance > 8 || drag?.moved || performance.now() < suppressCardClickUntil) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openCard(card);
  }, true);

  document.addEventListener('click', (event) => {
    const close = event.target.closest?.('dialog [value="close"], dialog [data-close-duplicate-review], dialog [aria-label="Close dialog"]');
    if (close) { event.preventDefault(); event.stopImmediatePropagation(); closeDialog(close.closest('dialog')); return; }
    const card = event.target.closest?.('.workspace-card');
    if (card && performance.now() < suppressCardClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    const module = event.target.closest('[data-context-module]');
    if (module && activeWorkspace()) requestAnimationFrame(() => syncWorkspaceNavigation(module.dataset.contextModule));
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { const dialog = $('dialog[open]'); if (dialog) { event.preventDefault(); closeDialog(dialog); } return; }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.workspace-card')) { event.preventDefault(); event.stopImmediatePropagation(); openCard(event.target); }
  }, true);

  window.addEventListener('founder-os:workspace-view-changed', (event) => { const target = event.detail?.target || document.body.dataset.activeView || 'mission'; if (event.detail?.workspace) requestAnimationFrame(() => syncWorkspaceNavigation(target)); else requestAnimationFrame(stabilizeHome); });
  window.addEventListener('founder-os:workspace-registry-rendered', () => requestAnimationFrame(stabilizeHome));
  window.addEventListener('resize', updateCarouselButtons);
  stabilizeHome();
})();