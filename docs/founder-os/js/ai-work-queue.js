(() => {
  // FOS-ACTIONS-014: Phase 9 owns the read-only Founder queue presentation.
  const GATEWAY_URL = "https://founder-os-gateway.dmoseley1024.workers.dev";
  const FILTERS = ["all", "active", "ready", "needs-approval", "complete"];
  let currentQueue = null;
  let currentFilter = "all";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  function queueRoot() {
    const view = document.querySelector('[data-workspace="ai"]');
    if (!view) return null;
    let root = view.querySelector("[data-ai-work-queue-app]");
    if (!root) {
      root = document.createElement("div");
      root.setAttribute("data-ai-work-queue-app", "");
      view.insertBefore(root, view.firstChild);
    }
    return root;
  }

  function statusLabel(status) {
    return ({
      active: "In progress",
      ready: "Ready",
      blocked: "Blocked",
      "needs-approval": "Needs approval",
      complete: "Complete"
    })[status] || status;
  }

  function roleLabel(role) {
    return ({
      art: "Art",
      codex: "Codex",
      gemini: "Gemini",
      gpose: "GPose",
      duey: "Duey",
      founder: "Founder"
    })[role] || role;
  }

  function summaryCard(label, value, tone) {
    return `<article class="ai-queue-metric ai-queue-metric--${tone}">
      <span>${escapeHtml(label)}</span><strong>${Number(value || 0)}</strong>
    </article>`;
  }

  function evidenceDetails(item) {
    const evidence = Array.isArray(item.evidence) ? item.evidence : [];
    return `<details class="ai-queue-details" data-ai-queue-details="${escapeHtml(item.itemId)}">
      <summary>Assignment details</summary>
      <div class="ai-queue-detail-grid">
        <div><span>Workspace</span><strong>${escapeHtml(item.workspaceId)}</strong></div>
        <div><span>Owner</span><strong>${escapeHtml(roleLabel(item.ownerRole))}</strong></div>
        <div><span>Next action</span><strong>${escapeHtml(item.nextAction)}</strong></div>
        <div><span>Evidence</span><strong>${evidence.length ? `${evidence.length} submitted` : "Not submitted"}</strong></div>
      </div>
      ${evidence.map((record) => `<p class="ai-queue-evidence"><strong>${escapeHtml(record.summary)}</strong><br><span>${escapeHtml(record.reference)}</span></p>`).join("")}
    </details>`;
  }

  function assignmentCard(item) {
    const evidenceReady = Array.isArray(item.evidence) && item.evidence.length > 0;
    return `<article class="ai-queue-assignment" data-ai-queue-item="${escapeHtml(item.itemId)}">
      <div class="ai-queue-avatar" aria-hidden="true">${escapeHtml(roleLabel(item.ownerRole).charAt(0))}</div>
      <div class="ai-queue-assignment-main">
        <div class="ai-queue-assignment-heading">
          <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(roleLabel(item.ownerRole))} · Workspace: ${escapeHtml(item.workspaceId)}</span></div>
          <span class="status">${escapeHtml(statusLabel(item.status))}</span>
        </div>
        <div class="ai-queue-progress" aria-label="${Number(item.progress || 0)} percent complete"><span style="width:${Math.max(0, Math.min(100, Number(item.progress || 0)))}%"></span></div>
        <div class="ai-queue-assignment-meta">
          <span>${Number(item.progress || 0)}%</span>
          <span>${escapeHtml(item.nextAction)}</span>
          <span class="${evidenceReady ? "is-ready" : ""}">${evidenceReady ? "Evidence ready" : "Evidence pending"}</span>
        </div>
        ${evidenceDetails(item)}
      </div>
      <button type="button" class="ai-queue-detail-button" data-ai-queue-toggle="${escapeHtml(item.itemId)}">View details</button>
    </article>`;
  }

  function decisionCard(item) {
    return `<article class="ai-queue-decision" data-ai-queue-item="${escapeHtml(item.itemId)}">
      <div>
        <span class="eyebrow">Founder decision</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.nextAction)}</p>
        <small>Source: ${escapeHtml(roleLabel(item.ownerRole))} · ${item.evidence?.length || 0} evidence record(s)</small>
      </div>
      <button type="button" data-ai-queue-toggle="${escapeHtml(item.itemId)}">Review decision</button>
      ${evidenceDetails(item)}
    </article>`;
  }

  function readyRow(item) {
    return `<article class="ai-queue-row" data-ai-queue-item="${escapeHtml(item.itemId)}">
      <span class="ai-queue-avatar" aria-hidden="true">${escapeHtml(roleLabel(item.ownerRole).charAt(0))}</span>
      <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(roleLabel(item.ownerRole))}</span></div>
      <span class="ai-queue-priority ai-queue-priority--${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span>
      <span class="status">${escapeHtml(statusLabel(item.status))}</span>
      <span>${escapeHtml(item.nextAction)}</span>
      <button type="button" data-ai-queue-toggle="${escapeHtml(item.itemId)}">View details</button>
      ${evidenceDetails(item)}
    </article>`;
  }

  function visible(items) {
    return currentFilter === "all" ? items : items.filter((item) => item.status === currentFilter);
  }

  function renderQueue(queue) {
    const root = queueRoot();
    if (!root) return;
    const items = visible(Array.isArray(queue.items) ? queue.items : []);
    const decisions = items.filter((item) => item.status === "needs-approval");
    const active = items.filter((item) => ["active", "blocked"].includes(item.status));
    const next = items.filter((item) => item.status === "ready");
    const completed = items.filter((item) => item.status === "complete");

    root.innerHTML = `<section class="ai-work-queue" aria-labelledby="ai-work-queue-title">
      <header class="ai-work-queue-header">
        <div><div class="eyebrow">Governed AI operations</div><h2 id="ai-work-queue-title">AI Work Queue</h2>
        <p>See who is working, what is next, and what needs your decision.</p></div>
        <button type="button" data-ai-queue-refresh>Refresh now</button>
      </header>
      <div class="ai-queue-metrics">
        ${summaryCard("Active", queue.summary?.active, "active")}
        ${summaryCard("Ready", queue.summary?.ready, "ready")}
        ${summaryCard("Needs approval", queue.summary?.needsApproval, "approval")}
        ${summaryCard("Blocked", queue.summary?.blocked, "blocked")}
      </div>
      <nav class="ai-queue-filters" aria-label="AI work queue filters">
        ${FILTERS.map((filter) => `<button type="button" data-ai-queue-filter="${filter}" aria-pressed="${filter === currentFilter}">${filter === "all" ? "All" : statusLabel(filter)}</button>`).join("")}
      </nav>
      <section class="ai-queue-section ai-queue-attention">
        <div class="eyebrow">Your next actions</div><h3>What Needs Your Attention</h3>
        ${decisions.length ? decisions.map(decisionCard).join("") : '<div class="ai-queue-empty ai-queue-empty--safe"><strong>No Founder decisions waiting</strong><span>Protected work will appear here with its evidence when your approval is required.</span></div>'}
      </section>
      <section class="ai-queue-section"><div class="eyebrow">Active assignments</div><h3>Who is working now</h3>
        <div class="ai-queue-assignment-list">${active.length ? active.map(assignmentCard).join("") : '<div class="ai-queue-empty"><strong>No active assignments</strong><span>Ready work will appear here when a governed AI role claims it.</span></div>'}</div>
      </section>
      <section class="ai-queue-section"><div class="eyebrow">Up next</div><h3>Ready queue</h3>
        <div class="ai-queue-ready-list">${next.length ? next.map(readyRow).join("") : '<div class="ai-queue-empty"><strong>No work waiting</strong><span>The selected workspace has no ready assignments.</span></div>'}</div>
      </section>
      ${completed.length ? `<details class="ai-queue-completed"><summary>Completed work (${completed.length})</summary><div class="ai-queue-ready-list">${completed.map(readyRow).join("")}</div></details>` : ""}
      <p class="ai-queue-persistence">${queue.persisted ? "Live · queue history is preserved across devices" : "Queue storage is unavailable · no assignments can be changed"}</p>
    </section>`;
  }

  async function loadQueue() {
    const root = queueRoot();
    const workspace = window.NNOSActiveWorkspace;
    if (!root || !workspace) return null;
    currentQueue = {
      ok: true,
      workspaceId: workspace.id,
      items: [],
      summary: { active: 0, ready: 0, needsApproval: 0, blocked: 0, complete: 0 },
      persisted: false
    };
    renderQueue(currentQueue);
    try {
      const response = await fetch(`${GATEWAY_URL}/v1/workspaces/${encodeURIComponent(workspace.id)}/ai-work-queue?v=${Date.now()}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || "The queue could not be loaded.");
      if (body.workspaceId !== workspace.id) throw new Error("The queue response belongs to another workspace.");
      currentQueue = body;
      renderQueue(body);
      return body;
    } catch (error) {
      const notice = document.createElement("div");
      notice.className = "ai-queue-empty";
      notice.setAttribute("role", "status");
      notice.innerHTML = `<strong>Live queue temporarily unavailable</strong><span>${escapeHtml(error.message)}</span>`;
      root.querySelector(".ai-work-queue")?.prepend(notice);
      return null;
    }
  }

  document.addEventListener("click", (event) => {
    const refresh = event.target.closest("[data-ai-queue-refresh]");
    if (refresh) {
      refresh.disabled = true;
      loadQueue().catch(console.error).finally(() => { refresh.disabled = false; });
      return;
    }
    const filter = event.target.closest("[data-ai-queue-filter]");
    if (filter && currentQueue) {
      currentFilter = filter.dataset.aiQueueFilter;
      renderQueue(currentQueue);
      return;
    }
    const toggle = event.target.closest("[data-ai-queue-toggle]");
    if (toggle) {
      const details = document.querySelector(`[data-ai-queue-details="${CSS.escape(toggle.dataset.aiQueueToggle)}"]`);
      if (details) {
        details.open = true;
        details.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  });

  window.addEventListener("founder-os:workspace-view-changed", (event) => {
    if (event.detail?.target === "ai") loadQueue().catch(console.error);
  });
  window.NNOSAIWorkQueue = { reload: loadQueue, get state() { return currentQueue; } };
  if (document.body.dataset.activeView === "ai") loadQueue().catch(console.error);
})();
