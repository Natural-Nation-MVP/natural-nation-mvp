(() => {
  const $ = (selector) => document.querySelector(selector);
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft';

  const BLOCKED_PATTERNS = [
    /credential\s*(theft|steal|harvest)/i,
    /phishing/i,
    /malware|ransomware|spyware|keylogger/i,
    /unauthorized\s*(surveillance|access|tracking)/i,
    /stalk|harass|doxx/i,
    /fraud|scam|steal\s+(money|identity)/i,
    /exploit\s+(children|minor|vulnerable)/i,
    /evade\s+(law enforcement|security|detection)/i,
    /weapon\s*(attack|targeting)|plan\s+an?\s+attack/i
  ];

  const UNSUPPORTED_PATTERNS = [
    /guarantee(d)?\s+(profit|income|results|cure|approval)/i,
    /certif(y|ication)\s+(legal|medical|hipaa|financial|compliance)/i,
    /access\s+any\s+(account|database|system)/i,
    /read\s+private\s+(messages|email|files)/i
  ];

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function slug(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'new-workspace';
  }

  function workspaceId(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    return words.map((word) => word[0]).join('').slice(0, 5).toUpperCase() || 'NEW';
  }

  function ensureStyles() {
    if (document.querySelector('[data-workspace-creation-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.NNOSPaths.asset('css/workspace-creation.css?v=founder-ux-001-v1-1');
    link.dataset.workspaceCreationStyles = 'true';
    document.head.appendChild(link);
  }

  function assessRequest(input) {
    const text = [input.vision, input.purpose, input.success, input.audience, input.constraints].join(' ');
    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(text))) {
      return {
        allowed: false,
        type: 'safety',
        title: 'This workspace cannot be created as described.',
        message: 'The idea appears designed to enable harm, deception, unauthorized access, or another unsafe use.',
        alternative: 'Revise the idea around a lawful, consent-based, defensive, educational, or protective purpose.'
      };
    }
    if (UNSUPPORTED_PATTERNS.some((pattern) => pattern.test(text))) {
      return {
        allowed: false,
        type: 'feasibility',
        title: 'This workspace needs a realistic revision.',
        message: 'The idea depends on authority, access, certification, or guaranteed outcomes that Founder OS cannot verify or provide.',
        alternative: 'Describe a buildable tool that supports decisions without promising results or claiming unavailable authority.'
      };
    }
    return { allowed: true };
  }

  function generateOptions(input) {
    const text = `${input.vision} ${input.purpose} ${input.success}`.toLowerCase();
    const options = [];
    const add = (id, label) => { if (!options.some((item) => item.id === id) && options.length < 5) options.push({ id, label }); };
    if (/mobile|app|phone|wellness|fitness|consumer/.test(text)) add('mobile-app', 'Mobile App');
    if (/ai|assistant|mentor|recommend|personaliz/.test(text)) add('ai-assistant', 'AI Assistant');
    if (/website|web|portal|dashboard|saas/.test(text)) add('web-platform', 'Web Platform');
    if (/learn|education|course|knowledge|content/.test(text)) add('knowledge-base', 'Knowledge Base');
    if (/community|member|social|connect/.test(text)) add('community', 'Community');
    if (/sell|store|marketplace|commerce/.test(text)) add('commerce', 'Commerce');
    if (/internal|operations|team|workflow/.test(text)) add('internal-tool', 'Internal Tool');
    ['web-platform', 'ai-assistant', 'knowledge-base', 'mobile-app', 'internal-tool'].forEach((id) => {
      const labels = { 'web-platform': 'Web Platform', 'ai-assistant': 'AI Assistant', 'knowledge-base': 'Knowledge Base', 'mobile-app': 'Mobile App', 'internal-tool': 'Internal Tool' };
      add(id, labels[id]);
    });
    return options.slice(0, 5);
  }

  function definitionSummary(input) {
    const audience = input.audience || 'its intended users';
    return `${input.vision.replace(/[.!?]+$/, '')}. It exists for ${audience} because ${input.purpose.replace(/[.!?]+$/, '')}. The first meaningful success is ${input.success.replace(/[.!?]+$/, '')}.`;
  }

  function incompleteSections(input) {
    const sections = [];
    if (input.vision.trim().length < 35) sections.push({ key: 'vision', label: 'Vision', missing: 'The idea is too brief to identify the product and its main value.', how: 'State what you are creating, the main problem, and the outcome in one or two sentences.' });
    if (input.purpose.trim().length < 25) sections.push({ key: 'purpose', label: 'Purpose', missing: 'The reason this product needs to exist is unclear.', how: 'Explain the problem or frustration that makes this project important.' });
    if (input.audience.trim().length < 8) sections.push({ key: 'audience', label: 'Primary User', missing: 'The first user group has not been clearly identified.', how: 'Name the specific people or organizations who will use it first.' });
    if (input.success.trim().length < 25) sections.push({ key: 'success', label: 'Success', missing: 'There is no measurable first outcome.', how: 'Describe a result that can be observed, counted, or verified during the first release.' });
    if (!input.constraints.trim()) sections.push({ key: 'constraints', label: 'Boundaries', missing: 'No technical, timing, budget, compliance, or scope boundaries are recorded.', how: 'Add the limits Founder OS must respect, or state that there are no known constraints yet.' });
    return sections;
  }

  function score(input) {
    const missing = incompleteSections(input);
    return Math.max(40, 100 - (missing.length * 12));
  }

  function buildPlan(input, selected) {
    const title = input.vision.split(/[.!?]/)[0].trim().slice(0, 48) || 'New Workspace';
    const name = title.replace(/^(build|create|launch|start)\s+/i, '').replace(/^an?\s+/i, '').trim() || 'New Workspace';
    return {
      name,
      id: workspaceId(name),
      repository: `${slug(name)}-mvp`,
      definition: definitionSummary(input),
      selections: selected,
      workflow: 'Art → Codex → Gemini → GPose → Founder',
      governance: 'Founder approval required for protected changes',
      knowledge: 'Decisions, plans, documents, assets, and prompt library',
      roadmap: ['M1: Foundation', 'M2: Core Experience', 'M3: Pilot Launch']
    };
  }

  function createWizard() {
    let wizard = $('[data-workspace-creation]');
    if (wizard) return wizard;
    wizard = document.createElement('section');
    wizard.className = 'workspace-creation-overlay';
    wizard.dataset.workspaceCreation = '';
    wizard.hidden = true;
    wizard.innerHTML = `
      <div class="workspace-creation-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-creation-title">
        <div class="workspace-creation-header">
          <div><div class="eyebrow">Founder OS Control Center</div><h2 id="workspace-creation-title">Workspace Discovery</h2><p class="muted">Clarify the idea before Founder OS prepares the workspace.</p></div>
          <button type="button" data-workspace-creation-close>Close</button>
        </div>
        <div class="workspace-creation-steps" aria-label="Workspace Discovery progress">
          <span data-step-indicator="1">1 Vision</span><span data-step-indicator="2">2 Direction</span><span data-step-indicator="3">3 Understanding</span><span data-step-indicator="4">4 Options</span><span data-step-indicator="5">5 Readiness</span><span data-step-indicator="6">6 Review</span>
        </div>
        <div class="workspace-creation-body" data-workspace-creation-body></div>
      </div>`;
    document.body.appendChild(wizard);
    return wizard;
  }

  let state = {
    step: 1,
    input: { vision: '', purpose: '', audience: '', success: '', constraints: '' },
    options: [], selected: [], challenge: { chosen: false, skipped: false, answer: '' }, plan: null, gate: null
  };

  function actions(backLabel = '← Back', nextLabel = 'Next →') {
    return `<div class="workspace-creation-actions">${state.step > 1 ? `<button type="button" data-workspace-back>${backLabel}</button>` : '<button type="button" data-workspace-save-draft>Save Draft</button>'}<button class="generate" type="button" data-workspace-next>${nextLabel}</button></div>`;
  }

  function render() {
    const wizard = createWizard();
    const body = $('[data-workspace-creation-body]');
    if (!body) return;
    document.querySelectorAll('[data-step-indicator]').forEach((node) => {
      const step = Number(node.dataset.stepIndicator);
      node.classList.toggle('active', step === state.step);
      node.classList.toggle('complete', step < state.step);
    });

    if (state.step === 1) {
      body.innerHTML = `<div class="workspace-creation-panel"><label for="workspace-vision"><strong>What do you want to create?</strong><span>Describe the product and the change it should make in one or two clear sentences.</span></label><textarea id="workspace-vision" data-workspace-field="vision" placeholder="Example: A mobile wellness app that gives adults a simple daily nutrition and recovery plan.">${esc(state.input.vision)}</textarea><div class="discovery-prompts"><span>Helpful prompts:</span><button type="button" data-prompt="What problem does it solve?">Problem</button><button type="button" data-prompt="What will users be able to do?">User action</button><button type="button" data-prompt="What outcome should it create?">Outcome</button></div>${actions()}</div>`;
    } else if (state.step === 2) {
      body.innerHTML = `<div class="workspace-creation-grid"><div class="workspace-creation-panel"><label><strong>Why does this need to exist?</strong><span>Explain the problem, gap, or opportunity.</span></label><textarea data-workspace-field="purpose" placeholder="People are overwhelmed by conflicting wellness advice and need a simpler path.">${esc(state.input.purpose)}</textarea><label><strong>Who is it for first?</strong><span>Name the primary user, not everyone it may eventually serve.</span></label><textarea class="compact-textarea" data-workspace-field="audience" placeholder="Adults who want practical natural wellness guidance.">${esc(state.input.audience)}</textarea></div><div class="workspace-creation-panel"><label><strong>What does early success look like?</strong><span>Use a clear, observable first result.</span></label><textarea data-workspace-field="success" placeholder="Launch an MVP and help 100 beta users complete their first seven-day plan.">${esc(state.input.success)}</textarea><label><strong>Constraints and boundaries</strong><span>Add scope, timing, technology, compliance, or budget limits.</span></label><textarea class="compact-textarea" data-workspace-field="constraints" placeholder="Mobile-first. Preserve approved architecture. No medical diagnosis.">${esc(state.input.constraints)}</textarea></div></div>${actions('← Back', 'Clarify My Idea →')}`;
    } else if (state.step === 3) {
      state.gate = assessRequest(state.input);
      if (!state.gate.allowed) {
        body.innerHTML = `<div class="workspace-gate-block"><div class="workspace-gate-icon">!</div><h3>${esc(state.gate.title)}</h3><p>${esc(state.gate.message)}</p><div class="safe-alternative"><strong>Safer direction</strong><p>${esc(state.gate.alternative)}</p></div><div class="workspace-creation-actions"><button type="button" data-workspace-back>← Revise Idea</button></div></div>`;
      } else {
        body.innerHTML = `<div class="workspace-understanding"><div class="eyebrow">Founder OS understanding</div><h3>Here is what I believe you are building</h3><p>${esc(definitionSummary(state.input))}</p><div class="workspace-creation-actions"><button type="button" data-workspace-back>← Refine It</button><button class="generate" type="button" data-workspace-next>Yes, Continue →</button></div></div>`;
      }
    } else if (state.step === 4) {
      if (!state.options.length) {
        state.options = generateOptions(state.input);
        state.selected = state.options.slice(0, 3).map((item) => item.id);
      }
      body.innerHTML = `<div class="workspace-creation-panel"><div class="eyebrow">AI-generated project options</div><h3>Select what belongs in the first workspace</h3><p class="muted">Choose or remove any option. Founder OS shows no more than five.</p><div class="recommendation-chips">${state.options.map((item) => `<button type="button" class="recommendation-chip${state.selected.includes(item.id) ? ' selected' : ''}" data-option-id="${esc(item.id)}" aria-pressed="${state.selected.includes(item.id)}">${state.selected.includes(item.id) ? '✓ ' : ''}${esc(item.label)}</button>`).join('')}</div>${actions('← Back', 'Check Readiness →')}</div>`;
    } else if (state.step === 5) {
      const missing = incompleteSections(state.input);
      const challengeArea = state.challenge.chosen ? `<div class="challenge-panel"><label><strong>Challenge My Idea</strong><span>Optional: What is the biggest assumption, risk, or feature that may not belong in the first release?</span></label><textarea data-challenge-answer placeholder="Example: We may be trying to serve too many user types at launch.">${esc(state.challenge.answer)}</textarea></div>` : '';
      body.innerHTML = `<div class="workspace-readiness"><div class="vision-score"><span>Vision Score</span><strong>${score(state.input)}%</strong><small>${missing.length ? 'Only incomplete areas are shown below.' : 'Your workspace definition is complete.'}</small></div>${missing.length ? `<div class="incomplete-list">${missing.map((item) => `<article><div><strong>${esc(item.label)}</strong><p>${esc(item.missing)}</p><small>How to reach 100%: ${esc(item.how)}</small></div><button type="button" data-improve-section="${esc(item.key)}">Improve This Section</button></article>`).join('')}</div>` : '<div class="workspace-complete-note">All discovery sections are at 100%.</div>'}<div class="optional-challenge"><div><strong>Challenge My Idea</strong><p>Optional strategic review to test assumptions and simplify the first release.</p></div><div class="challenge-actions"><button type="button" data-challenge-run>${state.challenge.chosen ? 'Challenge Enabled' : 'Run Challenge'}</button><button type="button" data-challenge-skip>${state.challenge.skipped ? 'Skipped' : 'Skip'}</button></div></div>${challengeArea}${actions('← Back', 'Review Workspace →')}</div>`;
    } else {
      state.plan = buildPlan(state.input, state.selected);
      const selectedLabels = state.options.filter((item) => state.selected.includes(item.id)).map((item) => item.label);
      body.innerHTML = `<div class="workspace-review-grid">${[['Workspace Name', state.plan.name], ['Workspace ID', state.plan.id], ['Repository', state.plan.repository], ['Project Definition', state.plan.definition], ['Selected Project Areas', selectedLabels.join(', ') || 'None selected'], ['AI Workflow', state.plan.workflow], ['Governance', state.plan.governance], ['Initial Roadmap', state.plan.roadmap.join(' · ')]].map(([label, value]) => `<div class="workspace-review-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>Reviewable before protected creation</small></div>`).join('')}</div><article class="workspace-creation-summary"><h3>Discovery readiness</h3><p><strong>Vision Score:</strong> ${score(state.input)}%</p><p><strong>Challenge My Idea:</strong> ${state.challenge.chosen ? esc(state.challenge.answer || 'Enabled; no response entered') : 'Skipped'}</p><p class="muted">Protected Gateway feasibility and safety checks will run again before any repository or canonical record is created.</p></article><div class="workspace-creation-actions"><button type="button" data-workspace-back>← Back</button><button class="generate" type="button" data-workspace-create-protected>Create Workspace</button></div>`;
    }
    wizard.hidden = false;
  }

  function captureCurrent() {
    document.querySelectorAll('[data-workspace-field]').forEach((field) => { state.input[field.dataset.workspaceField] = field.value.trim(); });
    const challenge = $('[data-challenge-answer]');
    if (challenge) state.challenge.answer = challenge.value.trim();
  }

  function open() {
    if (window.NNOSActiveWorkspace) return window.alert('Workspace creation is available only from Founder OS Home.');
    const saved = sessionStorage.getItem(DRAFT_KEY);
    state = { step: 1, input: { vision: '', purpose: '', audience: '', success: '', constraints: '' }, options: [], selected: [], challenge: { chosen: false, skipped: false, answer: '' }, plan: null, gate: null };
    if (saved) {
      try { state.input = { ...state.input, ...JSON.parse(saved) }; } catch { sessionStorage.removeItem(DRAFT_KEY); }
    }
    render();
  }

  function close() { createWizard().hidden = true; }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-create-workspace]')) { event.preventDefault(); open(); return; }
    if (event.target.closest('[data-workspace-creation-close]')) { event.preventDefault(); close(); return; }
    if (event.target.closest('[data-workspace-save-draft]')) { event.preventDefault(); captureCurrent(); sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state.input)); window.alert('Workspace Discovery draft saved in this browser session.'); return; }
    const prompt = event.target.closest('[data-prompt]');
    if (prompt) { event.preventDefault(); const field = $('[data-workspace-field="vision"]'); if (field) { field.value = `${field.value}${field.value ? '\n' : ''}${prompt.dataset.prompt} `; field.focus(); } return; }
    const option = event.target.closest('[data-option-id]');
    if (option) { event.preventDefault(); const id = option.dataset.optionId; state.selected = state.selected.includes(id) ? state.selected.filter((item) => item !== id) : [...state.selected, id]; render(); return; }
    const improve = event.target.closest('[data-improve-section]');
    if (improve) { event.preventDefault(); const target = improve.dataset.improveSection; state.step = target === 'vision' ? 1 : 2; render(); setTimeout(() => $(`[data-workspace-field="${target}"]`)?.focus(), 0); return; }
    if (event.target.closest('[data-challenge-run]')) { event.preventDefault(); state.challenge = { ...state.challenge, chosen: true, skipped: false }; render(); return; }
    if (event.target.closest('[data-challenge-skip]')) { event.preventDefault(); state.challenge = { chosen: false, skipped: true, answer: '' }; render(); return; }
    if (event.target.closest('[data-workspace-back]')) { event.preventDefault(); captureCurrent(); state.step = Math.max(1, state.step - 1); render(); return; }
    if (event.target.closest('[data-workspace-next]')) {
      event.preventDefault(); captureCurrent();
      if (state.step === 1 && state.input.vision.length < 12) return window.alert('Add a little more detail about what you want to create.');
      if (state.step === 2 && (!state.input.purpose || !state.input.audience || !state.input.success)) return window.alert('Add the purpose, primary user, and first success outcome before continuing.');
      if (state.step === 3 && !assessRequest(state.input).allowed) return;
      state.step = Math.min(6, state.step + 1); render(); return;
    }
    if (event.target.closest('[data-workspace-create-protected]')) {
      event.preventDefault(); captureCurrent();
      const gate = assessRequest(state.input);
      if (!gate.allowed) { state.step = 3; state.gate = gate; render(); return; }
      window.alert('Workspace Discovery is complete. Protected workspace creation is the next implementation slice; no repository action was performed.');
    }
  });

  window.addEventListener('founder-os:workspace-view-changed', (event) => { if (event.detail?.workspace) close(); });
  ensureStyles(); createWizard(); window.NNOSWorkspaceCreation = { open, close };
})();