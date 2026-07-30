(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function bindGreeting() {
    $$('[data-open-founder-settings]').forEach((button) => {
      if (button.dataset.controlIntegrityBound === 'true') return;
      button.dataset.controlIntegrityBound = 'true';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        // Use the existing settings controller by dispatching a dedicated event rather than
        // synthetic clicks through unrelated home or card controls.
        window.dispatchEvent(new CustomEvent('founder-os:open-settings-requested', { detail: { source: 'greeting' } }));
      });
    });
  }

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
    bindGreeting();
    bindWorkspaceConfirmation();
    repairWorkspaceCards();
  }

  window.addEventListener('founder-os:open-settings-requested', () => {
    // The existing delegated settings handler remains authoritative. Trigger it on the
    // actual greeting button only after broad interception has been removed.
    const button = $('[data-open-founder-settings]');
    if (!button || button.dataset.forwardingSettings === 'true') return;
    button.dataset.forwardingSettings = 'true';
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    delete button.dataset.forwardingSettings;
  });

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed'].forEach((name) => {
    window.addEventListener(name, () => requestAnimationFrame(refresh));
  });
  new MutationObserver(() => requestAnimationFrame(refresh)).observe(document.body, { childList: true, subtree: true });
  refresh();
})();