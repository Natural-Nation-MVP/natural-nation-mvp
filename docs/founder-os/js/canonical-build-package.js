(() => {
  const packagePath = '../execution-packages/NN-BUILD-001.json';
  let canonicalPackage = null;
  let loadState = 'loading';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function packageMarkdown(pkg) {
    return `# ${pkg.packageId} — ${pkg.title}\n\n## Status\n${pkg.status}\n\n## Objective\n${pkg.objective}\n\n## Repository Target\n${pkg.repositoryTarget}\n\n## Assigned To\n${pkg.assignedTo}\n\n## Review Roles\n- Architecture: ${pkg.architectureReview}\n- Design: ${pkg.designReview}\n- Final Approval: ${pkg.finalApproval}\n\n## Source Transaction\n${pkg.sourceTransactionId}\n\n## Acceptance Criteria\n${(pkg.acceptanceCriteria || []).map((item) => `- ${item}`).join('\n')}\n\n## Validation Checklist\n${(pkg.validationChecklist || []).map((item) => `- ${item}`).join('\n')}\n\n## Rollback Guidance\n${pkg.rollbackGuidance}`;
  }

  function setActionState(label, disabled) {
    $$('[data-action="generate"]').forEach((button) => {
      button.textContent = label;
      button.disabled = disabled;
      button.dataset.canonicalPackageAction = 'true';
    });
  }

  function renderMissingPackage() {
    loadState = 'missing';
    canonicalPackage = null;
    setText('[data-selected-id]', 'No Canonical Package');
    setText('[data-selected-title]', 'Approve and verify the Blueprint before entering Build Studio.');
    setText('[data-selected-meta]', 'Repository status: NN-BUILD-001 not found');
    setText('[data-validation-status]', 'Build Studio is blocked until GitHub contains NN-BUILD-001.');
    setText('[data-build-approval]', 'Canonical Approval Required');
    setText('[data-approval]', 'Canonical Approval Required');
    setText('[data-bottom-target]', 'Blocked');
    const preview = $('[data-package-preview]');
    if (preview) preview.textContent = 'No canonical execution package exists. Local previews do not count as generated packages.';
    setActionState('Approval Required', true);
  }

  function renderCanonicalPackage(pkg) {
    loadState = 'ready';
    canonicalPackage = pkg;

    setText('[data-selected-id]', pkg.packageId);
    setText('[data-selected-title]', pkg.title);
    setText('[data-selected-meta]', `Owner: ${pkg.assignedTo} • Source: ${pkg.sourceTransactionId} • Status: ${pkg.status}`);
    setText('[data-validation-status]', `Canonical package loaded from GitHub. Created ${pkg.createdAt}.`);
    setText('[data-build-approval]', 'Founder Approval Complete');
    setText('[data-approval]', 'Founder Approval Complete');
    setText('[data-bottom-target]', pkg.assignedTo);
    $$('[data-delivery]').forEach((node) => { node.textContent = `${pkg.assignedTo} Implementation Agent`; });

    const preview = $('[data-package-preview]');
    if (preview) {
      preview.textContent = packageMarkdown(pkg);
      preview.dataset.generated = 'canonical';
      preview.closest('.output-panel')?.classList.add('generated');
    }

    const queue = $('[data-build-queue]');
    if (queue) {
      const existing = queue.querySelector('[data-canonical-package-id="NN-BUILD-001"]');
      if (!existing) {
        queue.insertAdjacentHTML('afterbegin', `
          <button class="queue-item active" type="button" data-canonical-package-id="NN-BUILD-001">
            <span class="queue-top"><strong>${pkg.packageId}</strong><span class="status">${pkg.status}</span></span>
            <span>${pkg.title}</span>
            <small>Canonical • ${pkg.assignedTo} • ${pkg.sourceTransactionId}</small>
          </button>
        `);
      }
    }

    setActionState('Open Canonical Package →', false);
  }

  async function loadCanonicalPackage() {
    loadState = 'loading';
    setActionState('Checking Repository…', true);

    try {
      const response = await fetch(`${packagePath}?verify=${Date.now()}`, { cache: 'no-store' });
      if (response.status === 404) {
        renderMissingPackage();
        return;
      }
      if (!response.ok) throw new Error(`Package registry returned ${response.status}.`);

      const pkg = await response.json();
      if (pkg.packageId !== 'NN-BUILD-001' || pkg.status !== 'ready' || !pkg.sourceTransactionId) {
        throw new Error('NN-BUILD-001 is incomplete or not ready.');
      }

      renderCanonicalPackage(pkg);
    } catch (error) {
      console.error('Canonical package load failed', error);
      renderMissingPackage();
      setText('[data-validation-status]', `Canonical package could not be verified: ${error.message}`);
    }
  }

  document.addEventListener('click', (event) => {
    const generate = event.target.closest('[data-action="generate"]');
    if (!generate) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (loadState !== 'ready' || !canonicalPackage) {
      window.alert('Build Studio is blocked. GitHub does not contain a verified NN-BUILD-001 package.');
      return;
    }

    const preview = $('[data-package-preview]');
    preview?.closest('.output-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setText('[data-validation-status]', `Opened canonical ${canonicalPackage.packageId}. No new local package was generated.`);
  }, true);

  window.addEventListener('founder-os:canonical-blueprint-approved', () => {
    setTimeout(loadCanonicalPackage, 1200);
  });

  loadCanonicalPackage();
})();