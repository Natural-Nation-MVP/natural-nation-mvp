(() => {
  'use strict';

  const REQUIRED_MODULES = ['discovery', 'blueprint', 'build', 'ai', 'repo', 'knowledge'];
  const splitLines = (value) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);

  let dialog = null;
  let step = 1;

  function workspace() { return window.NNOSActiveWorkspace || null; }
  function field(name) { return dialog?.querySelector(`[name="${name}"]`); }
  function value(name) { return field(name)?.value.trim() || ''; }

  function workspaceChecks(current) {
    const modules = Array.isArray(current?.modules) ? current.modules.map((item) => item.target) : [];
    return [
      { label: 'Immutable workspace identity', pass: Boolean(current?.id) },
      { label: 'Workspace foundation is registered', pass: ['foundation', 'active'].includes(String(current?.status || '').toLowerCase()) },
      { label: 'Planning, Build, AI, Code, and Records areas exist', pass: REQUIRED_MODULES.every((module) => modules.includes(module)) }
    ];
  }

  function packageChecks() {
    return [
      { label: 'Build outcome and intended user are clear', pass: Boolean(value('title') && value('outcome') && value('intendedUser')) },
      { label: 'Included and excluded scope are explicit', pass: Boolean(splitLines(value('included')).length && splitLines(value('excluded')).length) },
      { label: 'Success can be verified', pass: Boolean(splitLines(value('acceptanceCriteria')).length && splitLines(value('validationRequirements')).length) },
      { label: 'Protected boundaries are explicit', pass: Boolean(splitLines(value('protectedBoundaries')).length) },
      { label: 'No consequential questions remain', pass: !splitLines(value('unresolvedQuestions')).length }
    ];
  }

  function readiness(checks) {
    const passed = checks.filter((check) => check.pass).length;
    return { status: passed === checks.length ? 'ready' : 'needs-clarification', passed, total: checks.length, checks };
  }

  function workOrder() {
    const current = workspace();
    return {
      workOrderVersion: '1.0.0', workspaceId: current.id,
      title: value('title'), requestType: value('requestType'), outcome: value('outcome'), intendedUser: value('intendedUser'),
      scope: { included: splitLines(value('included')), excluded: splitLines(value('excluded')) },
      acceptanceCriteria: splitLines(value('acceptanceCriteria')),
      designReferences: splitLines(value('designReferences')),
      protectedBoundaries: splitLines(value('protectedBoundaries')),
      dependencies: splitLines(value('dependencies')),
      validationRequirements: splitLines(value('validationRequirements')),
      unresolvedQuestions: splitLines(value('unresolvedQuestions')),
      assumptions: [], deliveryTarget: 'draft-preview', priority: value('priority'),
      workspaceReadiness: readiness(workspaceChecks(current)),
      packageReadiness: readiness(packageChecks()),
      approvedAt: new Date().toISOString()
    };
  }

  function checkList(result) {
    return `<div class="build-readiness ${result.status === 'ready' ? 'is-ready' : 'needs-clarification'}">
      <strong>${result.status === 'ready' ? 'Ready' : 'Needs clarification'} · ${result.passed}/${result.total}</strong>
      <ul>${result.checks.map((check) => `<li class="${check.pass ? 'pass' : 'missing'}">${check.pass ? '✓' : '○'} ${escapeHtml(check.label)}</li>`).join('')}</ul>
    </div>`;
  }

  function reviewMarkup(order) {
    return `<div class="build-readiness-grid">
      <section><span class="eyebrow">Workspace Readiness</span>${checkList(order.workspaceReadiness)}</section>
      <section><span class="eyebrow">Package Readiness</span>${checkList(order.packageReadiness)}</section>
    </div>
    <section class="build-work-order"><span class="eyebrow">Review Work Order</span><h3>${escapeHtml(order.title || 'Untitled build')}</h3>
      <dl><div><dt>Outcome</dt><dd>${escapeHtml(order.outcome || 'Not provided')}</dd></div><div><dt>For</dt><dd>${escapeHtml(order.intendedUser || 'Not provided')}</dd></div><div><dt>Delivery boundary</dt><dd>Draft preview only · no merge or production change</dd></div><div><dt>Included</dt><dd>${escapeHtml(order.scope.included.join('; ') || 'Not provided')}</dd></div><div><dt>Excluded</dt><dd>${escapeHtml(order.scope.excluded.join('; ') || 'Not provided')}</dd></div></dl>
    </section>
    <label class="build-confirm"><input type="checkbox" name="confirmed"> I approve this work order and its protected boundaries.</label>`;
  }

  function render() {
    if (!dialog) return;
    dialog.querySelectorAll('[data-build-step]').forEach((panel) => { panel.hidden = Number(panel.dataset.buildStep) !== step; });
    dialog.querySelector('[data-build-step-label]').textContent = `Step ${step} of 3`;
    dialog.querySelector('[data-build-back]').hidden = step === 1;
    dialog.querySelector('[data-build-next]').hidden = step === 3;
    dialog.querySelector('[data-build-submit]').hidden = step !== 3;
    if (step === 3) {
      const order = workOrder();
      dialog.querySelector('[data-build-review]').innerHTML = reviewMarkup(order);
      const submit = dialog.querySelector('[data-build-submit]');
      submit.disabled = order.workspaceReadiness.status !== 'ready' || order.packageReadiness.status !== 'ready' || !field('confirmed')?.checked;
    }
  }

  function createDialog() {
    const node = document.createElement('dialog');
    node.className = 'build-request-dialog';
    node.setAttribute('aria-labelledby', 'build-request-title');
    node.innerHTML = `<form method="dialog" class="build-request-composer">
      <header><div><span class="eyebrow">Governed build request</span><h2 id="build-request-title">Create Build</h2><p data-build-workspace></p></div><button type="button" class="build-dialog-close" data-build-close aria-label="Close">×</button></header>
      <div class="build-step-label" data-build-step-label></div>
      <section data-build-step="1"><h3>Describe the result</h3><p>Tell the AI team what should be true when the work is finished.</p>
        <label>Build title<input name="title" required placeholder="Example: Add member check-in"></label>
        <label>Request type<select name="requestType"><option value="feature">New feature</option><option value="application">New application</option><option value="fix">Fix or improvement</option><option value="automation">Automation</option><option value="architecture">Architecture</option><option value="documentation">Research or documentation</option></select></label>
        <label>Outcome<textarea name="outcome" required placeholder="Members can complete a daily check-in and see confirmation."></textarea></label>
        <label>Intended user<input name="intendedUser" required placeholder="Example: Natural Nation member"></label>
      </section>
      <section data-build-step="2" hidden><h3>Set scope and safeguards</h3><p>Use one item per line. These boundaries travel with the assignment.</p>
        <div class="build-field-grid"><label>Include<textarea name="included" required></textarea></label><label>Exclude<textarea name="excluded" required></textarea></label><label>Acceptance criteria<textarea name="acceptanceCriteria" required></textarea></label><label>Protected boundaries<textarea name="protectedBoundaries" required placeholder="No production deployment without Founder approval"></textarea></label><label>Validation requirements<textarea name="validationRequirements" required placeholder="Cross-browser tests pass"></textarea></label><label>Design references<textarea name="designReferences"></textarea></label><label>Dependencies or access<textarea name="dependencies"></textarea></label><label>Unresolved consequential questions<textarea name="unresolvedQuestions" placeholder="Leave blank when resolved"></textarea></label></div>
        <label>Priority<select name="priority"><option value="medium">Medium</option><option value="low">Low</option><option value="high">High</option><option value="critical">Critical</option></select></label>
      </section>
      <section data-build-step="3" hidden><h3>Confirm readiness</h3><p>Founder OS starts work only when the workspace and this package are both ready.</p><div data-build-review></div></section>
      <p class="build-request-feedback" data-build-feedback role="status" aria-live="polite"></p>
      <footer><button type="button" data-build-back>Back</button><button type="button" data-build-next>Continue</button><button type="button" class="build-submit" data-build-submit>Approve Work Order and Start Build</button></footer>
    </form>`;
    document.body.append(node);
    return node;
  }

  function open() {
    const current = workspace();
    if (!current || current.id === 'founder-os') return;
    dialog = dialog || createDialog();
    step = 1;
    dialog.querySelector('form').reset();
    dialog.querySelector('[data-build-workspace]').textContent = `${current.name} · ${current.id}`;
    dialog.querySelector('[data-build-feedback]').textContent = '';
    render();
    dialog.showModal();
  }

  document.addEventListener('click', async (event) => {
    if (event.target.closest('[data-create-build]')) { open(); return; }
    if (!dialog) return;
    if (event.target.closest('[data-build-close]')) { dialog.close(); return; }
    if (event.target.closest('[data-build-back]')) { step = Math.max(1, step - 1); render(); return; }
    if (event.target.closest('[data-build-next]')) {
      const currentPanel = dialog.querySelector(`[data-build-step="${step}"]`);
      const invalid = [...currentPanel.querySelectorAll('[required]')].find((input) => !input.value.trim());
      if (invalid) { invalid.reportValidity(); return; }
      step = Math.min(3, step + 1); render(); return;
    }
    const confirm = event.target.closest('[name="confirmed"]');
    if (confirm) dialog.querySelector('[data-build-submit]').disabled = !confirm.checked;
    const submit = event.target.closest('[data-build-submit]');
    if (submit) {
      const order = workOrder();
      if (order.workspaceReadiness.status !== 'ready' || order.packageReadiness.status !== 'ready' || !field('confirmed')?.checked) return;
      const feedback = dialog.querySelector('[data-build-feedback]');
      submit.disabled = true; feedback.textContent = 'Creating governed assignment…';
      try {
        await window.FounderOSGateway.createAiWorkItem({ workspaceId: order.workspaceId, workOrder: order });
        feedback.textContent = 'Build created. The AI team can now claim the approved work order.';
        await window.NNOSAIWorkQueue?.reload();
        window.setTimeout(() => dialog.close(), 900);
      } catch (error) { feedback.textContent = `Build not created: ${error.message}`; submit.disabled = false; }
    }
  });

  window.NNOSBuildRequestComposer = { open, workspaceChecks, packageChecks };
})();
