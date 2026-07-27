(() => {
  const canonicalRegistryPath = window.NNOSPaths.asset('registry/workspaces.json?v=2.1.0');
  const migrationReviewPath = window.NNOSPaths.asset('registry/migrations/FOUNDER-WS-005-os-studio-duplicate-review.json?v=1.0.0');
  const protectedIds = new Set(['founder-os', 'natural-nation']);
  let canonicalRegistry = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  function lifecycleState(workspace) {
    return workspace.lifecycleStatus || workspace.status || 'created';
  }

  function groupFor(workspace) {
    const state = lifecycleState(workspace);
    if (state === 'soft-deleted' || workspace.status === 'deleted') return 'deleted';
    if (state === 'archived' || workspace.status === 'archived') return 'archived';
    return 'active';
  }

  function healthChecks(workspace) {
    return [
      ['Registry identity', Boolean(workspace.workspaceId && workspace.workspaceKey)],
      ['Repository root', Boolean(workspace.repository?.root)],
      ['Creation evidence', Boolean(workspace.creationEvidence?.clientRequestId)],
      ['Knowledge boundary', Boolean(workspace.locations?.knowledge || workspace.isolation?.knowledgeBoundary)],
      ['AI governance', Boolean(workspace.governance?.workflow)]
    ];
  }

  function actionButtons(workspace) {
    const state = groupFor(workspace);
    const protectedWorkspace = protectedIds.has(workspace.workspaceId);
    if (protectedWorkspace) return '<span class="workspace-protected-note">Protected workspace</span>';
    if (state === 'active') return `<button type="button" data-lifecycle-action="archive" data-lifecycle-workspace="${escapeHtml(workspace.workspaceId)}">Archive</button><button class="danger" type="button" data-lifecycle-action="delete" data-lifecycle-workspace="${escapeHtml(workspace.workspaceId)}">Delete</button>`;
    if (state === 'archived') return `<button type="button" data-lifecycle-action="restore" data-lifecycle-workspace="${escapeHtml(workspace.workspaceId)}">Restore</button><button class="danger" type="button" data-lifecycle-action="delete" data-lifecycle-workspace="${escapeHtml(workspace.workspaceId)}">Delete</button>`;
    return `<button type="button" data-lifecycle-action="restore" data-lifecycle-workspace="${escapeHtml(workspace.workspaceId)}">Restore</button><button class="danger" type="button" data-lifecycle-action="purge" data-lifecycle-workspace="${escapeHtml(workspace.workspaceId)}">Purge</button>`;
  }

  function workspaceManagementMarkup(workspace) {
    if (!workspace) return '';
    const checks = healthChecks(workspace);
    const healthy = checks.filter(([, ok]) => ok).length;
    const isOsStudio = workspace.workspaceKey === 'os-studio' || workspace.displayName === 'OS Studio';
    return `<details class="workspace-card-management" data-integrated-workspace-management="${escapeHtml(workspace.workspaceId)}">
      <summary><span>Workspace management</span><strong>${healthy}/${checks.length} checks</strong></summary>
      <div class="workspace-card-management-grid">
        <div><span>Lifecycle</span><strong>${escapeHtml(lifecycleState(workspace))}</strong></div>
        <div><span>Repository</span><code>${escapeHtml(workspace.repository?.root || 'Missing')}</code></div>
        <div><span>Workspace ID</span><code>${escapeHtml(workspace.workspaceId)}</code></div>
        <div><span>Workspace key</span><code>${escapeHtml(workspace.workspaceKey || '')}</code></div>
      </div>
      <div class="workspace-card-health">${checks.map(([label, ok]) => `<span class="${ok ? 'ok' : 'warning'}">${ok ? '✓' : '⚠'} ${escapeHtml(label)}</span>`).join('')}</div>
      <div class="workspace-card-management-actions">${isOsStudio ? '<button type="button" data-open-duplicate-review>Compare OS Studio Records</button>' : ''}${actionButtons(workspace)}</div>
    </details>`;
  }

  function injectManagementIntoCards() {
    if (!canonicalRegistry) return;
    document.querySelectorAll('[data-workspace-id]').forEach((card) => {
      const workspaceId = card.dataset.workspaceId;
      const workspace = (canonicalRegistry.workspaces || []).find((item) => item.workspaceId === workspaceId);
      if (!workspace || card.querySelector('[data-integrated-workspace-management]')) return;
      const primaryButton = card.querySelector('[data-resume-workspace]');
      if (!primaryButton) return;
      primaryButton.insertAdjacentHTML('beforebegin', workspaceManagementMarkup(workspace));
    });
  }

  async function loadCanonicalRegistry() {
    const response = await fetch(`${canonicalRegistryPath}&verify=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Canonical Workspace Registry returned ${response.status}.`);
    canonicalRegistry = await response.json();
    injectManagementIntoCards();
  }

  async function runLifecycleAction(workspaceId, action) {
    const workspace = (canonicalRegistry?.workspaces || []).find((item) => item.workspaceId === workspaceId);
    if (!workspace) throw new Error('The selected workspace no longer exists in the canonical registry.');
    const permanent = action === 'purge';
    const warning = permanent
      ? `Permanent purge removes ${workspace.displayName} (${workspaceId}) from the active registry. Repository content is retained only as audit preservation. Type PURGE to continue.`
      : `${action[0].toUpperCase() + action.slice(1)} ${workspace.displayName} using immutable ID ${workspaceId}?`;
    if (permanent) {
      const typed = window.prompt(warning);
      if (typed !== 'PURGE') return;
      const eligibility = await window.FounderOSGateway.manageWorkspaceLifecycle({ workspaceId, action: 'purge-check' });
      if (!eligibility.eligible) throw new Error(eligibility.blockers?.map((item) => item.message).join(' ') || 'Workspace is not eligible for purge.');
    } else if (!window.confirm(warning)) return;
    const reason = window.prompt('Enter the Founder reason for this lifecycle action. This will be written to the repository audit record.');
    if (!reason || reason.trim().length < 5) throw new Error('A reason of at least five characters is required.');
    const status = document.querySelector('[data-workspace-manager-status]');
    if (status) status.textContent = `${action} in progress for ${workspaceId}...`;
    await window.FounderOSGateway.manageWorkspaceLifecycle({ workspaceId, action, reason: reason.trim(), permanentPurgeApproved: permanent });
    await loadCanonicalRegistry();
    window.dispatchEvent(new CustomEvent('founder-os:workspace-lifecycle-changed', { detail: { workspaceId, action } }));
    const nextStatus = document.querySelector('[data-workspace-manager-status]');
    if (nextStatus) nextStatus.textContent = `${workspace.displayName} was successfully ${action === 'delete' ? 'soft-deleted' : `${action}d`}.`;
  }

  async function openDuplicateReview() {
    const response = await fetch(`${migrationReviewPath}&verify=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`OS Studio migration review returned ${response.status}.`);
    const review = await response.json();
    const records = review.records || [];
    const dialog = document.createElement('dialog');
    dialog.className = 'workspace-compare-dialog';
    dialog.innerHTML = `<form method="dialog"><div class="workspace-compare-heading"><div><div class="eyebrow">Duplicate Candidate Review</div><h2>OS Studio workspace comparison</h2><p>${escapeHtml(review.finding)}</p></div><button value="close" aria-label="Close comparison">×</button></div><div class="workspace-compare-grid">${records.map((record) => `<article class="glass-panel ${record.workspaceId === review.recommendedCanonicalWorkspaceId ? 'recommended' : ''}"><span class="pill">${escapeHtml(record.classification)}</span><h3>${escapeHtml(record.displayName)}</h3><dl><dt>Workspace ID</dt><dd><code>${escapeHtml(record.workspaceId)}</code></dd><dt>Workspace key</dt><dd>${escapeHtml(record.workspaceKey)}</dd><dt>Repository root</dt><dd><code>${escapeHtml(record.repositoryRoot)}</code></dd><dt>Identity contract</dt><dd>${escapeHtml(record.identityContract)}</dd><dt>Payload fingerprint</dt><dd>${record.payloadFingerprintPresent ? 'Present' : 'Missing'}</dd><dt>Created</dt><dd>${escapeHtml(record.createdAt)}</dd></dl>${record.workspaceId === review.recommendedCanonicalWorkspaceId ? '<strong class="recommended-label">Recommended canonical workspace</strong>' : ''}</article>`).join('')}</div><article class="workspace-compare-recommendation"><strong>Recommendation</strong><p>${escapeHtml(review.recommendationReason)}</p><p>No lifecycle action will occur from this comparison. Repository-root content must be reviewed and the Founder must separately approve the exact immutable workspace ID to transition.</p></article><button class="generate" value="close">Close Review</button></form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
  }

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-lifecycle-action]');
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      runLifecycleAction(action.dataset.lifecycleWorkspace, action.dataset.lifecycleAction).catch((error) => {
        console.error(error);
        const status = document.querySelector('[data-workspace-manager-status]');
        if (status) status.textContent = error.message;
        window.alert(error.message);
      });
      return;
    }
    if (event.target.closest('[data-open-duplicate-review]')) {
      event.preventDefault();
      event.stopPropagation();
      openDuplicateReview().catch((error) => window.alert(error.message));
    }
  });

  window.addEventListener('founder-os:workspace-registry-rendered', injectManagementIntoCards);
  window.addEventListener('founder-os:workspace-lifecycle-changed', () => window.location.reload());
  loadCanonicalRegistry().catch((error) => {
    console.error(error);
    const status = document.querySelector('[data-workspace-manager-status]');
    if (status) status.textContent = `Workspace management unavailable: ${error.message}`;
  });
})();