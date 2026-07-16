(() => {
  let active = null;
  let timer = null;
  let startedAt = 0;

  function ensureUi() {
    let root = document.querySelector('[data-processing-status]');
    if (root) return root;

    root = document.createElement('section');
    root.className = 'processing-status';
    root.dataset.processingStatus = 'idle';
    root.hidden = true;
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.innerHTML = `
      <div class="processing-status__inner">
        <div class="processing-status__copy">
          <span class="processing-status__spinner" aria-hidden="true"></span>
          <div>
            <strong data-processing-title>Processing</strong>
            <span data-processing-message>Founder OS is working.</span>
          </div>
        </div>
        <div class="processing-status__meta">
          <span data-processing-stage>Starting</span>
          <span data-processing-elapsed>0s</span>
        </div>
      </div>
      <div class="processing-status__track" aria-hidden="true"><span></span></div>`;
    document.body.appendChild(root);
    return root;
  }

  function ensureStyles() {
    if (document.querySelector('[data-processing-status-styles]')) return;
    const style = document.createElement('style');
    style.dataset.processingStatusStyles = 'true';
    style.textContent = `
      .processing-status{position:fixed;z-index:10000;top:0;left:0;right:0;background:#102c18;color:#fff;box-shadow:0 8px 26px rgba(7,25,12,.24);font-family:inherit}
      .processing-status[hidden]{display:none!important}
      .processing-status__inner{min-height:58px;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px;max-width:1600px;margin:0 auto}
      .processing-status__copy{display:flex;align-items:center;gap:12px;min-width:0}
      .processing-status__copy div{display:grid;gap:2px;min-width:0}
      .processing-status__copy strong{font-size:14px;line-height:1.2}
      .processing-status__copy span:not(.processing-status__spinner){font-size:12px;line-height:1.3;color:rgba(255,255,255,.78);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .processing-status__spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,.28);border-top-color:#fff;border-radius:50%;animation:nnos-spin .85s linear infinite;flex:0 0 auto}
      .processing-status__meta{display:flex;align-items:center;gap:12px;font-size:11px;font-weight:800;color:rgba(255,255,255,.78);white-space:nowrap}
      .processing-status__track{height:4px;background:rgba(255,255,255,.15);overflow:hidden}
      .processing-status__track span{display:block;width:34%;height:100%;background:#a8d99c;animation:nnos-progress 1.45s ease-in-out infinite}
      .processing-status[data-processing-status="success"]{background:#174f25}
      .processing-status[data-processing-status="error"]{background:#7a211d}
      .processing-status[data-processing-status="success"] .processing-status__spinner,.processing-status[data-processing-status="error"] .processing-status__spinner{animation:none;border-color:#fff}
      body.processing-active{padding-top:62px}
      button[aria-busy="true"]{cursor:progress;opacity:.78}
      @keyframes nnos-spin{to{transform:rotate(360deg)}}
      @keyframes nnos-progress{0%{transform:translateX(-110%)}50%{transform:translateX(190%)}100%{transform:translateX(430%)}}
      @media(max-width:700px){.processing-status__inner{align-items:flex-start;padding:9px 12px}.processing-status__meta{display:none}.processing-status__copy span:not(.processing-status__spinner){white-space:normal}.processing-status__spinner{margin-top:2px}}
      @media(prefers-reduced-motion:reduce){.processing-status__spinner,.processing-status__track span{animation-duration:2.8s}}
    `;
    document.head.appendChild(style);
  }

  function elapsedLabel() {
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }

  function render({ state = 'running', title, message, stage }) {
    ensureStyles();
    const root = ensureUi();
    root.hidden = false;
    root.dataset.processingStatus = state;
    const titleNode = root.querySelector('[data-processing-title]');
    const messageNode = root.querySelector('[data-processing-message]');
    const stageNode = root.querySelector('[data-processing-stage]');
    const elapsedNode = root.querySelector('[data-processing-elapsed]');
    if (titleNode && title) titleNode.textContent = title;
    if (messageNode && message) messageNode.textContent = message;
    if (stageNode && stage) stageNode.textContent = stage;
    if (elapsedNode) elapsedNode.textContent = elapsedLabel();
    document.body.classList.add('processing-active');
  }

  function start(options = {}) {
    clearTimeout(active?.hideTimer);
    startedAt = Date.now();
    active = { ...options };
    render({
      state: 'running',
      title: options.title || 'Processing request',
      message: options.message || 'Founder OS is preparing the operation.',
      stage: options.stage || 'Starting'
    });
    clearInterval(timer);
    timer = window.setInterval(() => {
      const elapsedNode = document.querySelector('[data-processing-elapsed]');
      if (elapsedNode) elapsedNode.textContent = elapsedLabel();
    }, 1000);
  }

  function update(options = {}) {
    if (!active) start(options);
    active = { ...active, ...options };
    render({
      state: 'running',
      title: active.title || 'Processing request',
      message: active.message || 'Founder OS is working.',
      stage: active.stage || 'Processing'
    });
  }

  function finish(state, options = {}) {
    clearInterval(timer);
    timer = null;
    active = { ...active, ...options };
    render({
      state,
      title: options.title || (state === 'success' ? 'Completed' : 'Needs attention'),
      message: options.message || (state === 'success' ? 'The operation completed successfully.' : 'The operation could not be completed.'),
      stage: options.stage || (state === 'success' ? 'Complete' : 'Stopped')
    });
    const delay = Number.isFinite(options.hideAfter) ? options.hideAfter : (state === 'success' ? 4200 : 8000);
    active.hideTimer = window.setTimeout(hide, delay);
  }

  function hide() {
    clearInterval(timer);
    timer = null;
    const root = document.querySelector('[data-processing-status]');
    if (root) root.hidden = true;
    document.body.classList.remove('processing-active');
    active = null;
  }

  window.NNOSProcessing = {
    start,
    update,
    success: (options) => finish('success', options),
    error: (options) => finish('error', options),
    hide,
    get active() { return Boolean(active); }
  };
})();
