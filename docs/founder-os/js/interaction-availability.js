(() => {
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  const hasSavedDraft = () => {
    try {
      return Boolean(window.localStorage.getItem(DRAFT_KEY));
    } catch {
      return false;
    }
  };

  const setUnavailable = (element, unavailable, reason = 'This action is not available yet.') => {
    if (!element) return;

    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
      element.disabled = unavailable;
    } else {
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
    .filter((card) => !status || card.dataset.launchStatus === status)
    .length;

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
      const unavailable = !href || href === '#' || href.startsWith('javascript:');
      setUnavailable(link, unavailable, 'This link is not available yet.');
    });
  };

  const refreshWorkspaceOpenActions = () => {
    document.querySelectorAll('.workspace-card').forEach((card) => {
      const openButton = card.querySelector('[data-resume-workspace]');
      const available = Boolean(openButton && !openButton.disabled);
      setUnavailable(card, !available, 'This workspace cannot be opened yet.');
    });
  };

  const refresh = () => {
    refreshLaunchActions();
    refreshGenericLinks();
    refreshWorkspaceOpenActions();
    window.requestAnimationFrame(refreshCarouselButtons);
  };

  document.addEventListener('click', (event) => {
    const unavailable = event.target.closest('.is-unavailable,[aria-disabled="true"]');
    if (!unavailable) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    const unavailable = event.target.closest?.('.is-unavailable,[aria-disabled="true"]');
    if (!unavailable) return;
    event.preventDefault();
    event.stopImmediatePropagation();
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
    attributeFilter: ['disabled', 'hidden', 'aria-disabled', 'data-launch-status']
  });

  refresh();
})();