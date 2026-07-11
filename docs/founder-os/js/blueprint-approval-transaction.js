(() => {
  const approvalKey = 'nnos:blueprint-approval';
  const packageKey = 'nnos:execution-package';
  const $ = (selector) => document.querySelector(selector);

  function ensureDialog() {
    if ($('[data-approval-dialog]')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="approval-backdrop" data-approval-backdrop hidden></div>
      <section class="approval-dialog" data-approval-dialog hidden role="dialog" aria-modal="true">
        <div class="approval-dialog-head">
          <div><div class="eyebrow">Founder Approval</div><h2>Approve Natural Nation Blueprint</h2></div>
          <button type="button" data-close-approval>×</button>
        </div>
        <div class="approval-summary-grid">
          <div><span>Workspace</span><strong>Natural Nation</strong></div>
          <div><span>Blueprint</span><strong>v0.3</strong></div>
          <div><span>Readiness</span><strong>87%</strong></div>
        </div>
        <div class="approval-section">
          <div class="eyebrow">Validation</div>
          <p>Required sections are complete. Choose the remaining billing decision.</p>
        </div>
        <fieldset class="approval-choice">
          <legend>MVP billing decision</legend>
          <label><input type="radio" name="billing-decision" value="phase-1"> Include billing in Phase 1</label>
          <label><input type="radio" name="billing-decision" value="phase-2"> Move billing to Phase 2</label>
        </fieldset>
        <div class="approval-section"><div class="eyebrow">Approval Effect</div><p>Record approval, create an audit event, generate the execution package, update workspace state, and prepare Build Studio.</p></div>
        <div data-approval-progress hidden></div>
        <p data-approval-status>Select the billing decision to continue.</p>
        <div class="approval-actions">
          <button type="button" data-cancel-approval>Cancel</button>
          <button class="generate" type="button" data-confirm-approval disabled>Approve Blueprint</button>
          <button class="generate" type="button" data-open-build-handoff hidden>Open Build Studio →</button>
        </div>
      </section>
    `);
  }

  function openDialog() {
    ensureDialog();
    $('[data-approval-dialog]').hidden = false;
    $('[data-approval-backdrop]').hidden = false;
  }

  function closeDialog() {
    $('[data-approval-dialog]').hidden = true;
    $('[data-approval-backdrop]').hidden = true;
  }

  function executeApproval() {
    const choice = document.querySelector('input[name="billing-decision"]:checked')?.value;
    if (!choice) return;
    const label = choice === 'phase-1' ? 'Billing included in Phase 1' : 'Billing moved to Phase 2';
    const approvedAt = new Date().toISOString();
    const packageData = {
      id: 'NN-BUILD-001',
      title: 'Natural Nation Blueprint implementation package',
      owner: 'Codex',
      target: 'Codex',
      status: 'Ready',
      approval: 'Founder Approved',
      billingDecision: choice,
      billingLabel: label,
      approvedAt
    };
    const transaction = {
      id: `NN-APPROVAL-${Date.now()}`,
      workspace: 'natural-nation',
      blueprintVersion: '0.3',
      status: 'approved-local',
      approvedAt,
      billingDecision: choice,
      approvalRecord: true,
      auditEvent: true,
      executionPackage: packageData,
      gatewaySync: 'pending'
    };
    localStorage.setItem(approvalKey, JSON.stringify(transaction));
    localStorage.setItem(packageKey, JSON.stringify(packageData));

    $('[data-approval-progress]').hidden = false;
    $('[data-approval-progress]').innerHTML = `
      <div class="approval-step">✓ Validation passed</div>
      <div class="approval-step">✓ Founder approval recorded locally</div>
      <div class="approval-step">✓ Audit event created locally</div>
      <div class="approval-step">✓ Execution package generated</div>
      <div class="approval-step pending">○ GitHub synchronization pending gateway support</div>`;
    $('[data-approval-status]').textContent = 'Approval transaction complete. Package ready for Build Studio.';
    $('[data-confirm-approval]').hidden = true;
    $('[data-cancel-approval]').hidden = true;
    $('[data-open-build-handoff]').hidden = false;
    $('[data-blueprint-status]').textContent = 'Founder Approved';
    $('[data-sticky-decisions]').textContent = '0 pending';
    $('[data-blueprint-approval-effect]').textContent = 'Execution package NN-BUILD-001 is ready.';
  }

  function openBuildStudio() {
    const pkg = JSON.parse(localStorage.getItem(packageKey) || 'null');
    if (!pkg) return;
    window.setWorkspace?.('build');
    window.NNOSShowExecutionBar?.('build');
    $('[data-selected-id]').textContent = pkg.id;
    $('[data-selected-title]').textContent = pkg.title;
    $('[data-selected-meta]').textContent = `Owner: ${pkg.owner} • Target: ${pkg.target} • Status: ${pkg.status}`;
    $('[data-build-plain]').textContent = `Implements the approved Blueprint. ${pkg.billingLabel}.`;
    $('[data-build-approval]').textContent = pkg.approval;
    $('[data-validation-status]').textContent = 'Package ready for validation and protected execution.';
    $('[data-package-preview]').textContent = JSON.stringify(pkg, null, 2);
    closeDialog();
  }

  document.addEventListener('change', (event) => {
    if (!event.target.matches('input[name="billing-decision"]')) return;
    $('[data-confirm-approval]').disabled = false;
    $('[data-approval-status]').textContent = 'Ready for Founder confirmation.';
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-approve-blueprint]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openDialog();
      return;
    }
    if (event.target.closest('[data-confirm-approval]')) return executeApproval();
    if (event.target.closest('[data-open-build-handoff]')) return openBuildStudio();
    if (event.target.closest('[data-close-approval], [data-cancel-approval], [data-approval-backdrop]')) closeDialog();
  }, true);

  ensureDialog();
})();
