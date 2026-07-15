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
        statusCard('Platform usability', 'In review', 'The navigation and workspace separation are being simplified so each screen has one clear purpose.', 'progress'),
        statusCard('AI orchestration', 'Foundation ready', 'Protected dispatch is built. Live providers still require production credentials and endpoint verification.', 'progress'),
        statusCard('Release readiness', 'Not ready to merge', 'Founder OS remains a review environment until the internal modules and live execution path are verified.', 'warning')
      ].join('');
      actions.innerHTML = `<div class="ux-action-list">
        <article class="ux-next-action"><span>Recommended now</span><strong>Review the simplified Founder OS experience</strong><p>Confirm that the home screen, platform status, team view, and code status are understandable before enabling more automation.</p></article>
        <button class="generate" type="button" data-ux-open="ai">Review AI Team</button>
        <button type="button" data-ux-open="repo">Review Code Status</button>
      </div>`;
      return;
    }

    cards.innerHTML = [
      statusCard('Product definition', 'Approved foundation', 'The MVP blueprint, Duey role, navigation, protocol system, and score standards are documented.', 'success'),
      statusCard('Customer application', 'Not production-ready', 'The real Natural Nation member experience is still incomplete. Current screens are planning and review artifacts.', 'warning'),
      statusCard('Build package', 'Ready for controlled work', 'NN-BUILD-001 is available for implementation, but each result still requires testing and Founder review.', 'progress')
    ].join('');

    actions.innerHTML = `<div class="ux-product-overview">
      <article class="ux-next-action"><span>Recommended now</span><strong>Build and verify the member-facing MVP</strong><p>Focus on onboarding, the Day 1 dashboard, Duey guidance, daily protocol completion, and progress tracking before expanding the platform.</p></article>
      <div class="ux-preview-shell" aria-label="Natural Nation customer experience preview">
        <div class="ux-phone-preview">
          <div class="ux-preview-header"><span>Natural Nation</span><strong>Day 1</strong></div>
          <section class="ux-welcome-card"><small>GOOD AFTERNOON</small><h3>Your wellness plan starts here.</h3><p>Duey has prepared a simple first-day mission based on your goals.</p></section>
          <div class="ux-score-row"><article><small>Wellness</small><strong>72</strong><span>Feeling steady</span></article><article><small>Rejuvenation</small><strong>40</strong><span>2 of 5 complete</span></article></div>
          <section class="ux-protocol-preview"><div><strong>Today’s protocol</strong><span>Next: Hydration</span></div><ol><li class="done">Morning check-in</li><li class="now">Hydration and minerals</li><li>Whole-food lunch</li><li>10-minute walk</li></ol></section>
          <button type="button" disabled>Customer app preview only</button>
        </div>
        <div class="ux-preview-notes"><strong>What is real today</strong><p>The approved product structure, content rules, and implementation package.</p><strong>What is still being built</strong><p>Authentication, saved member data, live Duey conversations, protocol completion, scores, and production deployment.</p></div>
      </div>
      <div class="ux-button-row"><button class="generate" type="button" data-ux-open="build">Open Build Work</button><button type="button" data-ux-open="ai">See Assigned Team</button></div>
    </div>`;
  }

  function renderBuild(workspace) {
    if (workspace.id !== 'natural-nation') return;
    const selectedTitle = $('[data-selected-title]');
    const selectedMeta = $('[data-selected-meta]');
    const validation = $('[data-validation-status]');
    const approval = $('[data-build-approval]');
    const impact = $('[data-impact-statement]');
    if (selectedTitle && /Open a workspace|No package/i.test(selectedTitle.textContent)) selectedTitle.textContent = 'Natural Nation MVP implementation package';
    if (selectedMeta && /No package/i.test(selectedMeta.textContent)) selectedMeta.textContent = 'Loading the approved NN-BUILD-001 package from GitHub.';
    if (validation && /No package/i.test(validation.textContent)) validation.textContent = 'The package must load and pass validation before any AI handoff can begin.';
    if (approval && /Required/i.test(approval.textContent)) approval.textContent = 'Verification required';
    if (impact) impact.textContent = 'This work should produce a testable member-facing MVP—not another planning screen. Every task must map to visible customer value.';
  }

  function renderRepo(workspace) {
    const status = $('[data-repo-status]');
    const checklist = $('[data-repo-checklist]');
    if (!status || !checklist) return;
    status.innerHTML = [
      statusCard('Canonical repository', 'Connected', 'GitHub is the source of truth for code, approvals, build packages, and project records.', 'success'),
      statusCard('Current release', 'Review builds only', 'Open draft pull requests contain unmerged work. Main should not be described as containing those changes yet.', 'warning'),
      statusCard('Live deployment', 'Verification required', 'A passing workflow confirms static checks, not full customer functionality or production readiness.', 'warning')
    ].join('');
    checklist.innerHTML = `<div class="ux-checklist">
      <p><strong>Repository:</strong> Natural-Nation-MVP/natural-nation-mvp</p>
      <p><strong>Workspace:</strong> ${esc(workspace.name)}</p>
      <p><strong>Safe interpretation:</strong> “Checks passed” means automated repository validation passed. It does not mean the full application is finished.</p>
      <p><strong>Before release:</strong> verify authentication, data persistence, user journeys, provider credentials, callbacks, error handling, responsive behavior, and deployment.</p>
    </div>`;
  }

  function renderAi(workspace) {
    const roles = $('[data-ai-roles]');
    const handoffs = $('[data-ai-handoffs]');
    if (!roles || !handoffs) return;
    window.setTimeout(() => {
      if (!roles.children.length || /could not|loading/i.test(roles.textContent)) {
        roles.innerHTML = [
          statusCard('Art', 'Planning role', 'Defines architecture and prepares implementation boundaries. Does not merge or deploy.', 'neutral'),
          statusCard('Codex', 'Implementation role', 'Writes and tests approved code after a valid handoff and configured provider connection.', 'neutral'),
          statusCard('Gemini', 'Review role', 'Reviews design and responsive behavior after a working preview exists.', 'neutral'),
          statusCard('GPose', 'Founder summary role', 'Translates verified results into a clear review package for the Founder.', 'neutral')
        ].join('');
      }
      if (!handoffs.children.length || /could not|loading/i.test(handoffs.textContent)) {
        handoffs.innerHTML = `<article class="ux-next-action"><span>Current limitation</span><strong>Provider execution is not yet verified</strong><p>The orchestration workflow can validate and record handoffs. Real AI execution requires configured provider endpoints, credentials, and a verified callback cycle.</p></article>`;
      }
    }, 500);
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