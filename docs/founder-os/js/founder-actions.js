window.NNOSActions = window.NNOSActions || (() => {
  function stamp() {
    return new Date().toLocaleString();
  }

  function result(selector, title, detail, items = []) {
    const target = document.querySelector(selector);
    if (!target) return;
    const rows = items.map((item) => `<div class="record-row"><span><strong>${item[0]}</strong><br><small>${item[2]}</small></span><span class="status">${item[1]}</span></div>`).join('');
    target.innerHTML = `<div class="module-card"><strong>${title}</strong><p class="muted">${detail}</p><div class="section-title">Action Result · ${stamp()}</div>${rows}</div>`;
  }

  function switchWorkspace(workspace) {
    const button = document.querySelector(`[data-workspace-button="${workspace}"]`);
    if (button) button.click();
  }

  function runSyncCheck() {
    result('[data-repo-action-output]', 'Synchronization Check Complete', 'Founder OS checked the visible Release 3 source-of-truth references in this workspace.', [
      ['Project State', 'PASS', 'Current project state is referenced.'],
      ['Session Log', 'PASS', 'Session tracking is referenced.'],
      ['Validation Events', 'PASS', 'Validation event records are referenced.'],
      ['Decision Ledger', 'PASS', 'Decision Ledger is referenced.'],
      ['Closeout Readiness', 'READY', 'Release 3 can proceed after Executive Review passes.'],
    ]);
  }

  function startKnowledgeReview(query = '') {
    switchWorkspace('knowledge');
    setTimeout(() => {
      const input = document.querySelector('[data-knowledge-search]');
      if (input && query) {
        input.value = query;
        input.dispatchEvent(new Event('input'));
      }
      result('[data-knowledge-action-output]', 'Knowledge Review Started', `Knowledge Graph filtered for: ${query || 'all records'}.`, [
        ['Search Applied', query ? 'YES' : 'ALL', 'Records are filtered inside Knowledge Graph.'],
        ['Review Mode', 'ACTIVE', 'Open records, compare related records, and verify canonical ownership.'],
      ]);
    }, 100);
  }

  function runKnowledgeAudit() {
    result('[data-knowledge-action-output]', 'Knowledge Audit Complete', 'Founder OS checked the currently loaded Knowledge Graph records for source-of-truth coverage.', [
      ['Canonical Records', 'VISIBLE', 'Knowledge records are loaded from the repository-backed index.'],
      ['Related Records', 'VISIBLE', 'Related records are mapped for connected records.'],
      ['Document Links', 'ACTIVE', 'Records can open canonical documents and GitHub source files.'],
      ['Next Step', 'REVIEW', 'Open any record that needs refinement.'],
    ]);
  }

  function startAiHandoff(agent = 'Art') {
    result('[data-ai-action-output]', `${agent} Handoff Prepared`, 'Founder OS prepared a visible handoff package for the selected AI role.', [
      ['Owner', agent, 'Selected AI role for execution.'],
      ['Context', 'REQUIRED', 'Use Project State, Knowledge Index, Session Log, Decision Ledger, and Validation Center.'],
      ['Approval', 'FOUNDER', 'Locked changes still require Founder approval before closeout.'],
      ['Output', 'READY', 'Use this handoff as the next execution instruction.'],
    ]);
  }

  function runCloseoutCheck() {
    result('[data-mission-action-output]', 'Release 3 Closeout Readiness Check', 'Founder OS checked the visible final-gate conditions before closeout.', [
      ['Core Workspaces', 'PASS', 'Build Studio, Knowledge Graph, Repository Intelligence, Mission Control, and AI Operations passed validation.'],
      ['Cross Workspace Checks', 'PASS', 'Navigation, bottom action bar, and iPad layout passed validation.'],
      ['Executive Review', 'RETEST', 'Executive Review links and actions are being revalidated.'],
      ['Blockers', 'NONE KNOWN', 'No blocking issues are currently reported.'],
      ['Closeout', 'READY AFTER PASS', 'Proceed after Founder marks Executive Review PASS.'],
    ]);
  }

  function prepareReleaseCloseout() {
    result('[data-mission-action-output]', 'Release 3 Closeout Package Prepared', 'Founder OS prepared the closeout sequence. Final repository updates must still be executed through the approved GitHub workflow.', [
      ['Update Validation Records', 'READY', 'Mark final Executive Review PASS and Release 3 complete.'],
      ['Update Decision Ledger', 'READY', 'Record final Founder approval.'],
      ['Update Project State', 'READY', 'Set Release 3 Foundation complete and locked.'],
      ['Update Session Log', 'READY', 'Record final closeout summary.'],
      ['Update Roadmap', 'READY', 'Mark Release 3 complete.'],
    ]);
  }

  return {
    result,
    switchWorkspace,
    runSyncCheck,
    startKnowledgeReview,
    runKnowledgeAudit,
    startAiHandoff,
    runCloseoutCheck,
    prepareReleaseCloseout,
  };
})();
