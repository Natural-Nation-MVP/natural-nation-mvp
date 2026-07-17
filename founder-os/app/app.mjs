export const commandCenterData = {
  platformHealth: 'Governed runtime healthy',
  workspaces: [
    {
      id: 'workspace-natural-nation', number: 1, name: 'Natural Nation', state: 'Active',
      summary: 'AI wellness mentor product operating through the Founder OS governed runtime.',
      metrics: { activeRuns: 2, pendingApprovals: 1, monthlyCost: '$42.18', health: 'Healthy' },
      runs: [{ title: 'Generate Day 1 protocol', meta: 'Completed · evidence captured' }, { title: 'Duey response evaluation', meta: 'Running · attempt 1' }],
      approvals: [{ title: 'Publish pilot release', meta: 'Founder approval required · exact payload binding' }],
      health: [{ title: 'Runtime service', meta: 'Healthy' }, { title: 'OpenAI connection', meta: 'Healthy' }],
      schedules: [{ title: 'Daily protocol preparation', meta: 'Every day · 6:00 AM workspace time' }],
      release: [{ title: 'Pilot Release 1', meta: 'Staging verified · production approval pending' }],
      evidence: [{ title: 'run-nn-001', meta: 'Protocol artifact · audit event · cost record' }],
    },
    {
      id: 'workspace-contractor-estimator', number: 2, name: 'Contractor Estimator', state: 'Draft',
      summary: 'Product-agnostic validation workspace for governed estimating workflows.',
      metrics: { activeRuns: 0, pendingApprovals: 0, monthlyCost: '$3.12', health: 'Ready' },
      runs: [{ title: 'Estimate fixture validation', meta: 'Completed · isolated from Natural Nation' }],
      approvals: [], health: [{ title: 'Runtime service', meta: 'Healthy' }], schedules: [],
      release: [{ title: 'No active release', meta: 'Workspace remains in draft lifecycle state' }],
      evidence: [{ title: 'run-ce-001', meta: 'Estimate artifact · audit event · cost record' }],
    },
  ],
};

const byId = (id) => document.getElementById(id);
const renderItems = (items) => items.length ? items.map((item) => `<div class="item"><strong>${escapeHtml(item.title)}</strong><div class="muted">${escapeHtml(item.meta)}</div></div>`).join('') : '<p class="empty">None requiring attention.</p>';

export function renderWorkspace(workspace) {
  byId('workspace-number').textContent = `Workspace #${workspace.number}`;
  byId('workspace-title').textContent = workspace.name;
  byId('workspace-summary').textContent = workspace.summary;
  byId('workspace-state').textContent = workspace.state;
  byId('metrics').innerHTML = Object.entries(workspace.metrics).map(([label, value]) => `<div class="metric"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`).join('');
  ['runs','approvals','health','schedules','release','evidence'].forEach((key) => { byId(key).innerHTML = renderItems(workspace[key]); });
  document.querySelectorAll('[data-workspace-id]').forEach((button) => button.setAttribute('aria-current', String(button.dataset.workspaceId === workspace.id)));
}

export function initializeCommandCenter(data = commandCenterData) {
  byId('platform-health').textContent = data.platformHealth;
  byId('workspace-list').innerHTML = data.workspaces.map((workspace) => `<button type="button" data-workspace-id="${workspace.id}"><strong>${escapeHtml(workspace.name)}</strong><br><span class="muted">Workspace #${workspace.number} · ${escapeHtml(workspace.state)}</span></button>`).join('');
  document.querySelectorAll('[data-workspace-id]').forEach((button) => button.addEventListener('click', () => renderWorkspace(data.workspaces.find((workspace) => workspace.id === button.dataset.workspaceId))));
  renderWorkspace(data.workspaces[0]);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[character]);
}

if (typeof document !== 'undefined') initializeCommandCenter();
