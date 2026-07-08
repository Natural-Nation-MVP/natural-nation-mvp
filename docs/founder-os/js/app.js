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
const deliveryTarget = document.querySelector('[data-delivery]');
const approvalTarget = document.querySelector('[data-approval]');

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
  if (deliveryTarget) deliveryTarget.textContent = item.delivery;
  if (approvalTarget) approvalTarget.textContent = item.approval;
  renderQueue(item.id);
}

renderQueue();
selectBuildItem(buildItems[0].id);

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-build-id]');
  if (!target) return;
  selectBuildItem(target.dataset.buildId);
});
