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
  loadScriptOnce('./js/knowledge-engine.js?v=kb-wave-4', 'data-knowledge-engine-loader');
}

function loadRepositoryIntelligence() {
  loadScriptOnce('./js/repository-intelligence.js?v=r3-repo-intel-2', 'data-repository-intelligence-loader');
}

function loadMissionControl() {
  loadScriptOnce('./js/mission-control.js?v=r3-mission-2', 'data-mission-control-loader');
}

function loadAiOperations() {
  loadScriptOnce('./js/ai-operations.js?v=r3-ai-ops-2', 'data-ai-operations-loader');
}

function activeWorkspaceName() {
  return document.querySelector('.workspace-view.active')?.dataset.workspace || 'build';
}

function updateBottomActionBar() {
  const bottomBar = document.querySelector('.bottom-bar');
  if (!bottomBar) return;

  const isBuildStudio = activeWorkspaceName() === 'build';
  bottomBar.style.display = isBuildStudio ? '' : 'none';
  document.body.classList.toggle('has-build-action-bar', isBuildStudio);
}

function watchWorkspaceChanges() {
  document.querySelectorAll('[data-workspace-button]').forEach((button) => {
    button.addEventListener('click', () => setTimeout(updateBottomActionBar, 50));
  });

  const main = document.querySelector('.main');
  if (main) new MutationObserver(updateBottomActionBar).observe(main, { attributes: true, subtree: true, attributeFilter: ['class'] });
}

polishBuildStudioMetrics();
loadKnowledgeEngine();
loadRepositoryIntelligence();
loadMissionControl();
loadAiOperations();
updateBottomActionBar();
watchWorkspaceChanges();
setTimeout(polishBuildStudioMetrics, 250);
setTimeout(polishBuildStudioMetrics, 900);
setTimeout(loadKnowledgeEngine, 300);
setTimeout(loadRepositoryIntelligence, 300);
setTimeout(loadMissionControl, 300);
setTimeout(loadAiOperations, 300);
setTimeout(updateBottomActionBar, 300);
