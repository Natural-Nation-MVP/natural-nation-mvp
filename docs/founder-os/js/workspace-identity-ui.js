(() => {
  function enhanceIdentityReview() {
    const body = document.querySelector('[data-workspace-creation-body]');
    if (!body) return;
    const cards = [...body.querySelectorAll('.workspace-review-card')];
    const nameCard = cards.find((card) => card.querySelector('span')?.textContent.trim() === 'Workspace Name');
    const identityCard = cards.find((card) => ['Canonical ID', 'Workspace ID'].includes(card.querySelector('span')?.textContent.trim()));

    if (identityCard && !identityCard.dataset.stableIdentityEnhanced) {
      identityCard.dataset.stableIdentityEnhanced = 'true';
      identityCard.querySelector('span').textContent = 'Immutable Workspace ID';
      const value = identityCard.querySelector('strong');
      if (value && /generated securely/i.test(value.textContent)) value.textContent = 'Unique UUID generated securely after approval';
      const note = identityCard.querySelector('small');
      if (note) note.textContent = 'Permanent system identity; never changes when the workspace is renamed';
    }

    if (nameCard && identityCard && !cards.some((card) => card.querySelector('span')?.textContent.trim() === 'Workspace Key')) {
      const displayName = nameCard.querySelector('strong')?.textContent.trim() || 'workspace';
      const base = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'workspace';
      const keyCard = document.createElement('div');
      keyCard.className = 'workspace-review-card';
      keyCard.innerHTML = `<span>Workspace Key</span><strong>${base}-&lt;unique suffix&gt;</strong><small>Unique URL and repository path; duplicate display names are allowed</small>`;
      identityCard.after(keyCard);
    }

    const createdHeading = body.querySelector('.workspace-create-ready h3');
    if (createdHeading && !body.querySelector('[data-stable-identity-note]')) {
      const note = document.createElement('p');
      note.dataset.stableIdentityNote = 'true';
      note.className = 'muted';
      note.textContent = 'The display name may be shared by other workspaces. The Workspace ID and Workspace Key keep this workspace uniquely isolated.';
      createdHeading.after(note);
    }
  }

  const observer = new MutationObserver(enhanceIdentityReview);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', enhanceIdentityReview);
  enhanceIdentityReview();
})();
