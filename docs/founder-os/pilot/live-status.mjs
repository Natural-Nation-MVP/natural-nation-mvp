const API_KEY = 'founder-os-api-base';
const DEFAULT_API = 'https://founder-os-gateway.dmoseley1024.workers.dev';

const apiBase = () => (localStorage.getItem(API_KEY) || DEFAULT_API).replace(/\/$/, '');
const byId = (id) => document.getElementById(id);

function ensureStatusPanel() {
  if (byId('live-system-status')) return byId('live-system-status');
  const notice = byId('notice');
  if (!notice) return null;
  const panel = document.createElement('section');
  panel.id = 'live-system-status';
  panel.className = 'live-system-status';
  panel.setAttribute('aria-label', 'Verified live system status');
  panel.innerHTML = `
    <div><span>Gateway</span><strong id="live-gateway-version">Checking…</strong></div>
    <div><span>Database</span><strong id="live-database-status">Checking…</strong></div>
    <div><span>OpenAI</span><strong id="live-openai-status">Checking…</strong></div>
    <div><span>Google AI</span><strong id="live-google-status">Checking…</strong></div>
    <div><span>Evidence</span><strong>Server-owned live state</strong></div>
    <div><span>Last synchronized</span><strong id="live-sync-time">Checking…</strong></div>`;
  notice.insertAdjacentElement('afterend', panel);
  return panel;
}

function normalizeConnectedPresentation(health) {
  document.querySelectorAll('[data-workspace-id="workspace-natural-nation"] .muted').forEach((node) => {
    node.textContent = 'Workspace #1 · Operational';
  });
  const workspaceState = byId('workspace-state');
  if (workspaceState && /pilot ready|operational/i.test(workspaceState.textContent)) {
    workspaceState.textContent = 'Operational';
  }
  byId('live-gateway-version').textContent = `v${health.version || 'unknown'} · connected`;
  byId('live-database-status').textContent = health.database ? `${health.databaseType || 'runtime store'} · connected` : 'Not connected';
  byId('live-openai-status').textContent = health.providers?.openai ? 'Ready' : 'Unavailable';
  byId('live-google-status').textContent = health.providers?.googleAI ? 'Ready' : 'Unavailable';
  byId('live-sync-time').textContent = new Date(health.time || Date.now()).toLocaleString();
}

async function refreshVerifiedStatus() {
  ensureStatusPanel();
  try {
    const response = await fetch(`${apiBase()}/api/founder-os/health`, {
      headers: { 'content-type': 'application/json', 'x-founder-os-workspace': 'workspace-natural-nation' }
    });
    if (!response.ok) throw new Error(`Runtime returned ${response.status}`);
    const health = await response.json();
    normalizeConnectedPresentation(health);
  } catch (error) {
    byId('live-gateway-version').textContent = 'Unavailable';
    byId('live-database-status').textContent = 'Not verified';
    byId('live-openai-status').textContent = 'Not verified';
    byId('live-google-status').textContent = 'Not verified';
    byId('live-sync-time').textContent = error.message;
  }
}

const observer = new MutationObserver(() => {
  const badge = byId('mode-badge');
  if (badge?.textContent.includes('Live runtime connected')) refreshVerifiedStatus();
});

ensureStatusPanel();
observer.observe(document.body, { childList: true, subtree: true, characterData: true });
byId('refresh-button')?.addEventListener('click', () => setTimeout(refreshVerifiedStatus, 300));
byId('save-connection')?.addEventListener('click', () => setTimeout(refreshVerifiedStatus, 500));
refreshVerifiedStatus();
