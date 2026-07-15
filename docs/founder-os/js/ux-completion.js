(() => {
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function statusCard(title, status, detail, tone = 'neutral') {
    return `<article class="module-card ux-status-card" data-tone="${esc(tone)}"><div class="workspace-card-top"><strong>${esc(title)}</strong><span class="status">${esc(status)}</span></div><p>${esc(detail)}</p></article>`;
  }

  function renderOverview(workspace) {
    const cards = $('[data-mission-cards]');
    const actions = $('[data-action-queue]');
    if (!cards || !actions) return;

    if (workspace.id === 'founder-os') {
      cards.innerHTML = [
        statusCard('Platform usability', 'Live-state review', 'Founder OS is being checked page by page so every status and action reflects the canonical live system.', 'progress'),
        statusCard('AI orchestration', 'Providers online', 'Protected dispatch, direct OpenAI and Google execution, failover, audit recording, and synchronous completion are enabled.', 'success'),
        statusCard('Release readiness', 'Production verification', 'The Gateway is deployed. Founder OS page behavior and the first live orchestration cycle must still be verified before final lock.', 'progress')
      ].join('');
      actions.innerHTML = `<div class="ux-action-list">
        <article class="ux-next-action"><span>Recommended now</span><strong>Verify the live Natural Nation work cycle</strong><p>Open Build Work, confirm the current owner and next handoff, then run the ready task through the protected Gateway.</p></article>
        <button class="generate" type="button" data-ux-open="build">Open Live Build Work</button>
        <button type="button" data-ux-open="ai">Review Assigned AI Team</button>
      </div>`;
      return;
    }

    cards.innerHTML = [
      statusCard('Product definition', 'Approved foundation', 'The MVP blueprint, Duey role, navigation, protocol system, and score standards are documented.', 'success'),
      statusCard('Customer application', 'Not production-ready', 'The real Natural Nation member experience is still incomplete. Current screens are planning and review artifacts.', 'warning'),
      statusCard('Build package', 'Live orchestration ready', 'NN-BUILD-001 is connected to the Gateway task chain. Each role must complete its current canonical step in order.', 'success')
    ].join('');

    actions.innerHTML = `<div class="ux-product-overview">
      <article class="ux-next-action"><span>Recommended now</span><strong>Run the current canonical build task</strong><p>Build Work now follows the live Gateway state, beginning with architecture and moving through implementation, review, and Founder approval.</p></article>
      <div class="ux-preview-shell" aria-label="Natural Nation customer experience preview">
        <div class="ux-phone-preview">
          <div class="ux-preview-header"><span>Natural Nation</span><strong>Day 1</strong></div>
          <section class="ux-welcome-card"><small>GOOD AFTERNOON</small><h3>Your wellness plan starts here.</h3><p>Duey has prepared a simple first-day mission based on your goals.</p></section>
          <div class="ux-score-row"><article><small>Wellness</small><strong>72</strong><span>Feeling steady</span></article><article><small>Rejuvenation</small><strong>40</strong><span>2 of 5 complete</span></article></div>
          <section class="ux-protocol-preview"><div><strong>Today’s protocol</strong><span>Next: Hydration</span></div><ol><li class="done">Morning check-in</li><li class="now">Hydration and minerals</li><li>Whole-food lunch</li><li>10-minute walk</li></ol></section>
          <button type="button" disabled>Customer app preview only</button>
        </div>
        <div class="ux-preview-notes"><strong>What is real today</strong><p>The approved product structure, live orchestration path, content rules, and implementation package.</p><strong>What is still being built</strong><p>Authentication, saved member data, live Duey conversations, protocol completion, scores, and customer production deployment.</p></div>
      </div>
      <div class="ux-button-row"><button class="generate" type="button" data-ux-open="build">Open Live Build Work</button><button type="button" data-ux-open="ai">See Assigned Team</button></div>
    </div>`;
  }

  function renderBuild(workspace) {
    if (workspace.id !== 'natural-nation') return;
    const impact = $('[data-impact-statement]');
    if (impact) impact.textContent = 'This work should produce a testable member-facing MVP—not another planning screen. The current owner, task status, next handoff, and primary action must come from the live Gateway state.';
  }

  function renderRepo(workspace) {
    const status = $('[data-repo-status]');
    const checklist = $('[data-repo-checklist]');
    if (!status || !checklist) return;
    status.innerHTML = [
      statusCard('Canonical repository', 'Connected', 'GitHub main is the source of truth for code, approvals, build packages, orchestration state, and verified task results.', 'success'),
      statusCard('Gateway release', 'v0.5.3 deployed', 'The protected Gateway is online with direct providers and corrected configuration readiness.', 'success'),
      statusCard('Customer application', 'Still in development', 'Gateway readiness and repository checks do not mean the Natural Nation member application is complete.', 'warning')
    ].join('');
    checklist.innerHTML = `<div class="ux-checklist">
      <p><strong>Repository:</strong> Natural-Nation-MVP/natural-nation-mvp</p>
      <p><strong>Workspace:</strong> ${esc(workspace.name)}</p>
      <p><strong>Live architecture:</strong> GitHub main → Cloudflare deployment → protected provider execution → canonical result commit.</p>
      <p><strong>Before customer release:</strong> verify authentication, data persistence, full user journeys, error handling, responsive behavior, accessibility, and member deployment.</p>
    </div>`;
  }

  function renderAi(workspace) {
    const roles = $('[data-ai-roles]');
    const handoffs = $('[data-ai-handoffs]');
    if (!roles || !handoffs) return;
    window.setTimeout(() => {
      if (!roles.children.length || /could not|loading/i.test(roles.textContent)) {
        roles.innerHTML = [
          statusCard('Art', 'Architecture role', 'Defines architecture and prepares implementation boundaries. The active provider executes this stable role identity.', 'neutral'),
          statusCard('Codex', 'Implementation role', 'Writes and tests approved code after Art completes the current canonical handoff.', 'neutral'),
          statusCard('Gemini', 'Review role', 'Reviews design and responsive behavior after a working preview exists.', 'neutral'),
          statusCard('GPose', 'Founder summary role', 'Translates verified results into a clear review package for the Founder.', 'neutral')
        ].join('');
      }
      if (!handoffs.children.length || /could not|loading/i.test(handoffs.textContent)) {
        handoffs.innerHTML = `<article class="ux-next-action"><span>Needs attention</span><strong>Live orchestration status could not be displayed</strong><p>The Gateway providers are configured. Reload this page or review Build Work to restore the current canonical task view.</p></article>`;
      }
    }, 700);
  }

  function apply(workspace, target) {
    if (!workspace) return;
    if (target === 'mission') renderOverview(workspace);
    if (target === 'build') renderBuild(workspace);
    if (target === 'repo') renderRepo(workspace);
    if (target === 'ai') renderAi(workspace);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-ux-open]');
    if (!button) return;
    window.setWorkspace?.(button.dataset.uxOpen);
  });

  window.addEventListener('founder-os:workspace-view-changed', (event) => apply(event.detail?.workspace, event.detail?.target));
  if (window.NNOSActiveWorkspace) apply(window.NNOSActiveWorkspace, document.body.dataset.activeView);
})();