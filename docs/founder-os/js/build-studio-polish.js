function loadScriptOnce(src, marker) {
  if (document.querySelector(`[${marker}]`)) return null;
  const script = document.createElement('script');
  script.src = src;
  script.setAttribute(marker, 'true');
  document.body.appendChild(script);
  return script;
}

function activeView() {
  return document.querySelector('.workspace-view.active')?.dataset.workspace || 'registry';
}

function updateBottomActionBar() {
  const target = activeView();
  const workspaceIsNaturalNation = window.NNOSActiveWorkspace?.id === 'natural-nation';
  document.querySelectorAll('[data-execution-bar]').forEach((bar) => {
    bar.hidden = !workspaceIsNaturalNation || bar.dataset.executionBar !== target;
  });
  document.body.classList.toggle('has-build-action-bar', workspaceIsNaturalNation && target === 'build');
}

function loadExecutionModules() {
  const asset = window.NNOSPaths.asset;
  loadScriptOnce(asset('js/processing-status.js?v=processing-v4&release=sprint-128-runtime-v2'), 'data-processing-status-loader');
  loadScriptOnce(asset('js/canonical-build-runtime-v2.js?v=sprint-128-runtime-v2'), 'data-canonical-build-loader');
  loadScriptOnce(asset('js/founder-actions.js?v=r3-actions-1'), 'data-founder-actions-loader');
  loadScriptOnce(asset('js/knowledge-engine.js?v=kb-wave-5'), 'data-knowledge-engine-loader');
  loadScriptOnce(asset('js/repository-intelligence.js?v=r3-repo-intel-3'), 'data-repository-intelligence-loader');
  loadScriptOnce(asset('js/mission-control.js?v=r3-mission-5'), 'data-mission-control-loader');
  loadScriptOnce(asset('js/ai-orchestration.js?v=processing-v4&release=sprint-128-runtime-v2'), 'data-ai-orchestration-loader');
  loadScriptOnce(asset('js/build-dispatch-bridge.js?v=processing-v4&release=sprint-128-runtime-v2'), 'data-build-dispatch-bridge-loader');
  loadScriptOnce(asset('js/natural-nation-final-pass.js?v=workspace-review-1'), 'data-natural-nation-final-pass-loader');
}

loadExecutionModules();
updateBottomActionBar();
window.addEventListener('founder-os:workspace-view-changed', updateBottomActionBar);
window.setTimeout(updateBottomActionBar, 300);