(() => {
  'use strict';

  function activeWorkspaceId() {
    const active = window.NNOSActiveWorkspace?.id || document.body.dataset.activeWorkspace || '';
    return active && active !== 'registry' ? active : 'founder-os';
  }

  function recordBelongsToWorkspace(record, workspaceId = activeWorkspaceId()) {
    return Array.isArray(record?.workspaces) && record.workspaces.includes(workspaceId);
  }

  // Scope rules are intentionally presentation-free. knowledge-engine.js is the
  // sole owner of Project Records rendering and interaction behavior.
  window.NNOSKnowledgeScope = Object.freeze({
    activeWorkspaceId,
    recordBelongsToWorkspace,
  });
})();
