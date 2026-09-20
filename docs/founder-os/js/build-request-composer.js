(() => {
  'use strict';

  const REQUIRED_MODULES = ['discovery', 'blueprint', 'build', 'ai', 'repo', 'knowledge'];
  const splitLines = (value) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
  const unique = (items) => [...new Set(items.filter(Boolean))];

  const UNIVERSAL_SUGGESTIONS = {
    excluded: ['No automatic production deployment', 'No merge without Founder approval', 'No unrelated feature changes'],
    protectedBoundaries: ['Preserve existing approved workflows', 'Do not expose secrets or personal data', 'Require Founder approval before merge or deployment'],
    validationRequirements: ['Automated contract tests pass', 'Chromium and Mobile Safari checks pass', 'No regression in existing workspace navigation'],
    acceptanceCriteria: ['The intended user can complete the requested task', 'The result is clear on desktop and tablet', 'Failure states explain the next action']
  };

  const TYPE_SUGGESTIONS = {
    feature: {
      included: ['Create the user-facing interaction', 'Connect the interaction to workspace data', 'Add loading, empty, success, and error states'],
      acceptanceCriteria: ['The feature works from start to finish', 'User choices remain editable before submission'],
      validationRequirements: ['Test the primary user journey', 'Verify keyboard and touch interaction']
    },
    application: {
      included: ['Define the core user journey', 'Create the first usable experience', 'Add the minimum data and navigation structure'],
      excluded: ['No Phase 2 capabilities unless explicitly approved'],
      acceptanceCriteria: ['A new user can reach the first useful result', 'The application has a clear next action'],
      validationRequirements: ['Test first-time user setup', 'Verify responsive layouts']
    },
    fix: {
      included: ['Reproduce the current problem', 'Correct the root cause', 'Add regression coverage'],
      excluded: ['No unrelated visual redesign'],
      acceptanceCriteria: ['The reported failure no longer occurs', 'Existing successful behavior remains unchanged'],
      validationRequirements: ['Regression test the corrected behavior']
    },
    automation: {
      included: ['Define the trigger and expected result', 'Show status and failure details', 'Keep a reviewable activity record'],
      excluded: ['No destructive action without confirmation', 'No silent merge or deployment'],
      acceptanceCriteria: ['The automation reports whether it succeeded', 'A failed run provides a recoverable next step'],
      validationRequirements: ['Test success, failure, and retry paths']
    },
    architecture: {
      included: ['Document the proposed structure', 'Identify affected systems and migration needs', 'Preserve current governance boundaries'],
      excluded: ['No irreversible migration in this build'],
      acceptanceCriteria: ['The decision and tradeoffs are documented', 'The implementation path is reviewable'],
      validationRequirements: ['Run architecture and contract validation']
    },
    documentation: {
      included: ['Answer the stated question with evidence', 'Record assumptions and unresolved items', 'Provide a clear recommended next action'],
      excluded: ['No code or production changes'],
      acceptanceCriteria: ['The document is understandable to a non-technical founder', 'Claims are traceable to evidence'],
      validationRequirements: ['Review links, references, and stated assumptions']
    }
  };

  let dialog = null;
  let step = 1;
  let existingWork = { status: 'not-checked', matches: [], decision: null };

  function workspace() { return window.NNOSActiveWorkspace || null; }
  function field(name) { return dialog?.querySelector(`[name="${name}"]`); }
  function value(name) { return field(name)?.value.trim() || ''; }
  function isConfirmed() { return dialog?.querySelector('[data-build-confirm]')?.getAttribute('aria-checked') === 'true'; }

  function words(text) {
    return new Set(String(text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
      .filter((word) => word.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'from'].includes(word)));
  }

  function similarity(left, right) {
    const a = words(left); const b = words(right);
    if (!a.size || !b.size) return 0;
    const overlap = [...a].filter((word) => b.has(word)).length;
    return overlap / Math.min(a.size, b.size);
  }

  async function checkExistingWork() {
    const current = workspace();
    const feedback = dialog.querySelector('[data-build-feedback]');
    existingWork = { status: 'checking', matches: [], decision: null };
    feedback.textContent = 'Checking existing and completed work…';
    render();
    try {
      const origin = window.NNOSPaths?.gatewayOrigin || 'https://founder-os-gateway.dmoseley1024.workers.dev';
      const response = await fetch(`${origin}/v1/workspaces/${encodeURIComponent(current.id)}/ai-work-queue?v=${Date.now()}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || body?.ok === false) throw new Error(body?.error?.message || 'Existing work could not be checked.');
      const requested = `${value('title')} ${value('outcome')}`;
      const matches = (Array.isArray(body.items) ? body.items : []).map((item) => {
        const candidate = `${item.title || ''} ${item.description || ''} ${item.workOrder?.outcome || ''} ${(item.workOrder?.scope?.included || []).join(' ')}`;
        return { ...item, similarity: similarity(requested, candidate) };
      }).filter((item) => item.similarity >= 0.5).sort((a, b) => b.similarity - a.similarity).slice(0, 5);
      existingWork = { status: matches.length ? 'potential-match' : 'no-match', matches, decision: matches.length ? null : 'create-new' };
      feedback.textContent = matches.length ? 'Possible existing work found. Choose how this request should proceed.' : 'No matching work found. You can continue.';
    } catch (error) {
      existingWork = { status: 'unavailable', matches: [], decision: null, error: error.message };
      feedback.textContent = 'Existing work could not be verified. Retry before creating a new build.';
    }
    render();
  }

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
      { label: 'Existing work was checked and resolved', pass: ['no-match', 'potential-match'].includes(existingWork.status) && Boolean(existingWork.decision) },
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
      workOrderVersion: '1.2.0', workspaceId: current.id,
      title: value('title'), requestType: value('requestType'), outcome: value('outcome'), intendedUser: value('intendedUser'),
      scope: { included: splitLines(value('included')), excluded: splitLines(value('excluded')) },
      acceptanceCriteria: splitLines(value('acceptanceCriteria')),
      designReferences: splitLines(value('designReferences')),
      protectedBoundaries: splitLines(value('protectedBoundaries')),
      dependencies: splitLines(value('dependencies')),
      validationRequirements: splitLines(value('validationRequirements')),
      unresolvedQuestions: splitLines(value('unresolvedQuestions')),
      assumptions: [], deliveryTarget: 'draft-preview', priority: value('priority'),
      existingWorkReview: {
        status: existingWork.status,
        decision: existingWork.decision,
        matchIds: existingWork.matches.map((item) => item.itemId),
        checkedAt: new Date().toISOString()
      },
      workspaceReadiness: readiness(workspaceChecks(current)),
      packageReadiness: readiness(packageChecks()),
      approvedAt: new Date().toISOString()
    };
  }

  function suggestionsFor(name) {
    const type = value('requestType') || 'feature';
    const current = workspace();
    const contextual = [];
    if (name === 'included' && current?.name) contextual.push(`Apply the change within ${current.name}`);
    if (name === 'acceptanceCriteria' && value('outcome')) contextual.push(`The completed result matches: ${value('outcome')}`);
    if (name === 'designReferences' && current?.name) contextual.push(`${current.name} approved design system`);
    return unique([...(TYPE_SUGGESTIONS[type]?.[name] || []), ...(UNIVERSAL_SUGGESTIONS[name] || []), ...contextual]);
  }

  function suggestionMarkup(name) {
    const selected = splitLines(value(name));
    const suggestions = suggestionsFor(name);
    if (!suggestions.length) return '';
    return `<div class="build-suggestions" data-suggestions-for="${name}">
      <div class="build-suggestion-heading"><strong>Suggested for this build</strong><span>Select all that apply</span></div>
      <div class="build-suggestion-options">${suggestions.map((item) => {
        const checked = selected.includes(item);
        return `<button type="button" class="build-suggestion${checked ? ' is-selected' : ''}" role="checkbox" aria-checked="${checked}" data-suggestion-field="${name}" data-suggestion-value="${escapeHtml(item)}"><span aria-hidden="true">${checked ? '✓' : '○'}</span>${escapeHtml(item)}</button>`;
      }).join('')}</div>
    </div>`;
  }

  function refreshSuggestions() {
    if (!dialog) return;
    dialog.querySelectorAll('[data-suggestions-for]').forEach((container) => {
      const name = container.dataset.suggestionsFor;
      container.outerHTML = suggestionMarkup(name);
    });
  }

  function toggleSuggestion(button) {
    const name = button.dataset.suggestionField;
    const item = button.dataset.suggestionValue;
    const input = field(name);
    if (!input) return;
    const lines = splitLines(input.value);
    input.value = lines.includes(item) ? lines.filter((line) => line !== item).join('\n') : [...lines, item].join('\n');
    refreshSuggestions();
  }

  function guidedField(name, label, options = {}) {
    const required = options.required ? ' required' : '';
    const placeholder = options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : '';
    return `<div class="build-guided-field"><label>${label}<textarea name="${name}"${required}${placeholder}></textarea></label>${suggestionMarkup(name)}</div>`;
  }

  function checkList(result) {
    return `<div class="build-readiness ${result.status === 'ready' ? 'is-ready' : 'needs-clarification'}"><strong>${result.status === 'ready' ? 'Ready' : 'Needs clarification'} · ${result.passed}/${result.total}</strong><ul>${result.checks.map((check) => `<li class="${check.pass ? 'pass' : 'missing'}">${check.pass ? '✓' : '○'} ${escapeHtml(check.label)}</li>`).join('')}</ul></div>`;
  }

  function existingWorkMarkup() {
    if (existingWork.status === 'checking') return '<div class="existing-work-state"><strong>Checking this workspace…</strong><span>Comparing your idea with active and completed work.</span></div>';
    if (existingWork.status === 'unavailable') return `<div class="existing-work-state is-warning"><strong>Existing work is unavailable</strong><span>${escapeHtml(existingWork.error || 'The workspace history could not be loaded.')}</span><button type="button" data-existing-work-retry>Retry check</button></div>`;
    if (existingWork.status === 'no-match') return '<div class="existing-work-state is-clear"><strong>✓ No matching work found</strong><span>This request appears to be new for this workspace.</span></div>';
    if (existingWork.status !== 'potential-match') return '<div class="existing-work-state"><strong>Ready to check</strong><span>Continue from the first step to compare this idea with existing work.</span></div>';
    return `<div class="existing-work-results"><div class="existing-work-state is-warning"><strong>We may have already built this</strong><span>Review the closest matches before creating more work.</span></div>
      <div class="existing-work-matches">${existingWork.matches.map((item) => `<article><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.status)} · ${Math.round(item.similarity * 100)}% match</span></div><p>${escapeHtml(item.description || item.workOrder?.outcome || 'No description')}</p><button type="button" data-open-existing-work="${escapeHtml(item.itemId)}">Open existing work</button></article>`).join('')}</div>
      <fieldset class="existing-work-decisions"><legend>How should Founder OS handle your request?</legend>
        ${[['improve', 'Improve the existing work', 'Create a connected enhancement.'], ['fix', 'Fix a problem', 'Treat this as a repair or correction.'], ['distinct-version', 'Build a distinct version', 'Proceed separately and preserve the relationship.']].map(([decision, label, description]) => `<button type="button" role="radio" aria-checked="${existingWork.decision === decision}" class="${existingWork.decision === decision ? 'is-selected' : ''}" data-existing-work-decision="${decision}"><strong>${label}</strong><span>${description}</span></button>`).join('')}
        <button type="button" data-existing-work-cancel><strong>Cancel request</strong><span>Do not add duplicate work to the queue.</span></button>
      </fieldset></div>`;
  }

  function reviewMarkup(order) {
    return `<div class="build-readiness-grid"><section><span class="eyebrow">Workspace Readiness</span>${checkList(order.workspaceReadiness)}</section><section><span class="eyebrow">Package Readiness</span>${checkList(order.packageReadiness)}</section></div>
    <section class="build-work-order"><span class="eyebrow">Review Work Order</span><h3>${escapeHtml(order.title || 'Untitled build')}</h3><dl><div><dt>Outcome</dt><dd>${escapeHtml(order.outcome || 'Not provided')}</dd></div><div><dt>For</dt><dd>${escapeHtml(order.intendedUser || 'Not provided')}</dd></div><div><dt>Delivery boundary</dt><dd>Draft preview only · no merge or production change</dd></div><div><dt>Included</dt><dd>${escapeHtml(order.scope.included.join('; ') || 'Not provided')}</dd></div><div><dt>Excluded</dt><dd>${escapeHtml(order.scope.excluded.join('; ') || 'Not provided')}</dd></div></dl></section>
    <button type="button" class="build-confirm" role="checkbox" aria-checked="false" data-build-confirm><span aria-hidden="true">○</span> I approve this work order and its protected boundaries.</button>`;
  }

  function render() {
    if (!dialog) return;
    dialog.querySelectorAll('[data-build-step]').forEach((panel) => { panel.hidden = Number(panel.dataset.buildStep) !== step; });
    dialog.querySelector('[data-build-step-label]').textContent = `Step ${step} of 4`;
    dialog.querySelector('[data-build-back]').hidden = step === 1;
    dialog.querySelector('[data-build-next]').hidden = step === 4;
    dialog.querySelector('[data-build-submit]').hidden = step !== 4;
    if (step === 2) dialog.querySelector('[data-existing-work-review]').innerHTML = existingWorkMarkup();
    if (step === 3) refreshSuggestions();
    if (step === 4) {
      const order = workOrder();
      dialog.querySelector('[data-build-review]').innerHTML = reviewMarkup(order);
      const submit = dialog.querySelector('[data-build-submit]');
      submit.disabled = order.workspaceReadiness.status !== 'ready' || order.packageReadiness.status !== 'ready' || !isConfirmed();
    }
  }

  function createDialog() {
    const node = document.createElement('dialog');
    node.className = 'build-request-dialog';
    node.setAttribute('aria-labelledby', 'build-request-title');
    node.innerHTML = `<form method="dialog" class="build-request-composer">
      <header><div><span class="eyebrow">Guided build request</span><h2 id="build-request-title">Build Your Idea</h2><p data-build-workspace></p></div><button type="button" class="build-dialog-close" data-build-close aria-label="Close">×</button></header>
      <div class="build-step-label" data-build-step-label></div>
      <section data-build-step="1"><h3>Tell us what you want to build</h3><p>Start in your own words. Founder OS will suggest the details needed to create a safe, buildable plan.</p>
        <label>What should we call this build?<input name="title" required placeholder="Example: Add member check-in"></label>
        <label>What kind of request is this?<select name="requestType"><option value="feature">New feature</option><option value="application">New application</option><option value="fix">Fix or improvement</option><option value="automation">Automation</option><option value="architecture">Architecture</option><option value="documentation">Research or documentation</option></select></label>
        <label>What should be true when it is finished?<textarea name="outcome" required placeholder="Example: Members can complete a daily check-in and see confirmation."></textarea></label>
        <label>Who is this for?<input name="intendedUser" required placeholder="Example: Natural Nation member"></label>
      </section>
      <section data-build-step="2" hidden><h3>Check what already exists</h3><p>Founder OS checks active and completed work so you can reuse, improve, or repair it instead of creating a duplicate.</p><div data-existing-work-review></div></section>
      <section data-build-step="3" hidden><h3>Shape the build with AI suggestions</h3><p>Choose the recommendations that fit. Every selected suggestion is added to the editable field, and you can always write your own.</p>
        <div class="build-field-grid">
          ${guidedField('included', 'What should be included?', { required: true, placeholder: 'Add your own item, one per line' })}
          ${guidedField('excluded', 'What should be left out?', { required: true, placeholder: 'Add your own item, one per line' })}
          ${guidedField('acceptanceCriteria', 'How will we know it works?', { required: true, placeholder: 'Add your own success measure' })}
          ${guidedField('protectedBoundaries', 'What must the AI team protect?', { required: true, placeholder: 'Example: No production deployment without Founder approval' })}
          ${guidedField('validationRequirements', 'How should the result be checked?', { required: true, placeholder: 'Example: Cross-browser tests pass' })}
          ${guidedField('designReferences', 'What design should it follow?')}
          <label>Does the AI team need access to anything?<textarea name="dependencies" placeholder="Examples: repository, API, document, or connected account"></textarea></label>
          <label>What important decision is still unresolved?<textarea name="unresolvedQuestions" placeholder="Leave blank when there are no remaining decisions"></textarea></label>
        </div>
        <label>How urgent is this?<select name="priority"><option value="medium">Medium</option><option value="low">Low</option><option value="high">High</option><option value="critical">Critical</option></select></label>
      </section>
      <section data-build-step="4" hidden><h3>Review your build plan</h3><p>Founder OS starts draft work only when the workspace and this request are both ready.</p><div data-build-review></div></section>
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
    existingWork = { status: 'not-checked', matches: [], decision: null };
    dialog.querySelector('form').reset();
    dialog.querySelector('[data-build-workspace]').textContent = `${current.name} · ${current.id}`;
    dialog.querySelector('[data-build-feedback]').textContent = '';
    refreshSuggestions();
    render();
    dialog.showModal();
  }

  document.addEventListener('input', (event) => {
    if (!dialog || !event.target.closest('.build-request-composer')) return;
    if (['requestType', 'outcome', 'title'].includes(event.target.name)) refreshSuggestions();
  });

  document.addEventListener('click', async (event) => {
    if (event.target.closest('[data-create-build]')) { open(); return; }
    if (!dialog) return;
    const suggestion = event.target.closest('[data-suggestion-field]');
    if (suggestion) { toggleSuggestion(suggestion); return; }
    if (event.target.closest('[data-existing-work-retry]')) { checkExistingWork(); return; }
    const existingDecision = event.target.closest('[data-existing-work-decision]');
    if (existingDecision) {
      existingWork.decision = existingDecision.dataset.existingWorkDecision;
      if (existingWork.decision === 'fix') field('requestType').value = 'fix';
      render(); return;
    }
    if (event.target.closest('[data-existing-work-cancel]')) { dialog.close(); return; }
    if (event.target.closest('[data-open-existing-work]')) {
      dialog.close();
      window.NNOSNavigationManager?.openView('ai', 'existing-work-match') || window.setWorkspace?.('ai');
      return;
    }
    if (event.target.closest('[data-build-close]')) { dialog.close(); return; }
    if (event.target.closest('[data-build-back]')) { step = Math.max(1, step - 1); render(); return; }
    if (event.target.closest('[data-build-next]')) {
      const currentPanel = dialog.querySelector(`[data-build-step="${step}"]`);
      const invalid = [...currentPanel.querySelectorAll('[required]')].find((input) => !input.value.trim());
      if (invalid) { invalid.reportValidity(); return; }
      if (step === 1) { step = 2; render(); await checkExistingWork(); return; }
      if (step === 2 && (existingWork.status === 'checking' || existingWork.status === 'unavailable' || !existingWork.decision)) {
        dialog.querySelector('[data-build-feedback]').textContent = existingWork.status === 'potential-match' ? 'Choose how to handle the possible existing work.' : 'Complete the existing-work check before continuing.';
        return;
      }
      step = Math.min(4, step + 1); render(); return;
    }
    const confirm = event.target.closest('[data-build-confirm]');
    if (confirm) {
      const checked = confirm.getAttribute('aria-checked') !== 'true';
      confirm.setAttribute('aria-checked', String(checked));
      confirm.querySelector('span').textContent = checked ? '✓' : '○';
      dialog.querySelector('[data-build-submit]').disabled = !checked;
      return;
    }
    const submit = event.target.closest('[data-build-submit]');
    if (submit) {
      const order = workOrder();
      if (order.workspaceReadiness.status !== 'ready' || order.packageReadiness.status !== 'ready' || !isConfirmed()) return;
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

  window.NNOSBuildRequestComposer = { open, workspaceChecks, packageChecks, suggestionsFor, similarity };
})();
