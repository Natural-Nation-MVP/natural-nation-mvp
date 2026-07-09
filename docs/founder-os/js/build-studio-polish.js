function polishBuildStudioMetrics() {
  document.querySelectorAll('.metric span').forEach((label) => {
    if (label.textContent.trim() === 'R') label.textContent = 'Release';
  });
}

function loadKnowledgeEngine() {
  if (document.querySelector('[data-knowledge-engine-loader]')) return;
  const script = document.createElement('script');
  script.src = './js/knowledge-engine.js?v=kb-wave-2';
  script.dataset.knowledgeEngineLoader = 'true';
  document.body.appendChild(script);
}

polishBuildStudioMetrics();
loadKnowledgeEngine();
setTimeout(polishBuildStudioMetrics, 250);
setTimeout(polishBuildStudioMetrics, 900);
setTimeout(loadKnowledgeEngine, 300);
