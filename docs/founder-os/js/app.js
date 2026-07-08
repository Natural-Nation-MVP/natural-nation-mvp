const workspaceMeta = {
  mission: {
    title: 'Mission Control',
    subtitle: 'Founder dashboard, release state, health indicators, and command priorities.',
    badge: 'Founder OS Online',
  },
  knowledge: {
    title: 'Knowledge Graph',
    subtitle: 'Canonical records, decisions, approvals, architecture standards, and project intelligence.',
    badge: 'Knowledge Intelligence',
  },
  build: {
    title: 'AI Build Orchestrator OP-002',
    subtitle: 'Generate AI-ready implementation packages with delivery targets and Founder approval.',
    badge: 'Target: Codex',
  },
  repo: {
    title: 'Repository Intelligence',
    subtitle: 'Branch, deployment, folder, runtime, and source-of-truth visibility.',
    badge: 'main / docs',
  },
  ai: {
    title: 'AI Operations',
    subtitle: 'Coordinate AI roles, handoffs, execution order, and review ownership.',
    badge: 'AI Team Ready',
  },
};

const buildItems = [
  {
    id: 'BUILD-NNCC-002',
    title: 'Create Google AI Studio app build package',
    owner: 'Art',
    status: 'Ready',
    target: 'Codex',
    delivery: 'Codex Implementation Agent',
    approval: 'Founder Required',
  },
  {
    id: 'BUILD-NNCC-003',
    title: 'Codex implementation package',
    owner: 'Codex',
    status: 'Ready',
    target: 'Codex',
    delivery: 'Codex Implementation Agent',
    approval: 'Founder Required',
  },
  {
    id: 'BUILD-NNCC-004',
    title: 'Founder OS design system package',
    owner: 'Gemini',
    status: 'In Progress',
    target: 'Gemini',
    delivery: 'Design Review Agent',
    approval: 'Founder Review',
  },
];

const queueContainer = document.querySelector('[data-build-queue]');
const selectedTitle = document.querySelector('[data-selected-title]');
const selectedId = document.querySelector('[data-selected-id]');
const deliveryTargets = document.querySelectorAll('[data-delivery]');
const approvalTarget = document.querySelector('[data-approval]');
const workspaceButtons = document.querySelectorAll('[data-workspace-button]');
const workspaceViews = document.querySelectorAll('[data-workspace]');
const workspaceTitle = document.querySelector('[data-workspace-title]');
const workspaceSubtitle = document.querySelector('[data-workspace-subtitle]');
const workspaceBadge = document.querySelector('[data-workspace-badge]');

function renderQueue(selected = buildItems[0].id) {
  if (!queueContainer) return;

  queueContainer.innerHTML = buildItems
    .map((item) => {
      const active = item.id === selected ? ' active' : '';
      return `
        <button class="queue-item${active}" data-build-id="${item.id}" type="button">
          <span class="queue-top"><strong>${item.id}</strong><span class="status">${item.status}</span></span>
          <span>${item.title}</span>
          <small>Owner: ${item.owner}</small>
        </button>
      `;
    })
    .join('');
}

function selectBuildItem(id) {
  const item = buildItems.find((entry) => entry.id === id) || buildItems[0];
  if (selectedId) selectedId.textContent = item.id;
  if (selectedTitle) selectedTitle.textContent = item.title;
  deliveryTargets.forEach((target) => {
    target.textContent = item.delivery;
  });
  if (approvalTarget) approvalTarget.textContent = item.approval;
  renderQueue(item.id);
}

function setWorkspace(workspace) {
  const meta = workspaceMeta[workspace] || workspaceMeta.mission;

  workspaceViews.forEach((view) => {
    view.classList.toggle('active', view.dataset.workspace === workspace);
  });

  workspaceButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.workspaceButton === workspace);
  });

  if (workspaceTitle) workspaceTitle.textContent = meta.title;
  if (workspaceSubtitle) workspaceSubtitle.textContent = meta.subtitle;
  if (workspaceBadge) workspaceBadge.textContent = meta.badge;
}

renderQueue();
selectBuildItem(buildItems[0].id);
setWorkspace('mission');

document.addEventListener('click', (event) => {
  const buildTarget = event.target.closest('[data-build-id]');
  if (buildTarget) {
    selectBuildItem(buildTarget.dataset.buildId);
    return;
  }

  const workspaceTarget = event.target.closest('[data-workspace-button]');
  if (workspaceTarget) {
    setWorkspace(workspaceTarget.dataset.workspaceButton);
  }
});
