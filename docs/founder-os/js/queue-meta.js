const queueData = {
  'BUILD-NNCC-002': ['Art', 'High', '0/5', 'Codex'],
  'BUILD-NNCC-003': ['Codex', 'High', '0/5', 'Codex'],
  'BUILD-NNCC-004': ['Gemini', 'Medium', '3/5', 'Gemini'],
};

function addTag(row, value) {
  const tag = document.createElement('small');
  tag.textContent = value;
  row.appendChild(tag);
}

function updateQueueCard(card) {
  const values = queueData[card.dataset.buildId];
  if (!values) return;

  card.querySelectorAll('.queue-meta').forEach((row) => row.remove());
  card.querySelectorAll('small').forEach((tag) => tag.remove());

  const row = document.createElement('span');
  row.className = 'queue-meta';
  values.forEach((value) => addTag(row, value));
  card.appendChild(row);
}

function updateQueue() {
  document.querySelectorAll('[data-build-id]').forEach(updateQueueCard);
}

const queueRoot = document.querySelector('[data-build-queue]');
if (queueRoot) {
  updateQueue();
  setTimeout(updateQueue, 250);
  setTimeout(updateQueue, 900);
  new MutationObserver(updateQueue).observe(queueRoot, { childList: true });
}
