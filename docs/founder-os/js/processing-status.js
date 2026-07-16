(() => {
  let active = null;
  let timer = null;
  let startedAt = 0;

  function ensureUi() {
    let root = document.querySelector('[data-processing-status]');
    if (root) return root;

    root = document.createElement('div');
    root.className = 'processing-modal';
    root.dataset.processingStatus = 'idle';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-live', 'polite');
    root.innerHTML = `
      <div class="processing-modal__backdrop"></div>
      <section class="processing-modal__card" aria-labelledby="processing-modal-title">
        <div class="processing-modal__header">
          <span class="processing-modal__spinner" aria-hidden="true"></span>
          <div>
            <strong id="processing-modal-title" data-processing-title>Processing</strong>
            <span data-processing-stage>Starting</span>
          </div>
          <span class="processing-modal__elapsed" data-processing-elapsed>0s</span>
        </div>
        <p data-processing-message>Founder OS is working.</p>
        <div class="processing-modal__track" aria-hidden="true"><span></span></div>
      </section>`;
    document.body.appendChild(root);
    return root;
  }

  function ensureStyles() {
    if (document.querySelector('[data-processing-status-styles]')) return;
    const style = document.createElement('style');
    style.dataset.processingStatusStyles = 'true';
    style.textContent = `
      .processing-modal{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;font-family:inherit}
      .processing-modal[hidden]{display:none!important}
      .processing-modal__backdrop{position:absolute;inset:0;background:rgba(8,24,13,.42);backdrop-filter:blur(2px)}
      .processing-modal__card{position:relative;width:min(460px,calc(100vw - 32px));background:#fffdf7;color:#142119;border:1px solid rgba(38,91,47,.22);border-radius:14px;box-shadow:0 24px 70px rgba(8,30,14,.28);padding:20px;display:grid;gap:14px}
      .processing-modal__header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px}
      .processing-modal__header div{display:grid;gap:2px}
      .processing-modal__header strong{font-size:17px;line-height:1.2}
      .processing-modal__header div span,.processing-modal__elapsed{font-size:11px;font-weight:800;color:#617065}
      .processing-modal__card p{margin:0;color:#4b5a4e;font-size:14px;line-height:1.5}
      .processing-modal__spinner{width:22px;height:22px;border:3px solid rgba(31,102,43,.2);border-top-color:#1d6b2e;border-radius:50%;animation:nnos-spin .85s linear infinite}
      .processing-modal__track{height:5px;border-radius:999px;background:rgba(34,105,47,.12);overflow:hidden}
      .processing-modal__track span{display:block;width:35%;height:100%;background:#3b8d49;animation:nnos-progress 1.4s ease-in-out infinite}
      .processing-modal[data-processing-status="success"] .processing-modal__card{border-color:rgba(38,122,55,.35)}
      .processing-modal[data-processing-status="error"] .processing-modal__card{border-color:rgba(150,47,40,.4)}
      .processing-modal[data-processing-status="success"] .processing-modal__spinner,.processing-modal[data-processing-status="error"] .processing-modal__spinner{animation:none}
      body.processing-active{overflow:hidden}
      button[aria-busy="true"]{cursor:progress;opacity:.72}
      @keyframes nnos-spin{to{transform:rotate(360deg)}}
      @keyframes nnos-progress{0%{transform:translateX(-110%)}50%{transform:translateX(190%)}100%{transform:translateX(430%)}}
      @media(prefers-reduced-motion:reduce){.processing-modal__spinner,.processing-modal__track span{animation-duration:2.8s}}
    `;
    document.head.appendChild(style);
  }

  function elapsedLabel() {
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  function render({ state = 'running', title, message, stage }) {
    ensureStyles();
    const root = ensureUi();
    root.hidden = false;
    root.dataset.processingStatus = state;
    root.querySelector('[data-processing-title]').textContent = title || 'Processing request';
    root.querySelector('[data-processing-message]').textContent = message || 'Founder OS is working.';
    root.querySelector('[data-processing-stage]').textContent = stage || 'Processing';
    root.querySelector('[data-processing-elapsed]').textContent = elapsedLabel();
    document.body.classList.add('processing-active');
  }

  function start(options = {}) {
    clearTimeout(active?.hideTimer);
    startedAt = Date.now();
    active = { ...options };
    render({ state: 'running', title: options.title, message: options.message, stage: options.stage });
    clearInterval(timer);
    timer = window.setInterval(() => {
      const node = document.querySelector('[data-processing-elapsed]');
      if (node) node.textContent = elapsedLabel();
    }, 1000);
  }

  function update(options = {}) {
    if (!active) return start(options);
    active = { ...active, ...options };
    render({ state: 'running', title: active.title, message: active.message, stage: active.stage });
  }

  function finish(state, options = {}) {
    clearInterval(timer);
    timer = null;
    render({
      state,
      title: options.title || (state === 'success' ? 'Completed' : 'Needs attention'),
      message: options.message || (state === 'success' ? 'The operation completed successfully.' : 'The operation could not be completed.'),
      stage: options.stage || (state === 'success' ? 'Complete' : 'Stopped')
    });
    const delay = Number.isFinite(options.hideAfter) ? options.hideAfter : (state === 'success' ? 2200 : 5000);
    active = { ...active, ...options, hideTimer: window.setTimeout(hide, delay) };
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
