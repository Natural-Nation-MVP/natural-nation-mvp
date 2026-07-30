(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function bindWorkspaceConfirmation() {
    const checkbox = $('[data-workspace-confirm]');
    const createButton = $('[data-workspace-create-protected]');
    if (!checkbox || !createButton) return;

    const sync = () => {
      createButton.disabled = !checkbox.checked;
      createButton.setAttribute('aria-disabled', String(!checkbox.checked));
      checkbox.closest('.workspace-confirmation')?.classList.toggle('is-confirmed', checkbox.checked);
    };

    if (checkbox.dataset.controlIntegrityBound !== 'true') {
      checkbox.dataset.controlIntegrityBound = 'true';
      checkbox.addEventListener('change', sync);
      checkbox.addEventListener('input', sync);
      const label = checkbox.closest('label');
      if (label && label.dataset.controlIntegrityBound !== 'true') {
        label.dataset.controlIntegrityBound = 'true';
        label.addEventListener('click', (event) => {
          if (event.target === checkbox) return;
          event.preventDefault();
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          checkbox.focus();
        });
      }
    }
    sync();
  }

  function repairWorkspaceCards() {
    $$('.workspace-card').forEach((card) => {
      const workspaceId = card.dataset.pageLinkWorkspace || card.dataset.workspaceId;
      if (!workspaceId) return;
      card.dataset.pageLinkWorkspace = workspaceId;
      card.classList.remove('is-unavailable');
      card.setAttribute('aria-disabled', 'false');
      card.removeAttribute('title');
      delete card.dataset.unavailableReason;
    });
  }

  function refresh() {
    bindWorkspaceConfirmation();
    repairWorkspaceCards();
  }

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed'].forEach((name) => {
    window.addEventListener(name, () => requestAnimationFrame(refresh));
  });
  new MutationObserver(() => requestAnimationFrame(refresh)).observe(document.body, { childList: true, subtree: true });
  refresh();
})();