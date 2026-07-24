(() => {
  const $ = (selector) => document.querySelector(selector);
  const registryView = () => $('[data-workspace="registry"]');

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function slug(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'new-workspace';
  }

  function workspaceId(value) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    const compact = words.map((word) => word[0]).join('').slice(0, 5).toUpperCase();
    return compact || 'NEW';
  }

  function ensureStyles() {
    if (document.querySelector('[data-workspace-creation-styles]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.NNOSPaths.asset('css/workspace-creation.css?v=founder-ux-001');
    link.dataset.workspaceCreationStyles = 'true';
    document.head.appendChild(link);
  }

  function buildPlan(input) {
    const title = input.vision.split(/[.!?]/)[0].trim().slice(0, 48) || 'New Workspace';
    const name = title.replace(/^(build|create|launch|start)\s+/i, '').replace(/^an?\s+/i, '').trim() || 'New Workspace';
    const repository = `${slug(name)}-mvp`;
    return {
      name,
      id: workspaceId(name),
      repository,
      workflow: 'Art → Codex → Gemini → GPose → Founder',
      aiTeam: ['Art', 'Codex', 'Gemini', 'GPose', 'Founder'],
      structure: ['Overview', 'Roadmap', 'Build Work', 'AI Team', 'Approvals', 'Knowledge', 'Releases'],
      governance: 'Founder approval required for protected changes',
      knowledge: 'ADR, decisions, documents, assets, and prompt library',
      pipelines: ['Features', 'Bugs', 'Research', 'Documentation', 'Architecture'],
      roadmap: ['M1: Foundation', 'M2: Core Experience', 'M3: Pilot Launch'],
      success: input.success,
      constraints: input.constraints
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
          <div><div class="eyebrow">Founder OS Control Center</div><h2 id="workspace-creation-title">Create a New Workspace</h2><p class="muted">Share the vision, success, and constraints. Founder OS prepares the operating structure.</p></div>
          <button type="button" data-workspace-creation-close>Close</button>
        </div>
        <div class="workspace-creation-steps" aria-label="Workspace creation progress">
          <span data-step-indicator="1" class="active">1 Vision</span>
          <span data-step-indicator="2">2 Success & Constraints</span>
          <span data-step-indicator="3">3 Review</span>
          <span data-step-indicator="4">4 Create</span>
        </div>
        <div class="workspace-creation-body" data-workspace-creation-body></div>
      </div>`;
    document.body.appendChild(wizard);
    return wizard;
  }

  let state = { step: 1, input: { vision: '', success: '', constraints: '' }, plan: null };

  function render() {
    const wizard = createWizard();
    const body = $('[data-workspace-creation-body]');
    if (!body) return;
    document.querySelectorAll('[data-step-indicator]').forEach((node) => {
      node.classList.toggle('active', Number(node.dataset.stepIndicator) === state.step);
      node.classList.toggle('complete', Number(node.dataset.stepIndicator) < state.step);
    });

    if (state.step === 1) {
      body.innerHTML = `
        <div class="workspace-creation-panel">
          <label for="workspace-vision"><strong>What are we building?</strong><span>Describe the product, initiative, or operating area in plain language.</span></label>
          <textarea id="workspace-vision" data-workspace-vision placeholder="Example: A meditation app that helps people reduce stress and improve sleep.">${esc(state.input.vision)}</textarea>
          <div class="workspace-creation-actions"><button type="button" data-workspace-save-draft>Save Draft</button><button class="generate" type="button" data-workspace-next>Next →</button></div>
        </div>`;
    } else if (state.step === 2) {
      body.innerHTML = `
        <div class="workspace-creation-grid">
          <div class="workspace-creation-panel">
            <label for="workspace-success"><strong>What does success look like?</strong><span>Define the first meaningful outcome.</span></label>
            <textarea id="workspace-success" data-workspace-success placeholder="Example: Launch an MVP and onboard 100 beta users in 90 days.">${esc(state.input.success)}</textarea>
          </div>
          <div class="workspace-creation-panel">
            <label for="workspace-constraints"><strong>Constraints and boundaries</strong><span>List architecture, compliance, timeline, or product limits.</span></label>
            <textarea id="workspace-constraints" data-workspace-constraints placeholder="Example: Mobile-first. Use React Native. Preserve approved architecture.">${esc(state.input.constraints)}</textarea>
          </div>
        </div>
        <div class="workspace-creation-actions"><button type="button" data-workspace-back>← Back</button><button class="generate" type="button" data-workspace-next>Prepare Workspace →</button></div>`;
    } else if (state.step === 3) {
      state.plan = buildPlan(state.input);
      body.innerHTML = `
        <div class="workspace-review-grid">
          ${[
            ['Workspace Name', state.plan.name],
            ['Workspace ID', state.plan.id],
            ['Repository', state.plan.repository],
            ['AI Workflow', state.plan.workflow],
            ['Knowledge System', state.plan.knowledge],
            ['Governance', state.plan.governance],
            ['Build Pipelines', state.plan.pipelines.join(', ')],
            ['Initial Roadmap', state.plan.roadmap.join(' · ')]
          ].map(([label, value]) => `<div class="workspace-review-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>Auto-prepared · editable before protected creation</small></div>`).join('')}
        </div>
        <article class="workspace-creation-summary"><h3>Founder intent</h3><p><strong>Vision:</strong> ${esc(state.input.vision)}</p><p><strong>Success:</strong> ${esc(state.input.success)}</p><p><strong>Constraints:</strong> ${esc(state.input.constraints || 'None provided')}</p></article>
        <div class="workspace-creation-actions"><button type="button" data-workspace-back>← Edit Details</button><button class="generate" type="button" data-workspace-next>Review & Create →</button></div>`;
    } else {
      body.innerHTML = `
        <div class="workspace-create-ready">
          <div class="workspace-create-icon">✓</div>
          <h3>${esc(state.plan?.name || 'Workspace')} is ready to create</h3>
          <p>Protected creation will initialize the canonical registry record, repository configuration, AI workflow, governance, knowledge structure, and default milestones.</p>
          <p class="muted">The live Gateway mutation is the next implementation slice. This control currently stops safely before any repository-changing action.</p>
          <div class="workspace-creation-actions"><button type="button" data-workspace-back>← Back</button><button class="generate" type="button" data-workspace-create-protected>Create Workspace</button></div>
        </div>`;
    }
    wizard.hidden = false;
  }

  function captureCurrent() {
    const vision = $('[data-workspace-vision]');
    const success = $('[data-workspace-success]');
    const constraints = $('[data-workspace-constraints]');
    if (vision) state.input.vision = vision.value.trim();
    if (success) state.input.success = success.value.trim();
    if (constraints) state.input.constraints = constraints.value.trim();
  }

  function open() {
    if (window.NNOSActiveWorkspace) {
      window.alert('Workspace creation is available only from Founder OS Home.');
      return;
    }
    state = { step: 1, input: { vision: '', success: '', constraints: '' }, plan: null };
    render();
  }

  function close() {
    const wizard = createWizard();
    wizard.hidden = true;
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-create-workspace]')) {
      event.preventDefault();
      open();
      return;
    }
    if (event.target.closest('[data-workspace-creation-close]')) {
      event.preventDefault();
      close();
      return;
    }
    if (event.target.closest('[data-workspace-save-draft]')) {
      event.preventDefault();
      captureCurrent();
      sessionStorage.setItem('founder-os-workspace-draft', JSON.stringify(state.input));
      window.alert('Workspace draft saved in this browser session.');
      return;
    }
    if (event.target.closest('[data-workspace-back]')) {
      event.preventDefault();
      captureCurrent();
      state.step = Math.max(1, state.step - 1);
      render();
      return;
    }
    if (event.target.closest('[data-workspace-next]')) {
      event.preventDefault();
      captureCurrent();
      if (state.step === 1 && !state.input.vision) return window.alert('Describe what you are building before continuing.');
      if (state.step === 2 && !state.input.success) return window.alert('Define what success looks like before continuing.');
      state.step = Math.min(4, state.step + 1);
      render();
      return;
    }
    if (event.target.closest('[data-workspace-create-protected]')) {
      event.preventDefault();
      window.alert('Protected workspace creation is not enabled yet. Your reviewed plan remains unchanged and no repository action was performed.');
    }
  });

  window.addEventListener('founder-os:workspace-view-changed', (event) => {
    if (event.detail?.workspace) close();
  });

  ensureStyles();
  createWizard();
  window.NNOSWorkspaceCreation = { open, close };
})();
