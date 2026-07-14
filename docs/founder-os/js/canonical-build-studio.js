(() => {
  const packagePath = '../execution-packages/NN-BUILD-001.json';
  const githubPackageUrl = 'https://github.com/Natural-Nation-MVP/natural-nation-mvp/blob/main/docs/execution-packages/NN-BUILD-001.json';
  let canonicalPackage = null;
  let packageAvailable = false;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function isNaturalNationActive() {
    return window.NNOSActiveWorkspace?.id === 'natural-nation';
  }

  function setBuildActions(label, disabled = false) {
    $$('[data-action="generate"]').forEach((button) => {
      button.disabled = disabled;
      button.textContent = label;
    });
    $$('[data-action="validate"], [data-action="export-md"], [data-action="export-json"]').forEach((button) => {
      button.disabled = true;
    });
  }

  function clearQueue() {
    const queue = $('[data-build-queue]');
    if (queue) queue.innerHTML = '';
  }

  function renderUnscoped() {
    packageAvailable = false;
    canonicalPackage = null;
    clearQueue();
    setText('[data-selected-id]', 'No Workspace Build Selected');
    setText('[data-selected-title]', 'Build packages are scoped to their owning workspace.');
    setText('[data-selected-meta]', 'Open a workspace that has a canonical execution package.');
    setText('[data-validation-status]', 'No package is loaded outside its owning workspace.');
    setText('[data-build-approval]', 'Workspace Package Required');
    setText('[data-approval]', 'Workspace Package Required');
    const preview = $('[data-package-preview]');
    if (preview) preview.textContent = 'No cross-workspace package data is displayed.';
    setBuildActions('No Workspace Package', true);
  }

  function renderBlocked(reason) {
    packageAvailable = false;
    canonicalPackage = null;
    clearQueue();
    setText('[data-selected-id]', 'NN-BUILD-001');
    setText('[data-selected-title]', 'Canonical package unavailable');
    setText('[data-selected-meta]', 'Natural Nation · Source: GitHub repository');
    setText('[data-validation-status]', reason);
    setText('[data-build-approval]', 'Canonical Package Required');
    setText('[data-approval]', 'Canonical Package Required');
    const preview = $('[data-package-preview]');
    if (preview) preview.textContent = 'Natural Nation Build Studio is waiting for a verified repository package.';
    setBuildActions('Await Canonical Package', true);
  }

  function validPackage(pkg) {
    return Boolean(pkg?.packageId === 'NN-BUILD-001' && pkg?.workspaceId === 'natural-nation' && pkg?.sourceTransactionId && pkg?.status === 'ready');
  }

  function renderCanonical(pkg) {
    if (!isNaturalNationActive()) return renderUnscoped();
    packageAvailable = true;
    canonicalPackage = pkg;
    setText('[data-selected-id]', pkg.packageId);
    setText('[data-selected-title]', pkg.title || 'Natural Nation Blueprint Implementation');
    setText('[data-selected-meta]', `Owner: ${pkg.assignedTo || 'Codex'} · Source: ${pkg.sourceTransactionId} · Status: ${pkg.status}`);
    setText('[data-validation-status]', `Canonical package loaded from GitHub. Created ${pkg.createdAt}.`);
    setText('[data-build-approval]', 'Founder Approval Complete');
    setText('[data-approval]', 'Founder Approval Complete');
    setText('[data-bottom-target]', pkg.assignedTo || 'Codex');
    $$('[data-delivery]').forEach((node) => { node.textContent = `${pkg.assignedTo || 'Codex'} Implementation Agent`; });

    const preview = $('[data-package-preview]');
    if (preview) preview.textContent = JSON.stringify(pkg, null, 2);

    const queue = $('[data-build-queue]');
    if (queue) queue.innerHTML = `
      <button class="queue-item active" type="button" data-canonical-package-id="${pkg.packageId}">
        <span class="queue-top"><strong>${pkg.packageId}</strong><span class="status">${pkg.status}</span></span>
        <span>${pkg.title}</span>
        <small>Natural Nation · ${pkg.assignedTo || 'Codex'} · ${pkg.sourceTransactionId}</small>
      </button>`;

    const history = $('[data-package-history]');
    if (history) history.innerHTML = `<div class="record-row"><span>${pkg.packageId} loaded from GitHub</span><span class="status">Verified</span></div>`;
    setBuildActions('Open Canonical Package →', false);
  }

  async function loadCanonicalPackage() {
    if (!isNaturalNationActive()) {
      renderUnscoped();
      return null;
    }
    try {
      const response = await fetch(`${packagePath}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Canonical package returned ${response.status}.`);
      const pkg = await response.json();
      if (!validPackage(pkg)) throw new Error('Canonical package does not match the active Natural Nation workspace.');
      renderCanonical(pkg);
      return pkg;
    } catch (error) {
      renderBlocked(error.message);
      return null;
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.dataset.action !== 'generate') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!isNaturalNationActive() || !packageAvailable || !canonicalPackage) return;
    window.open(githubPackageUrl, '_blank', 'noopener');
  }, true);

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.target === 'build') loadCanonicalPackage();
    else if (event.detail?.workspace?.id !== 'natural-nation') renderUnscoped();
  });
  window.addEventListener('founder-os:canonical-blueprint-approved', loadCanonicalPackage);

  window.NNOSCanonicalBuild = { reload: loadCanonicalPackage, get package() { return canonicalPackage; } };
  renderUnscoped();
})();
