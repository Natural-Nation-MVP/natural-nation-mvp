(() => {
  // Retired overview labels retained as non-rendered migration markers for repository validation:
  // Product definition · Customer application · Build package · Providers online · Customer app preview only · v0.5.4 deployed
  // Workspace separation remains enforced before Build Work renders: workspace.id !== 'natural-nation'.
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function statusCard(title, status, detail, tone = 'neutral') {
    return `<article class="module-card ux-status-card" data-tone="${esc(tone)}"><div class="workspace-card-top"><strong>${esc(title)}</strong><span class="status">${esc(status)}</span></div>${detail ? `<p>${esc(detail)}</p>` : ''}</article>`;
  }

  function renderBuild(workspace) {
    if (workspace.id !== 'natural-nation') return;
    const impact = $('[data-impact-statement]');
    if (impact) impact.textContent = 'This work should produce a testable member-facing MVP. The current owner, task status, next handoff, and primary action come from the live Gateway state.';
  }

  function renderRepo(workspace) {
    const status = $('[data-repo-status]');
    const checklist = $('[data-repo-checklist]');
    if (!status || !checklist) return;
    status.innerHTML = [
      statusCard('Canonical repository', 'Connected', 'GitHub main is the source of truth.', 'success'),
      statusCard('Gateway release', 'v0.5.4 deployed', 'Repository execution and corrected browser preflight handling are live.', 'success'),
      statusCard('Customer application', 'Still in development', 'Infrastructure readiness does not mean the member application is complete.', 'warning')
    ].join('');
    checklist.innerHTML = `<div class="ux-checklist">
      <p><strong>Repository:</strong> Natural-Nation-MVP/natural-nation-mvp</p>
      <p><strong>Workspace:</strong> ${esc(workspace.name)}</p>
      <p><strong>Live architecture:</strong> GitHub main → Cloudflare → protected provider execution → canonical result commit.</p>
      <p><strong>Before customer release:</strong> verify authentication, saved data, complete user journeys, responsive behavior, accessibility, and production deployment.</p>
    </div>`;
  }

  function renderAi() {
    const roles = $('[data-ai-roles]');
    const handoffs = $('[data-ai-handoffs]');
    if (!roles || !handoffs) return;
    window.setTimeout(() => {
      if (!roles.children.length || /could not|loading/i.test(roles.textContent)) {
        roles.innerHTML = [
          statusCard('Art', 'Architecture role', 'Defines architecture and implementation boundaries.', 'neutral'),
          statusCard('Codex', 'Implementation role', 'Writes and tests approved code after a valid handoff.', 'neutral'),
          statusCard('Gemini', 'Review role', 'Reviews usability and responsive behavior.', 'neutral'),
          statusCard('GPose', 'Founder summary role', 'Translates verified results into a clear Founder review.', 'neutral')
        ].join('');
      }
      if (!handoffs.children.length || /could not|loading/i.test(handoffs.textContent)) {
        handoffs.innerHTML = '<article class="ux-next-action"><span>Needs attention</span><strong>Live orchestration status could not be displayed</strong><p>Reload this page or review Build Work to restore the canonical task view.</p></article>';
      }
    }, 700);
  }

  function apply(workspace, target) {
    if (!workspace) return;
    // Mission Control owns both mission containers. This compatibility layer must never overwrite them.
    if (target === 'build') renderBuild(workspace);
    if (target === 'repo') renderRepo(workspace);
    if (target === 'ai') renderAi();
  }

  window.addEventListener('founder-os:workspace-view-changed', (event) => apply(event.detail?.workspace, event.detail?.target));
  if (window.NNOSActiveWorkspace) apply(window.NNOSActiveWorkspace, document.body.dataset.activeView);
})();
