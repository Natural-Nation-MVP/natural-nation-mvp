(() => {
  const packagePath = './execution-packages/NN-BUILD-001.json';
  const githubPackageUrl = 'https://github.com/Natural-Nation-MVP/natural-nation-mvp/blob/main/docs/execution-packages/NN-BUILD-001.json';

  let canonicalPackage = null;
  let packageAvailable = false;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function setBuildActions({ enabled, label }) {
    $$('[data-action="generate"], [data-action="validate"], [data-action="export-md"], [data-action="export-json"]').forEach((button) => {
      button.disabled = !enabled;
      button.dataset.canonicalOnly = 'true';
    });

    $$('[data-action="generate"]').forEach((button) => {
      button.disabled = false;
      button.textContent = label;
    });
  }

  function renderBlocked() {
    packageAvailable = false;
    canonicalPackage = null;

    setText('[data-selected-id]', 'NN-BUILD-001');
    setText('[data-selected-title]', 'Canonical package not created');
    setText('[data-selected-meta]', 'Status: Blocked • Source: GitHub repository');
    setText('[data-validation-status]', 'Approve the Blueprint through the Gateway before Build Studio can load a package.');
    setText('[data-build-approval]', 'Canonical Approval Required');
    setText('[data-approval]', 'Canonical Approval Required');

    const preview = $('[data-package-preview]');
    if (preview) {
      preview.textContent = 'No canonical package exists at docs/execution-packages/NN-BUILD-001.json.\n\nLocal package generation is disabled. Complete the protected Blueprint approval transaction first.';
      preview.dataset.generated = 'blocked';
    }

    const history = $('[data-package-history]');
    if (history) history.innerHTML = '<p class="muted">No repository-backed packages are available.</p>';

    setBuildActions({ enabled: false, label: 'Await Canonical Approval' });
  }

  function renderCanonical(pkg) {
    packageAvailable = true;
    canonicalPackage = pkg;

    setText('[data-selected-id]', pkg.packageId || 'NN-BUILD-001');
    setText('[data-selected-title]', pkg.title || 'Natural Nation Blueprint Implementation');
    setText('[data-selected-meta]', `Owner: ${pkg.assignedTo || 'Codex'} • Status: ${pkg.status || 'ready'} • Source: GitHub`);
    setText('[data-validation-status]', `Canonical package loaded from GitHub. Transaction: ${pkg.sourceTransactionId || 'verified'}.`);
    setText('[data-build-approval]', 'Founder Approval Verified');
    setText('[data-approval]', 'Founder Approval Verified');
    setText('[data-bottom-target]', pkg.assignedTo || 'Codex');

    const preview = $('[data-package-preview]');
    if (preview) {
      preview.textContent = JSON.stringify(pkg, null, 2);
      preview.dataset.generated = 'canonical';
    }

    const history = $('[data-package-history]');
    if (history) {
      history.innerHTML = `<div class="record-row"><span>${pkg.packageId || 'NN-BUILD-001'} loaded from GitHub</span><span class="status">Verified</span></div>`;
    }

    setBuildActions({ enabled: false, label: 'Open Canonical Package →' });
  }

  async function loadCanonicalPackage() {
    try {
      const response = await fetch(`${packagePath}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Package returned ${response.status}`);
      const pkg = await response.json();
      if (pkg.packageId !== 'NN-BUILD-001' || !pkg.sourceTransactionId) {
        throw new Error('Canonical package is incomplete.');
      }
      renderCanonical(pkg);
      return pkg;
    } catch (error) {
      renderBlocked();
      return null;
    }
  }

  function interceptLegacyActions(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    if (!['generate', 'validate', 'export-md', 'export-json'].includes(action)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (action === 'generate' && packageAvailable) {
      window.open(githubPackageUrl, '_blank', 'noopener');
      return;
    }

    window.alert(
      packageAvailable
        ? 'This package is repository-backed. Open the canonical GitHub record instead of generating a browser copy.'
        : 'Build Studio is blocked until the protected Blueprint approval transaction creates NN-BUILD-001 in GitHub.'
    );
  }

  document.addEventListener('click', interceptLegacyActions, true);
  window.NNOSCanonicalBuild = {
    reload: loadCanonicalPackage,
    get package() { return canonicalPackage; }
  };

  loadCanonicalPackage();
})();
