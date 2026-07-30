(() => {
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  const hasSavedDraft = () => {
    try { return Boolean(window.localStorage.getItem(DRAFT_KEY)); }
    catch { return false; }
  };

  const setUnavailable = (element, unavailable, reason = 'This action is not available yet.') => {
    if (!element) return;
    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) element.disabled = unavailable;
    else {
      element.setAttribute('aria-disabled', String(unavailable));
      element.tabIndex = unavailable ? -1 : 0;
    }
    element.classList.toggle('is-unavailable', unavailable);
    if (unavailable) {
      element.dataset.unavailableReason = reason;
      element.title = reason;
    } else {
      delete element.dataset.unavailableReason;
      element.removeAttribute('title');
    }
  };

  const countVisibleCards = (status) => [...document.querySelectorAll('.workspace-card')]
    .filter((card) => !card.hidden)
    .filter((card) => !status || card.dataset.launchStatus === status).length;

  const refreshCarouselButtons = () => {
    const track = document.querySelector('[data-workspace-registry-list]');
    const previous = document.querySelector('[data-carousel-direction="previous"]');
    const next = document.querySelector('[data-carousel-direction="next"]');
    if (!track) {
      setUnavailable(previous, true, 'Workspace carousel is unavailable.');
      setUnavailable(next, true, 'Workspace carousel is unavailable.');
      return;
    }
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const hasOverflow = maxScroll > 4;
    setUnavailable(previous, !hasOverflow || track.scrollLeft <= 4, 'No previous workspaces.');
    setUnavailable(next, !hasOverflow || track.scrollLeft >= maxScroll - 4, 'No more workspaces.');
  };

  const refreshLaunchActions = () => {
    document.querySelectorAll('[data-launch-action="resume"]').forEach((element) => {
      setUnavailable(element, !hasSavedDraft(), 'No saved workspace setup is available.');
    });
    const duplicateAvailable = Boolean(document.querySelector('[data-open-duplicate-review]'));
    document.querySelectorAll('[data-launch-action="duplicates"]').forEach((element) => {
      setUnavailable(element, !duplicateAvailable, 'No duplicate workspace records require review.');
    });
    const archivedCount = countVisibleCards('archived');
    document.querySelectorAll('[data-launch-filter="archived"]').forEach((element) => {
      setUnavailable(element, archivedCount === 0, 'No archived workspaces are available.');
    });
  };

  const refreshGenericLinks = () => {
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = (link.getAttribute('href') || '').trim();
      setUnavailable(link, !href || href === '#' || href.startsWith('javascript:'), 'This link is not available yet.');
    });
  };

  const refreshWorkspaceOpenActions = () => {
    document.querySelectorAll('.workspace-card').forEach((card) => {
      // The isolated page-link controller owns workspace availability by immutable ID.
      const workspaceId = card.dataset.pageLinkWorkspace || card.dataset.workspaceId;
      const available = Boolean(workspaceId) && card.dataset.launchStatus !== 'deleted';
      setUnavailable(card, !available, 'This workspace cannot be opened yet.');
    });
  };

  const refresh = () => {
    refreshLaunchActions();
    refreshGenericLinks();
    refreshWorkspaceOpenActions();
    window.requestAnimationFrame(refreshCarouselButtons);
  };

  // Block only the exact disabled control. Never block because a parent container was
  // previously marked unavailable; that caused cards, greeting controls, and form inputs
  // to lose their native events.
  document.addEventListener('click', (event) => {
    const control = event.target.closest('button,input,select,textarea,a,[role="button"]');
    if (!control) return;
    const unavailable = control.disabled || control.getAttribute('aria-disabled') === 'true';
    if (!unavailable) return;
    event.preventDefault();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    const control = event.target.closest?.('button,input,select,textarea,a,[role="button"]');
    if (!control) return;
    if (control.disabled || control.getAttribute('aria-disabled') === 'true') event.preventDefault();
  }, true);

  document.addEventListener('scroll', (event) => {
    if (event.target.matches?.('[data-workspace-registry-list]')) refreshCarouselButtons();
  }, true);

  window.addEventListener('resize', refreshCarouselButtons);
  window.addEventListener('founder-os:workspace-registry-rendered', () => setTimeout(refresh, 0));
  window.addEventListener('founder-os:workspace-view-changed', () => setTimeout(refresh, 0));
  window.addEventListener('founder-os:workspace-lifecycle-changed', () => setTimeout(refresh, 0));

  new MutationObserver(() => setTimeout(refresh, 0)).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'hidden', 'aria-disabled', 'data-launch-status', 'data-page-link-workspace']
  });

  refresh();
})();