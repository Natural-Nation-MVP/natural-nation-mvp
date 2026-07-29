(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  let pointerDown = null;

  function closeDialog(dialog) {
    if (!dialog) return;
    try { dialog.close(); } catch { dialog.removeAttribute('open'); }
  }

  function openCard(card) {
    if (!card || card.hidden || card.getAttribute('aria-disabled') === 'true') return;
    const button = $('[data-resume-workspace]:not(:disabled)', card);
    if (!button) return;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  document.addEventListener('pointerdown', (event) => {
    const card = event.target.closest?.('.workspace-card');
    if (!card || event.target.closest('button,a,input,select,textarea,summary,details')) return;
    pointerDown = { card, x: event.clientX, y: event.clientY };
  }, true);

  document.addEventListener('pointerup', (event) => {
    const close = event.target.closest?.('dialog [value="close"], dialog [data-close-duplicate-review], dialog [aria-label="Close dialog"]');
    if (close) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialog(close.closest('dialog'));
      return;
    }

    const dialog = event.target instanceof HTMLDialogElement ? event.target : null;
    if (dialog && dialog.open) {
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeDialog(dialog);
        return;
      }
    }

    if (!pointerDown) return;
    const current = event.target.closest?.('.workspace-card');
    const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    const card = pointerDown.card;
    pointerDown = null;
    if (current !== card || distance > 8) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openCard(card);
  }, true);

  document.addEventListener('click', (event) => {
    const close = event.target.closest?.('dialog [value="close"], dialog [data-close-duplicate-review], dialog [aria-label="Close dialog"]');
    if (close) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialog(close.closest('dialog'));
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const dialog = $('dialog[open]');
      if (dialog) { event.preventDefault(); closeDialog(dialog); }
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.workspace-card')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCard(event.target);
    }
  }, true);
})();
