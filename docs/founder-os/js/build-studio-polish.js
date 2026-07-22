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
  loadScriptOnce('./founder-os/js/processing-status.js?v=processing-v4&release=founder-review', 'data-processing-status-loader');
  loadScriptOnce('./founder-os/js/canonical-build-studio.js?v=processing-v4&release=founder-review', 'data-canonical-build-loader');
  loadScriptOnce('./founder-os/js/founder-actions.js?v=r3-actions-1', 'data-founder-actions-loader');
  loadScriptOnce('./founder-os/js/knowledge-engine.js?v=kb-wave-5', 'data-knowledge-engine-loader');
  loadScriptOnce('./founder-os/js/repository-intelligence.js?v=r3-repo-intel-3', 'data-repository-intelligence-loader');
  loadScriptOnce('./founder-os/js/mission-control.js?v=r3-mission-5', 'data-mission-control-loader');
  loadScriptOnce('./founder-os/js/ai-orchestration.js?v=processing-v4&release=founder-review', 'data-ai-orchestration-loader');
  loadScriptOnce('./founder-os/js/build-dispatch-bridge.js?v=processing-v4&release=founder-review', 'data-build-dispatch-bridge-loader');
  loadScriptOnce('./founder-os/js/natural-nation-final-pass.js?v=workspace-review-1', 'data-natural-nation-final-pass-loader');
}

loadExecutionModules();
updateBottomActionBar();
window.addEventListener('founder-os:workspace-view-changed', updateBottomActionBar);
window.setTimeout(updateBottomActionBar, 300);