(() => {
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  const hasSavedDraft = () => {
    try { return Boolean(window.localStorage.getItem(DRAFT_KEY)); }
    catch { return false; }
  };

  function setUnavailable(control, unavailable, reason) {
    if (!control) return;
    if ('disabled' in control) control.disabled = unavailable;
    control.classList.toggle('is-unavailable', unavailable);
    control.setAttribute('aria-disabled', String(unavailable));
    if (unavailable) {
      control.title = reason;
      control.dataset.unavailableReason = reason;
    } else {
      control.removeAttribute('title');
      delete control.dataset.unavailableReason;
    }
  }

  function refreshLaunchActions() {
    document.querySelectorAll('[data-launch-action="resume"]').forEach((control) => {
      setUnavailable(control, !hasSavedDraft(), 'No saved workspace setup is available.');
    });

    const duplicateAvailable = Boolean(document.querySelector('[data-open-duplicate-review]'));
    document.querySelectorAll('[data-launch-action="duplicates"]').forEach((control) => {
      setUnavailable(control, !duplicateAvailable, 'No duplicate workspace records require review.');
    });

    const archivedAvailable = [...document.querySelectorAll('.workspace-card')]
      .some((card) => card.dataset.launchStatus === 'archived');
    document.querySelectorAll('[data-launch-filter="archived"]').forEach((control) => {
      setUnavailable(control, !archivedAvailable, 'No archived workspaces are available.');
    });
  }

  function refreshLinks() {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = (link.getAttribute('href') || '').trim();
      const unavailable = !href || href === '#' || href.startsWith('javascript:');
      link.classList.toggle('is-unavailable', unavailable);
      link.setAttribute('aria-disabled', String(unavailable));
      if (unavailable) link.title = 'This link is not available yet.';
      else link.removeAttribute('title');
    });
  }

  function refresh() {
    refreshLaunchActions();
    refreshLinks();
  }

  // This controller never evaluates workspace cards or navigation controls.
  document.addEventListener('click', (event) => {
    const control = event.target.closest?.('button:disabled, input:disabled, select:disabled, textarea:disabled, a[aria-disabled="true"]');
    if (control) event.preventDefault();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    const control = event.target.closest?.('button:disabled, input:disabled, select:disabled, textarea:disabled, a[aria-disabled="true"]');
    if (control) event.preventDefault();
  }, true);

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed', 'founder-os:workspace-lifecycle-changed'].forEach((name) => {
    window.addEventListener(name, () => requestAnimationFrame(refresh));
  });
  window.addEventListener('storage', refresh);

  new MutationObserver(() => requestAnimationFrame(refresh)).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'hidden', 'data-launch-status']
  });

  refresh();
})();