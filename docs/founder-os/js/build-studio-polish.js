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

function loadGatewayClient() {
  loadScriptOnce('./js/gateway-client-v2.js?v=2.0.0', 'data-gateway-client-v2-loader');
}

function loadCanonicalBuildStudio() {
  loadScriptOnce('./js/canonical-build-studio.js?v=1.0.1', 'data-canonical-build-loader');
}

function loadFounderActions() {
  loadScriptOnce('./js/founder-actions.js?v=r3-actions-1', 'data-founder-actions-loader');
}

function loadKnowledgeEngine() {
  loadScriptOnce('./js/knowledge-engine.js?v=kb-wave-5', 'data-knowledge-engine-loader');
}

function loadRepositoryIntelligence() {
  loadScriptOnce('./js/repository-intelligence.js?v=r3-repo-intel-3', 'data-repository-intelligence-loader');
}

function loadMissionControl() {
  loadScriptOnce('./js/mission-control.js?v=r3-mission-5', 'data-mission-control-loader');
}

function loadAiOperations() {
  loadScriptOnce('./js/ai-operations.js?v=r3-ai-ops-3', 'data-ai-operations-loader');
}

function activeWorkspaceName() {
  return document.querySelector('.workspace-view.active')?.dataset.workspace || 'build';
}

function updateBottomActionBar() {
  const bars = document.querySelectorAll('[data-execution-bar]');
  const active = activeWorkspaceName();

  bars.forEach((bar) => {
    bar.hidden = bar.dataset.executionBar !== active;
  });

  document.body.classList.toggle('has-build-action-bar', active === 'build');
}

function watchWorkspaceChanges() {
  document.querySelectorAll('[data-workspace-button]').forEach((button) => {
    button.addEventListener('click', () => setTimeout(updateBottomActionBar, 50));
  });

  const main = document.querySelector('.main');
  if (main) new MutationObserver(updateBottomActionBar).observe(main, {
    attributes: true,
    subtree: true,
    attributeFilter: ['class']
  });
}

polishBuildStudioMetrics();
loadGatewayClient();
loadCanonicalBuildStudio();
loadFounderActions();
loadKnowledgeEngine();
loadRepositoryIntelligence();
loadMissionControl();
loadAiOperations();
updateBottomActionBar();
watchWorkspaceChanges();
setTimeout(polishBuildStudioMetrics, 250);
setTimeout(polishBuildStudioMetrics, 900);
setTimeout(loadGatewayClient, 25);
setTimeout(loadCanonicalBuildStudio, 75);
setTimeout(loadFounderActions, 200);
setTimeout(loadKnowledgeEngine, 300);
setTimeout(loadRepositoryIntelligence, 300);
setTimeout(loadMissionControl, 300);
setTimeout(loadAiOperations, 300);
setTimeout(updateBottomActionBar, 300);
