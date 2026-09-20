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

  function workspace() { return window.NNOSActiveWorkspace || null; }
  function field(name) { return dialog?.querySelector(`[name="${name}"]`); }
  function value(name) { return field(name)?.value.trim() || ''; }
  function isConfirmed() { return dialog?.querySelector('[data-build-confirm]')?.getAttribute('aria-checked') === 'true'; }

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
      workOrderVersion: '1.1.0', workspaceId: current.id,
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

  function reviewMarkup(order) {
    return `<div class="build-readiness-grid"><section><span class="eyebrow">Workspace Readiness</span>${checkList(order.workspaceReadiness)}</section><section><span class="eyebrow">Package Readiness</span>${checkList(order.packageReadiness)}</section></div>
    <section class="build-work-order"><span class="eyebrow">Review Work Order</span><h3>${escapeHtml(order.title || 'Untitled build')}</h3><dl><div><dt>Outcome</dt><dd>${escapeHtml(order.outcome || 'Not provided')}</dd></div><div><dt>For</dt><dd>${escapeHtml(order.intendedUser || 'Not provided')}</dd></div><div><dt>Delivery boundary</dt><dd>Draft preview only · no merge or production change</dd></div><div><dt>Included</dt><dd>${escapeHtml(order.scope.included.join('; ') || 'Not provided')}</dd></div><div><dt>Excluded</dt><dd>${escapeHtml(order.scope.excluded.join('; ') || 'Not provided')}</dd></div></dl></section>
    <button type="button" class="build-confirm" role="checkbox" aria-checked="false" data-build-confirm><span aria-hidden="true">○</span> I approve this work order and its protected boundaries.</button>`;
  }

  function render() {
    if (!dialog) return;
    dialog.querySelectorAll('[data-build-step]').forEach((panel) => { panel.hidden = Number(panel.dataset.buildStep) !== step; });
    dialog.querySelector('[data-build-step-label]').textContent = `Step ${step} of 3`;
    dialog.querySelector('[data-build-back]').hidden = step === 1;
    dialog.querySelector('[data-build-next]').hidden = step === 3;
    dialog.querySelector('[data-build-submit]').hidden = step !== 3;
    if (step === 2) refreshSuggestions();
    if (step === 3) {
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
      <section data-build-step="2" hidden><h3>Shape the build with AI suggestions</h3><p>Choose the recommendations that fit. Every selected suggestion is added to the editable field, and you can always write your own.</p>
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
      <section data-build-step="3" hidden><h3>Review your build plan</h3><p>Founder OS starts draft work only when the workspace and this request are both ready.</p><div data-build-review></div></section>
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
    if (event.target.closest('[data-build-close]')) { dialog.close(); return; }
    if (event.target.closest('[data-build-back]')) { step = Math.max(1, step - 1); render(); return; }
    if (event.target.closest('[data-build-next]')) {
      const currentPanel = dialog.querySelector(`[data-build-step="${step}"]`);
      const invalid = [...currentPanel.querySelectorAll('[required]')].find((input) => !input.value.trim());
      if (invalid) { invalid.reportValidity(); return; }
      step = Math.min(3, step + 1); render(); return;
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

  window.NNOSBuildRequestComposer = { open, workspaceChecks, packageChecks, suggestionsFor };
})();
