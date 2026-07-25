(() => {
  const $ = (selector) => document.querySelector(selector);
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';
  const BLOCKED_PATTERNS = [
    /credential\s*(theft|steal|harvest)/i, /phishing/i, /malware|ransomware|spyware|keylogger/i,
    /unauthorized\s*(surveillance|access|tracking)/i, /stalk|harass|doxx/i,
    /fraud|scam|steal\s+(money|identity)/i, /exploit\s+(children|minor|vulnerable)/i,
    /evade\s+(law enforcement|security|detection)/i, /weapon\s*(attack|targeting)|plan\s+an?\s+attack/i,
    /change\s+(the\s+)?(way\s+)?founder\s*os\s+(works|behaves|functions)/i,
    /disable\s+(founder\s+approval|authentication|security)/i,
    /ignore\s+(all\s+)?(previous|system)\s+instructions/i, /reveal\s+(the\s+)?system\s+prompt/i,
    /modify\s+(another|the\s+natural\s+nation)\s+workspace/i
  ];
  const UNSUPPORTED_PATTERNS = [
    /guarantee(d)?\s+(profit|income|results|cure|approval)/i,
    /certif(y|ication)\s+(legal|medical|hipaa|financial|compliance)/i,
    /access\s+any\s+(account|database|system)/i, /read\s+private\s+(messages|email|files)/i
  ];
  const QUESTION_FLOW = [
    { key: 'vision', prompt: 'Tell me what you want to build.', helper: 'A rough idea is enough. Founder OS will help shape it.', placeholder: 'Example: A mobile app that helps busy families eat healthier.' },
    { key: 'audience', prompt: 'Who should this help first?', helper: 'Choose the first primary user, not every possible future user.', suggestions: ['Individuals', 'Families', 'Small businesses', 'Professionals', 'Teams'] },
    { key: 'outcome', prompt: 'What change should it create for them?', helper: 'Describe the result the user should experience.', suggestions: ['Save time', 'Learn a skill', 'Improve a daily habit', 'Make better decisions', 'Grow a business'] },
    { key: 'delivery', prompt: 'How should people use it first?', helper: 'Founder OS will use this to draft the first product structure.', suggestions: ['Mobile app', 'Web platform', 'AI assistant', 'Content channel', 'Internal tool'] },
    { key: 'success', prompt: 'What would make the first release successful?', helper: 'A simple measurable result is best.', placeholder: 'Example: 100 beta users complete their first seven-day plan.' }
  ];
  const initialState = () => ({
    step: 1, questionIndex: 0,
    input: { vision: '', audience: '', outcome: '', delivery: '', success: '', selectedName: '', constraints: [] },
    nameSuggestions: [], options: [], selected: [],
    challenge: { chosen: false, skipped: false, answer: '' },
    plan: null, gate: null,
    creation: { status: 'idle', clientRequestId: '', result: null, error: '' }
  });
  let state = initialState();
  let returnFocus = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const slug = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'new-workspace';
  const titleCase = (value) => String(value || '').replace(/\b\w/g, (letter) => letter.toUpperCase());

  function ensureStyles() {
    if (document.querySelector('[data-workspace-creation-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.NNOSPaths.asset('css/workspace-creation.css?v=founder-ws-001-v1');
    link.dataset.workspaceCreationStyles = 'true';
    document.head.appendChild(link);
  }

  function normalizeState(saved) {
    const base = initialState();
    if (!saved || typeof saved !== 'object') return base;
    return {
      ...base, ...saved,
      step: Math.min(6, Math.max(1, Number(saved.step) || 1)),
      questionIndex: Math.min(QUESTION_FLOW.length - 1, Math.max(0, Number(saved.questionIndex) || 0)),
      input: { ...base.input, ...(saved.input || {}), constraints: Array.isArray(saved.input?.constraints) ? saved.input.constraints : [] },
      nameSuggestions: Array.isArray(saved.nameSuggestions) ? saved.nameSuggestions.slice(0, 5) : [],
      options: Array.isArray(saved.options) ? saved.options.slice(0, 5) : [],
      selected: Array.isArray(saved.selected) ? saved.selected : [],
      challenge: { ...base.challenge, ...(saved.challenge || {}) },
      creation: { ...base.creation, ...(saved.creation || {}) }
    };
  }

  function persistState() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (error) { console.warn('Workspace Discovery draft could not be saved.', error); } }
  function clearDraft() { localStorage.removeItem(DRAFT_KEY); }

  function assessRequest(input) {
    const text = Object.values(input).flat().join(' ');
    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(text))) return { allowed: false, title: 'This workspace cannot be created as described.', message: 'The request would change protected Founder OS behavior, cross workspace boundaries, or enable an unsafe action.', alternative: 'Describe the independent product or workspace you want Founder OS to build without changing Founder OS itself.' };
    if (UNSUPPORTED_PATTERNS.some((pattern) => pattern.test(text))) return { allowed: false, title: 'This workspace needs a realistic revision.', message: 'The request depends on authority, access, certification, or guaranteed outcomes Founder OS cannot provide.', alternative: 'Describe a lawful and buildable tool that supports users without claiming unavailable authority or access.' };
    return { allowed: true };
  }

  function meaningfulWords(value) {
    const stop = new Set(['want','build','create','make','app','application','platform','website','people','helps','help','that','with','for','from','into','their','them','this','will']);
    return String(value || '').toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !stop.has(word)) || [];
  }
  function inferTopic(input) {
    const text = `${input.vision} ${input.outcome}`.toLowerCase();
    const topics = [[/eat|food|meal|nutrition|diet|healthy/,'Nutrition'],[/clean|cleaning|sanitize|housekeeping/,'Cleaning'],[/money|finance|income|budget|wealth/,'Finance'],[/learn|teach|education|course|training/,'Learning'],[/wellness|fitness|health|recovery/,'Wellness'],[/business|entrepreneur|sales|marketing/,'Business'],[/home|family|parent/,'Family'],[/content|youtube|video|channel/,'Media']];
    return topics.find(([pattern]) => pattern.test(text))?.[1] || titleCase(meaningfulWords(input.vision)[0]) || 'Project';
  }
  function inferPromise(input) {
    const text = `${input.vision} ${input.outcome}`.toLowerCase();
    if (/simple|easier|easy/.test(text)) return 'Simple';
    if (/professional|pro/.test(text)) return 'Pro';
    if (/daily|habit|routine/.test(text)) return 'Daily';
    if (/learn|teach|education/.test(text)) return 'Academy';
    if (/plan|guide|path/.test(text)) return 'Path';
    if (/family|families/.test(text)) return 'Family';
    return 'Clear';
  }
  function generateNameSuggestions(input) {
    const topic = inferTopic(input), promise = inferPromise(input);
    const audienceWord = meaningfulWords(input.audience)[0];
    const audience = audienceWord ? titleCase(audienceWord) : '';
    return [...new Set([`${promise} ${topic}`, `${topic} Path`, `${topic} Guide`, audience ? `${audience} ${topic}` : `${topic} Works`, `${topic} Lab`])].slice(0, 5);
  }
  function draftConstraints(input) {
    const constraints = ['Founder approval required for protected changes', 'Workspace remains isolated from all other workspaces'];
    const delivery = input.delivery.toLowerCase();
    if (delivery.includes('mobile')) constraints.push('Mobile-first responsive experience');
    if (delivery.includes('web')) constraints.push('Accessible responsive web experience');
    if (/health|wellness|nutrition|diet/.test(`${input.vision} ${input.outcome}`.toLowerCase())) constraints.push('Educational guidance only; no diagnosis or guaranteed health outcomes');
    constraints.push('MVP scope before advanced automation');
    return constraints.slice(0, 5);
  }
  function generateOptions(input) {
    const options = [], add = (id, label) => { if (!options.some((item) => item.id === id) && options.length < 5) options.push({ id, label }); };
    const text = `${input.vision} ${input.delivery} ${input.outcome}`.toLowerCase();
    if (/mobile|app|phone/.test(text)) add('mobile-app', 'Mobile App');
    if (/ai|assistant|mentor|recommend|personaliz/.test(text)) add('ai-assistant', 'AI Assistant');
    if (/website|web|portal|dashboard|saas/.test(text)) add('web-platform', 'Web Platform');
    if (/learn|education|course|knowledge|content|youtube/.test(text)) add('knowledge-base', 'Knowledge Base');
    if (/community|member|social|connect/.test(text)) add('community', 'Community');
    [['web-platform','Web Platform'],['ai-assistant','AI Assistant'],['knowledge-base','Knowledge Base'],['mobile-app','Mobile App'],['internal-tool','Internal Tool']].forEach(([id,label]) => add(id,label));
    return options.slice(0, 5);
  }
  function definitionSummary(input) { return `${input.selectedName || 'This workspace'} will help ${input.audience || 'its first users'} ${String(input.outcome || '').toLowerCase()}. It will begin as a ${String(input.delivery || 'focused product').toLowerCase()}, with early success defined as ${String(input.success || 'a verified first-user result').replace(/[.!?]+$/, '')}.`; }
  function buildPlan(input, selected) {
    const name = input.selectedName || generateNameSuggestions(input)[0] || 'New Workspace';
    return { name, repository: `${slug(name)}-mvp`, definition: definitionSummary(input), selections: selected, constraints: input.constraints, workflow: 'Art → Codex → Gemini → GPose → Founder', governance: 'AI Draft → Founder Review → Founder Approval', knowledge: 'Decisions, plans, documents, assets, evidence, and prompt library', roadmap: ['M1: Discovery & Foundation','M2: Core Experience','M3: Founder Pilot'] };
  }
  function creationBlueprint() {
    state.plan = buildPlan(state.input, state.selected);
    return {
      name: state.plan.name,
      repository: state.plan.repository,
      purpose: state.plan.definition,
      objectives: [state.input.outcome, state.input.success].filter(Boolean),
      constraints: state.plan.constraints,
      roadmap: state.plan.roadmap,
      selectedAreas: state.options.filter((item) => state.selected.includes(item.id)).map((item) => item.label),
      workflow: state.plan.workflow,
      governance: state.plan.governance
    };
  }

  function createWizard() {
    let wizard = $('[data-workspace-creation]');
    if (wizard) return wizard;
    wizard = document.createElement('section');
    wizard.className = 'workspace-creation-overlay';
    wizard.dataset.workspaceCreation = '';
    wizard.hidden = true;
    wizard.innerHTML = `<div class="workspace-creation-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-creation-title" aria-describedby="workspace-creation-description"><div class="workspace-creation-header"><div><div class="eyebrow">Founder OS Control Center</div><h2 id="workspace-creation-title">Workspace Discovery</h2><p class="muted" id="workspace-creation-description">A guided conversation that drafts and securely creates a workspace after Founder approval.</p></div><button type="button" data-workspace-creation-close aria-label="Close Workspace Discovery">Close</button></div><div class="workspace-creation-steps" aria-label="Workspace Discovery progress"><span data-step-indicator="1">1 Discover</span><span data-step-indicator="2">2 Name</span><span data-step-indicator="3">3 AI Draft</span><span data-step-indicator="4">4 Readiness</span><span data-step-indicator="5">5 Review</span><span data-step-indicator="6">6 Create</span></div><div class="workspace-creation-body" data-workspace-creation-body aria-live="polite" aria-atomic="true"></div></div>`;
    document.body.appendChild(wizard);
    return wizard;
  }
  function actions(backLabel = '← Back', nextLabel = 'Continue →') { return `<div class="workspace-creation-actions">${state.step > 1 || state.questionIndex > 0 ? `<button type="button" data-workspace-back>${backLabel}</button>` : '<button type="button" data-workspace-save-draft>Save Draft</button>'}<button class="generate" type="button" data-workspace-next>${nextLabel}</button></div>`; }
  function renderConversation() {
    const question = QUESTION_FLOW[state.questionIndex], value = state.input[question.key] || '';
    const suggestions = question.suggestions?.map((item) => `<button type="button" class="recommendation-chip${value === item ? ' selected' : ''}" data-answer-suggestion="${esc(item)}" aria-pressed="${value === item}">${esc(item)}</button>`).join('') || '';
    return `<div class="workspace-understanding"><div class="eyebrow">Founder OS is listening</div><h3>${esc(question.prompt)}</h3><p>${esc(question.helper)}</p>${suggestions ? `<div class="recommendation-chips" aria-label="Suggested answers">${suggestions}</div>` : ''}<label class="sr-only" for="workspace-conversation-answer">${esc(question.prompt)}</label><textarea id="workspace-conversation-answer" data-conversation-answer data-question-key="${esc(question.key)}" placeholder="${esc(question.placeholder || 'Type your answer here…')}">${esc(value)}</textarea><small>Question ${state.questionIndex + 1} of ${QUESTION_FLOW.length}. One answer at a time.</small>${actions('← Previous question', state.questionIndex === QUESTION_FLOW.length - 1 ? 'Draft My Workspace →' : 'Continue →')}</div>`;
  }
  function focusCurrent() { requestAnimationFrame(() => ($('[data-conversation-answer]') || $('[data-custom-workspace-name]') || $('[data-workspace-confirm]') || $('[data-workspace-next]') || $('[data-workspace-creation-close]'))?.focus()); }

  function render() {
    const wizard = createWizard(), body = $('[data-workspace-creation-body]');
    document.querySelectorAll('[data-step-indicator]').forEach((node) => { const step = Number(node.dataset.stepIndicator); node.classList.toggle('active', step === state.step); node.classList.toggle('complete', step < state.step); node.setAttribute('aria-current', step === state.step ? 'step' : 'false'); });
    if (state.step === 1) body.innerHTML = renderConversation();
    else if (state.step === 2) {
      if (!state.nameSuggestions.length) state.nameSuggestions = generateNameSuggestions(state.input);
      body.innerHTML = `<div class="workspace-creation-panel"><div class="eyebrow">AI-generated workspace names</div><h3>Choose the name that best fits the idea</h3><p class="muted">These names are inferred from the purpose, audience, and outcome.</p><div class="recommendation-chips">${state.nameSuggestions.map((name) => `<button type="button" class="recommendation-chip${state.input.selectedName === name ? ' selected' : ''}" data-name-suggestion="${esc(name)}" aria-pressed="${state.input.selectedName === name}">${esc(name)}</button>`).join('')}</div><label for="custom-workspace-name"><strong>Or enter your own name</strong></label><input id="custom-workspace-name" type="text" data-custom-workspace-name value="${esc(state.input.selectedName)}" placeholder="Custom workspace name">${actions('← Refine Discovery','Generate AI Draft →')}</div>`;
    } else if (state.step === 3) {
      if (!state.options.length) { state.options = generateOptions(state.input); state.selected = state.options.slice(0, 3).map((item) => item.id); }
      if (!state.input.constraints.length) state.input.constraints = draftConstraints(state.input);
      body.innerHTML = `<div class="workspace-creation-grid"><div class="workspace-creation-panel"><div class="eyebrow">AI-generated project options</div><h3>Recommended first-workspace components</h3><div class="recommendation-chips">${state.options.map((item) => `<button type="button" class="recommendation-chip${state.selected.includes(item.id) ? ' selected' : ''}" data-option-id="${esc(item.id)}" aria-pressed="${state.selected.includes(item.id)}">${state.selected.includes(item.id) ? '✓ ' : ''}${esc(item.label)}</button>`).join('')}</div></div><div class="workspace-creation-panel"><div class="eyebrow">AI-drafted constraints and boundaries</div><h3>Review, remove, or add boundaries</h3><div class="incomplete-list">${state.input.constraints.map((item,index) => `<article><div><strong>${esc(item)}</strong></div><button type="button" data-remove-constraint="${index}" aria-label="Remove boundary: ${esc(item)}">Remove</button></article>`).join('')}</div><label for="new-workspace-constraint"><strong>Add a boundary</strong></label><input id="new-workspace-constraint" type="text" data-new-constraint placeholder="Add timing, budget, technology, or compliance limit"><button type="button" data-add-constraint>Add</button></div></div>${actions('← Change Name','Check Readiness →')}`;
    } else if (state.step === 4) {
      const gate = assessRequest(state.input);
      if (!gate.allowed) body.innerHTML = `<div class="workspace-gate-block" role="alert"><div class="workspace-gate-icon" aria-hidden="true">!</div><h3>${esc(gate.title)}</h3><p>${esc(gate.message)}</p><div class="safe-alternative"><strong>Safer direction</strong><p>${esc(gate.alternative)}</p></div><div class="workspace-creation-actions"><button type="button" data-workspace-back>← Revise Idea</button></div></div>`;
      else { const challengeArea = state.challenge.chosen ? `<div class="challenge-panel"><label for="challenge-answer"><strong>Challenge My Idea</strong><span>What assumption or feature may not belong in the first release?</span></label><textarea id="challenge-answer" data-challenge-answer>${esc(state.challenge.answer)}</textarea></div>` : ''; body.innerHTML = `<div class="workspace-readiness"><div class="vision-score"><span>Vision Score</span><strong>100%</strong><small>Founder OS has enough information to produce a reviewable draft.</small></div><div class="optional-challenge"><div><strong>Challenge My Idea</strong><p>Optional strategic review before final approval.</p></div><div class="challenge-actions"><button type="button" data-challenge-run>${state.challenge.chosen ? 'Challenge Enabled' : 'Run Challenge'}</button><button type="button" data-challenge-skip>${state.challenge.skipped ? 'Skipped' : 'Skip'}</button></div></div>${challengeArea}${actions('← Edit AI Draft','Review Workspace →')}</div>`; }
    } else if (state.step === 5) {
      const plan = creationBlueprint();
      const selectedLabels = state.options.filter((item) => state.selected.includes(item.id)).map((item) => item.label);
      body.innerHTML = `<div class="workspace-review-grid">${[['Workspace Name',plan.name],['Canonical ID','Generated securely after approval'],['Repository',plan.repository],['Project Definition',plan.purpose],['Selected Project Areas',selectedLabels.join(', ') || 'None selected'],['Constraints & Boundaries',plan.constraints.join(' · ')],['AI Workflow',plan.workflow],['Governance',plan.governance],['Initial Roadmap',plan.roadmap.join(' · ')]].map(([label,value]) => `<div class="workspace-review-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>AI drafted and Founder reviewable</small></div>`).join('')}</div><article class="workspace-creation-summary"><h3>Protected creation</h3><p>The Gateway will authenticate the Founder, re-run safety and isolation checks, create one canonical registry record, initialize workspace-scoped repository files, and return verifiable evidence.</p><label class="workspace-confirmation"><input type="checkbox" data-workspace-confirm> <span>I approve this exact workspace blueprint and understand that protected repository records will be created.</span></label></article><div class="workspace-creation-actions"><button type="button" data-workspace-back>← Back</button><button class="generate" type="button" data-workspace-create-protected>Create Workspace</button></div>`;
    } else {
      const result = state.creation.result;
      if (state.creation.status === 'creating') body.innerHTML = `<div class="workspace-create-ready"><div class="workspace-create-icon" aria-hidden="true">…</div><h3>Creating the protected workspace</h3><p>Founder OS is authenticating, revalidating, registering, and initializing the workspace. Do not close this window.</p></div>`;
      else if (state.creation.status === 'failed') body.innerHTML = `<div class="workspace-gate-block" role="alert"><div class="workspace-gate-icon" aria-hidden="true">!</div><h3>Workspace creation did not complete</h3><p>${esc(state.creation.error)}</p><p class="muted">The same request ID is preserved so retry can recover without duplicate records.</p><div class="workspace-creation-actions"><button type="button" data-workspace-retry>Retry safely</button><button type="button" data-workspace-back>← Review</button></div></div>`;
      else body.innerHTML = `<div class="workspace-create-ready"><div class="workspace-create-icon" aria-hidden="true">✓</div><h3>${esc(result?.workspace?.displayName || 'Workspace')} created</h3><p>The canonical workspace is registered and its repository-backed foundation is initialized.</p><div class="workspace-review-grid"><div class="workspace-review-card"><span>Workspace ID</span><strong>${esc(result?.completion?.workspaceId)}</strong></div><div class="workspace-review-card"><span>Registry</span><strong>${esc(result?.completion?.registryStatus)}</strong></div><div class="workspace-review-card"><span>Repository</span><strong>${esc(result?.completion?.repositoryStatus)}</strong></div><div class="workspace-review-card"><span>AI Team</span><strong>${esc(result?.completion?.aiTeamStatus)}</strong></div></div><div class="workspace-creation-actions"><a class="button" href="${esc(result?.repository?.commitUrl || result?.repository?.url || '#')}" target="_blank" rel="noopener">View creation evidence</a><button type="button" data-workspace-finish>Return to Workspace Registry</button></div></div>`;
    }
    wizard.hidden = false; persistState(); focusCurrent();
  }

  function captureCurrent() {
    const answer = $('[data-conversation-answer]'); if (answer) state.input[answer.dataset.questionKey] = answer.value.trim();
    const customName = $('[data-custom-workspace-name]'); if (customName) state.input.selectedName = customName.value.trim();
    const challenge = $('[data-challenge-answer]'); if (challenge) state.challenge.answer = challenge.value.trim();
    persistState();
  }
  function open(trigger) {
    if (window.NNOSActiveWorkspace) return window.alert('Workspace creation is available only from Founder OS Home.');
    returnFocus = trigger || document.activeElement;
    try { state = normalizeState(JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')); } catch { clearDraft(); state = initialState(); }
    render();
  }
  function close() { captureCurrent(); createWizard().hidden = true; returnFocus?.focus?.(); }
  function discard() { clearDraft(); state = initialState(); createWizard().hidden = true; returnFocus?.focus?.(); }
  async function executeCreation() {
    if (!window.FounderOSGateway?.createWorkspace) throw new Error('The protected Gateway client is unavailable. Refresh and try again.');
    if (!state.creation.clientRequestId) state.creation.clientRequestId = window.FounderOSGateway.createClientRequestId('workspace-create');
    state.creation.status = 'creating'; state.creation.error = ''; state.step = 6; persistState(); render();
    try {
      state.creation.result = await window.FounderOSGateway.createWorkspace({ blueprint: creationBlueprint(), clientRequestId: state.creation.clientRequestId });
      state.creation.status = 'complete'; persistState(); render();
      window.dispatchEvent(new CustomEvent('founder-os:workspace-created', { detail: state.creation.result }));
    } catch (error) {
      state.creation.status = 'failed'; state.creation.error = error.message || 'Workspace creation failed safely.'; persistState(); render();
    }
  }

  document.addEventListener('input', (event) => { if (event.target.closest('[data-workspace-creation]')) captureCurrent(); });
  document.addEventListener('keydown', (event) => {
    const wizard = $('[data-workspace-creation]'); if (!wizard || wizard.hidden) return;
    if (event.key === 'Escape' && state.creation.status !== 'creating') { event.preventDefault(); close(); return; }
    if (event.key === 'Tab') { const focusable = [...wizard.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter((node) => !node.hidden); if (!focusable.length) return; const first = focusable[0], last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  });
  document.addEventListener('click', (event) => {
    const createTrigger = event.target.closest('[data-create-workspace]'); if (createTrigger) { event.preventDefault(); open(createTrigger); return; }
    if (event.target.closest('[data-workspace-creation-close]')) { event.preventDefault(); close(); return; }
    if (event.target.closest('[data-workspace-save-draft]')) { event.preventDefault(); captureCurrent(); window.alert('Workspace Discovery draft saved. It will recover after refresh or browser restart.'); return; }
    const answerSuggestion = event.target.closest('[data-answer-suggestion]'); if (answerSuggestion) { event.preventDefault(); const answer = $('[data-conversation-answer]'); if (answer) { answer.value = answerSuggestion.dataset.answerSuggestion; state.input[answer.dataset.questionKey] = answer.value; persistState(); render(); } return; }
    const nameSuggestion = event.target.closest('[data-name-suggestion]'); if (nameSuggestion) { event.preventDefault(); state.input.selectedName = nameSuggestion.dataset.nameSuggestion; persistState(); render(); return; }
    const option = event.target.closest('[data-option-id]'); if (option) { event.preventDefault(); const id = option.dataset.optionId; state.selected = state.selected.includes(id) ? state.selected.filter((item) => item !== id) : [...state.selected,id]; persistState(); render(); return; }
    const removeConstraint = event.target.closest('[data-remove-constraint]'); if (removeConstraint) { event.preventDefault(); state.input.constraints.splice(Number(removeConstraint.dataset.removeConstraint),1); persistState(); render(); return; }
    if (event.target.closest('[data-add-constraint]')) { event.preventDefault(); const input = $('[data-new-constraint]'), value = input?.value.trim(); if (value) { state.input.constraints.push(value); persistState(); render(); } return; }
    if (event.target.closest('[data-challenge-run]')) { event.preventDefault(); state.challenge = { ...state.challenge, chosen: true, skipped: false }; persistState(); render(); return; }
    if (event.target.closest('[data-challenge-skip]')) { event.preventDefault(); state.challenge = { chosen: false, skipped: true, answer: '' }; persistState(); render(); return; }
    if (event.target.closest('[data-workspace-back]')) { event.preventDefault(); captureCurrent(); if (state.step === 1 && state.questionIndex > 0) state.questionIndex -= 1; else if (state.step === 2) { state.step = 1; state.questionIndex = QUESTION_FLOW.length - 1; } else state.step = Math.max(1,state.step - 1); render(); return; }
    if (event.target.closest('[data-workspace-next]')) { event.preventDefault(); captureCurrent(); if (state.step === 1) { const question = QUESTION_FLOW[state.questionIndex]; if (!state.input[question.key] || state.input[question.key].length < 3) return window.alert('Please answer this question before continuing.'); const gate = assessRequest(state.input); if (!gate.allowed) state.step = 4; else if (state.questionIndex < QUESTION_FLOW.length - 1) state.questionIndex += 1; else { state.step = 2; state.nameSuggestions = generateNameSuggestions(state.input); } } else if (state.step === 2) { if (!state.input.selectedName.trim()) return window.alert('Choose or enter a workspace name before continuing.'); state.step = 3; } else if (state.step === 3) state.step = 4; else if (state.step === 4 && assessRequest(state.input).allowed) state.step = 5; persistState(); render(); return; }
    if (event.target.closest('[data-workspace-create-protected]')) { event.preventDefault(); captureCurrent(); const gate = assessRequest(state.input); if (!gate.allowed) { state.step = 4; render(); return; } if (!$('[data-workspace-confirm]')?.checked) return window.alert('Confirm the exact workspace blueprint before protected creation.'); executeCreation(); return; }
    if (event.target.closest('[data-workspace-retry]')) { event.preventDefault(); executeCreation(); return; }
    if (event.target.closest('[data-workspace-finish]')) { event.preventDefault(); discard(); window.location.reload(); }
  });
  window.addEventListener('founder-os:workspace-view-changed', (event) => { if (event.detail?.workspace) close(); });
  ensureStyles(); createWizard(); window.NNOSWorkspaceCreation = { open, close, discard, clearDraft };
})();