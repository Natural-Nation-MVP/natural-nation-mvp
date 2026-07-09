const queueMetadata = {
  'BUILD-NNCC-002': { owner: 'Art', priority: 'High', progress: '0/5', target: 'Codex' },
  'BUILD-NNCC-003': { owner: 'Codex', priority: 'High', progress: '0/5', target: 'Codex' },
  'BUILD-NNCC-004': { owner: 'Gemini', priority: 'Medium', progress: '3/5', target: 'Gemini' },
};

function enhanceQueueItem(button) {
  const buildId = button.dataset.buildId;
  const meta = queueMetadata[buildId];
  if (!meta || button.dataset.metaEnhanced === 'true') return;

  const existingSmall = button.querySelector('small');
  if (existingSmall) existingSmall.remove();

  const title = button.querySelector('.queue-title') || button.querySelector('span:not(.queue-top)');
  if (title) title.classList.add('queue-title');

  const metaRow = document.createElement('span');
  metaRow.className = 'queue-meta';
  metaRow.innerHTML = `<small>${meta.owner}</small><small>${meta.priority}</small><small>${meta.progress}</small><small>${meta.target}</small>`;
  button.appendChild(metaRow);
  button.dataset.metaEnhanced = 'true';
}

function enhanceQueue() {
  document.querySelectorAll('[data-build-id]').forEach(enhanceQueueItem);
}

const queueRoot = document.querySelector('[data-build-queue]');
if (queueRoot) {
  enhanceQueue();
  new MutationObserver(enhanceQueue).observe(queueRoot, { childList: true, subtree: true });
}
