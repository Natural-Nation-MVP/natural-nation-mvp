(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';
  const PROFILE_KEY = 'founder-os-profile-v1';

  const safeJson = (value, fallback = null) => {
    try { return JSON.parse(value); } catch { return fallback; }
  };

  const profile = () => {
    const saved = safeJson(localStorage.getItem(PROFILE_KEY), {});
    return { name: saved?.name || 'Dewane', role: saved?.role || 'Founder', email: saved?.email || '', notifications: saved?.notifications !== false };
  };

  const draftState = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { available: false, valid: false };
    const parsed = safeJson(raw);
    const valid = Boolean(parsed && typeof parsed === 'object' && Number(parsed.step) >= 1 && Number(parsed.step) <= 6 && parsed.input && typeof parsed.input === 'object');
    return { available: true, valid, parsed };
  };

  function showDialog({ title, eyebrow, body, actions = '' }) {
    const existing = $('[data-founder-system-dialog]');
    existing?.remove();
    const dialog = document.createElement('dialog');
    dialog.className = 'founder-system-dialog';
    dialog.dataset.founderSystemDialog = '';
    dialog.innerHTML = `<form method="dialog"><header><div><div class="eyebrow">${eyebrow}</div><h2>${title}</h2></div><button value="close" aria-label="Close dialog">×</button></header><div class="founder-system-dialog__body">${body}</div>${actions ? `<footer>${actions}</footer>` : ''}</form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
    requestAnimationFrame(() => dialog.querySelector('button,[href],input,select,textarea')?.focus());
    return dialog;
  }

  function renderAccountTag() {
    const crumb = $('.hero .crumb');
    if (!crumb || document.body.dataset.activeWorkspace !== 'registry') return;
    const user = profile();
    crumb.textContent = '';
    crumb.classList.add('founder-account-tag');
    crumb.setAttribute('role', 'button');
    crumb.tabIndex = 0;
    crumb.dataset.openFounderSettings = '';
    crumb.setAttribute('aria-label', `Open Founder OS settings for ${user.name}`);
    crumb.innerHTML = `<span class="founder-account-tag__avatar">${user.name.slice(0, 1).toUpperCase()}</span><span><strong>Welcome back, ${user.name}</strong><small>${user.role} account · Settings</small></span>`;
  }

  function openSettings() {
    const user = profile();
    const dialog = showDialog({
      eyebrow: 'Founder OS',
      title: 'Account & Settings',
      body: `<label>Display name<input name="name" value="${user.name.replace(/"/g, '&quot;')}" maxlength="60" /></label><label>Role<input name="role" value="${user.role.replace(/"/g, '&quot;')}" maxlength="60" /></label><label>Email<input name="email" type="email" value="${user.email.replace(/"/g, '&quot;')}" placeholder="Optional" /></label><label class="founder-setting-check"><input name="notifications" type="checkbox" ${user.notifications ? 'checked' : ''} /> Enable Founder OS notifications</label><p class="muted">These settings are stored on this device until account authentication is connected.</p>`,
      actions: '<button type="button" data-save-founder-settings class="generate">Save Settings</button>'
    });
    dialog.querySelector('[data-save-founder-settings]')?.addEventListener('click', () => {
      const form = dialog.querySelector('form');
      const data = new FormData(form);
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: String(data.get('name') || 'Dewane').trim() || 'Dewane', role: String(data.get('role') || 'Founder').trim() || 'Founder', email: String(data.get('email') || '').trim(), notifications: data.get('notifications') === 'on' }));
      dialog.close();
      renderAccountTag();
    });
  }

  function cardHealth(card) {
    const status = card.dataset.launchStatus || 'active';
    const completion = Number.parseInt(card.querySelector('.workspace-launch-card-progress strong')?.textContent || '0', 10) || 0;
    const openable = Boolean(card.querySelector('[data-resume-workspace]:not(:disabled)'));
    if (!openable) return { tone: 'blocked', label: 'Cannot open', detail: 'No valid workspace route is available.' };
    if (status === 'archived') return { tone: 'archived', label: 'Archived', detail: 'Open in read-only mode to restore from Workspace Settings.' };
    if (status === 'setup') return { tone: 'warning', label: 'Setup incomplete', detail: 'Continue workspace definition before build work.' };
    if (completion < 25) return { tone: 'warning', label: 'Early stage', detail: 'Workspace foundation is still being established.' };
    return { tone: 'healthy', label: 'Healthy', detail: 'Workspace is available and ready to continue.' };
  }

  function openHealth() {
    const cards = $$('.workspace-card').filter((card) => !card.hidden);
    const rows = cards.map((card) => {
      const title = card.querySelector('.workspace-launch-card-title h3')?.textContent || 'Workspace';
      const health = cardHealth(card);
      return `<button type="button" class="founder-health-row" data-health-open-workspace="${card.dataset.workspaceId || ''}"><span><strong>${title}</strong><small>${health.detail}</small></span><em data-tone="${health.tone}">${health.label}</em></button>`;
    }).join('') || '<div class="founder-empty-state"><strong>No workspaces match the current view.</strong><p>Clear the search or select All Workspaces.</p></div>';
    showDialog({ eyebrow: 'Workspace Portfolio', title: 'Workspace Health', body: `<div class="founder-health-list">${rows}</div>` });
  }

  function updateEmptyState() {
    const grid = $('[data-workspace-registry-list]');
    const shell = $('[data-launch-portfolio]');
    if (!grid || !shell) return;
    let empty = shell.querySelector('[data-portfolio-empty]');
    const visible = $$('.workspace-card', grid).filter((card) => !card.hidden).length;
    if (!empty) {
      empty = document.createElement('div');
      empty.dataset.portfolioEmpty = '';
      empty.className = 'founder-empty-state';
      grid.insertAdjacentElement('afterend', empty);
    }
    empty.hidden = visible > 0;
    empty.innerHTML = '<strong>No workspaces found.</strong><p>Try a different search or choose another lifecycle filter.</p><button type="button" data-clear-workspace-search>Clear Search</button>';
  }

  function validateDraftControls() {
    const state = draftState();
    $$('[data-launch-action="resume"]').forEach((button) => {
      if (state.available && !state.valid) {
        button.disabled = true;
        button.classList.add('is-unavailable');
        button.title = 'The saved setup is damaged and must be cleared.';
        button.dataset.invalidDraft = '';
      }
    });
  }

  function gatewayOnline() {
    const text = $('[data-system-status]')?.textContent?.toLowerCase() || '';
    return /online|ready|connected|healthy/.test(text) && !/offline|error|failed|unavailable/.test(text);
  }

  function updateGatewayDependentActions() {
    const online = gatewayOnline();
    $$('[data-launch-action="create"], [data-lifecycle-action]').forEach((control) => {
      if (online) {
        if (control.dataset.gatewayDisabled) {
          control.disabled = false;
          control.classList.remove('is-unavailable');
          control.removeAttribute('title');
          delete control.dataset.gatewayDisabled;
        }
      } else if (!control.disabled) {
        control.disabled = true;
        control.classList.add('is-unavailable');
        control.title = 'Founder OS Gateway is unavailable.';
        control.dataset.gatewayDisabled = '';
      }
    });
  }

  function scrollCarousel(direction) {
    const track = $('[data-workspace-registry-list]');
    if (!track) return;
    const visible = $$('.workspace-card', track).filter((card) => !card.hidden);
    if (!visible.length) return;
    const first = visible[0];
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    const step = first.getBoundingClientRect().width + gap;
    track.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' });
  }

  function refresh() {
    renderAccountTag();
    validateDraftControls();
    updateEmptyState();
    updateGatewayDependentActions();
  }

  document.addEventListener('click', (event) => {
    const settings = event.target.closest('[data-open-founder-settings]');
    if (settings) { event.preventDefault(); openSettings(); return; }
    const health = event.target.closest('[data-launch-action="health"]');
    if (health) { event.preventDefault(); event.stopImmediatePropagation(); openHealth(); return; }
    const carousel = event.target.closest('[data-carousel-direction]');
    if (carousel && !carousel.disabled) { event.preventDefault(); event.stopImmediatePropagation(); scrollCarousel(carousel.dataset.carouselDirection); return; }
    if (event.target.closest('[data-clear-workspace-search]')) {
      const search = $('[data-launch-search]');
      if (search) { search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true })); search.focus(); }
      return;
    }
    const healthRow = event.target.closest('[data-health-open-workspace]');
    if (healthRow) {
      const card = $(`.workspace-card[data-workspace-id="${CSS.escape(healthRow.dataset.healthOpenWorkspace)}"]`);
      card?.querySelector('[data-resume-workspace]')?.click();
      healthRow.closest('dialog')?.close();
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-open-founder-settings]')) { event.preventDefault(); openSettings(); }
    if (event.key === 'Escape') $('[data-founder-system-dialog][open]')?.close();
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-launch-search]')) requestAnimationFrame(updateEmptyState);
  });

  window.addEventListener('founder-os:workspace-registry-rendered', () => setTimeout(refresh, 0));
  window.addEventListener('founder-os:workspace-view-changed', () => setTimeout(refresh, 0));
  window.addEventListener('founder-os:workspace-lifecycle-changed', () => setTimeout(refresh, 0));
  window.addEventListener('storage', refresh);

  new MutationObserver(() => requestAnimationFrame(refresh)).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'disabled', 'data-active-workspace'] });
  refresh();
})();