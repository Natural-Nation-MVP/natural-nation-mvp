function polishBuildStudioMetrics() {
  document.querySelectorAll('.metric span').forEach((label) => {
    if (label.textContent.trim() === 'R') label.textContent = 'Release';
  });
}

function loadScriptOnce(src, marker) {
  if (document.querySelector(`[${marker}]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.setAttribute(marker, 'true');
  document.body.appendChild(script);
}

function loadKnowledgeEngine() {
  loadScriptOnce('./js/knowledge-engine.js?v=kb-wave-2', 'data-knowledge-engine-loader');
}

function loadRepositoryIntelligence() {
  loadScriptOnce('./js/repository-intelligence.js?v=r3-repo-intel-1', 'data-repository-intelligence-loader');
}

polishBuildStudioMetrics();
loadKnowledgeEngine();
loadRepositoryIntelligence();
setTimeout(polishBuildStudioMetrics, 250);
setTimeout(polishBuildStudioMetrics, 900);
setTimeout(loadKnowledgeEngine, 300);
setTimeout(loadRepositoryIntelligence, 300);
