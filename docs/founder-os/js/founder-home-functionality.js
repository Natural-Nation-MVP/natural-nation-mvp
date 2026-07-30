(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';
  const PROFILE_KEY = 'founder-os-profile-v1';
  let refreshQueued = false;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const writeStorage = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
  const removeStorage = (key) => { try { localStorage.removeItem(key); return true; } catch { return false; } };
  const safeJson = (value, fallback = null) => { try { return JSON.parse(value); } catch { return fallback; } };

  const profile = () => {
    const saved = safeJson(readStorage(PROFILE_KEY), {});
    return { name: saved?.name || 'Dewane', role: saved?.role || 'Founder', email: saved?.email || '', notifications: saved?.notifications !== false };
  };

  const draftState = () => {
    const raw = readStorage(DRAFT_KEY);
    if (!raw) return { available: false, valid: false };
    const parsed = safeJson(raw);
    const valid = Boolean(parsed && typeof parsed === 'object' && Number(parsed.step) >= 1 && Number(parsed.step) <= 6 && parsed.input && typeof parsed.input === 'object');
    return { available: true, valid };
  };

  function showDialog({ title, eyebrow, body, actions = '' }) {
    $('[data-founder-system-dialog]')?.remove();
    const dialog = document.createElement('dialog');
    dialog.className = 'founder-system-dialog';
    dialog.dataset.founderSystemDialog = '';
    dialog.innerHTML = `<form method="dialog"><header><div><div class="eyebrow">${esc(eyebrow)}</div><h2>${esc(title)}</h2></div><button value="close" aria-label="Close dialog">×</button></header><div class="founder-system-dialog__body">${body}</div>${actions ? `<footer>${actions}</footer>` : ''}</form>`;
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
    const signature = `${user.name}|${user.role}`;
    if (crumb.dataset.accountSignature === signature && crumb.querySelector('[data-open-founder-settings]')) return;
    crumb.dataset.accountSignature = signature;
    crumb.classList.add('founder-account-tag');
    crumb.innerHTML = `<button type="button" class="founder-account-button" data-open-founder-settings aria-label="Open Founder OS settings for ${esc(user.name)}"><span class="founder-account-tag__avatar" aria-hidden="true">${esc(user.name.slice(0, 1).toUpperCase())}</span><span class="founder-account-tag__copy"><strong>Welcome back, ${esc(user.name)}</strong><small>${esc(user.role)} account</small></span><span class="founder-account-tag__chevron" aria-hidden="true">›</span></button>`;
  }

  function openSettings() {
    const user = profile();
    const draft = draftState();
    const dialog = showDialog({
      eyebrow: 'Founder OS', title: 'Account & Settings',
      body: `<label>Display name<input name="name" value="${esc(user.name)}" maxlength="60" /></label><label>Role<input name="role" value="${esc(user.role)}" maxlength="60" /></label><label>Email<input name="email" type="email" value="${esc(user.email)}" placeholder="Optional" /></label><label class="founder-setting-check"><input name="notifications" type="checkbox" ${user.notifications ? 'checked' : ''} /> Enable Founder OS notifications</label><p class="muted">These settings are stored on this device until account authentication is connected.</p>${draft.available ? `<button type="button" data-clear-saved-setup>${draft.valid ? 'Clear Saved Workspace Setup' : 'Remove Damaged Saved Setup'}</button>` : ''}`,
      actions: '<button type="button" data-save-founder-settings class="generate">Save Settings</button>'
    });
    dialog.querySelector('[data-save-founder-settings]')?.addEventListener('click', () => {
      const data = new FormData(dialog.querySelector('form'));
      writeStorage(PROFILE_KEY, JSON.stringify({ name: String(data.get('name') || 'Dewane').trim() || 'Dewane', role: String(data.get('role') || 'Founder').trim() || 'Founder', email: String(data.get('email') || '').trim(), notifications: data.get('notifications') === 'on' }));
      dialog.close();
      const crumb = $('.hero .crumb');
      if (crumb) delete crumb.dataset.accountSignature;
      scheduleRefresh();
    });
    dialog.querySelector('[data-clear-saved-setup]')?.addEventListener('click', () => {
      if (confirm('Remove the saved workspace setup from this device?')) { removeStorage(DRAFT_KEY); dialog.close(); scheduleRefresh(); }
    });
  }

  function cardHealth(card) {
    const status = card.dataset.launchStatus || 'active';
    const completion = Number.parseInt(card.querySelector('.workspace-launch-card-progress strong')?.textContent || '0', 10) || 0;
    const openable = Boolean(card.dataset.pageLinkWorkspace || card.dataset.workspaceId);
    if (!openable) return { tone: 'blocked', label: 'Cannot open', detail: 'No valid workspace route is available.' };
    if (status === 'archived') return { tone: 'archived', label: 'Archived', detail: 'Open in read-only mode and restore from Workspace Settings.' };
    if (status === 'setup') return { tone: 'warning', label: 'Setup incomplete', detail: 'Continue workspace definition before build work.' };
    if (completion < 25) return { tone: 'warning', label: 'Early stage', detail: 'Workspace foundation is still being established.' };
    return { tone: 'healthy', label: 'Healthy', detail: 'Workspace is available and ready to continue.' };
  }

  function openHealth() {
    const cards = $$('.workspace-card').filter((card) => !card.hidden);
    const rows = cards.map((card) => {
      const title = card.querySelector('.workspace-launch-card-title h3')?.textContent || 'Workspace';
      const health = cardHealth(card);
      return `<button type="button" class="founder-health-row" data-health-open-workspace="${esc(card.dataset.pageLinkWorkspace || card.dataset.workspaceId || '')}"><span><strong>${esc(title)}</strong><small>${esc(health.detail)}</small></span><em data-tone="${health.tone}">${health.label}</em></button>`;
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
      empty.innerHTML = '<strong>No workspaces found.</strong><p>Try a different search or choose another lifecycle filter.</p><button type="button" data-clear-workspace-search>Clear Search</button>';
      grid.insertAdjacentElement('afterend', empty);
    }
    empty.hidden = visible > 0;
  }

  function validateDraftControls() {
    const state = draftState();
    $$('[data-launch-action="resume"]').forEach((button) => {
      if (state.available && !state.valid) {
        button.disabled = true; button.classList.add('is-unavailable'); button.title = 'The saved setup is damaged. Remove it from Founder settings.'; button.dataset.invalidDraft = '';
      } else if (button.dataset.invalidDraft) {
        delete button.dataset.invalidDraft; button.classList.remove('is-unavailable'); button.removeAttribute('title'); button.disabled = !state.available;
      }
    });
  }

  function gatewayOnline() {
    const text = $('[data-system-status]')?.textContent?.toLowerCase() || '';
    if (/checking|loading/.test(text)) return null;
    return /online|ready|connected|healthy/.test(text) && !/offline|error|failed|unavailable/.test(text);
  }

  function updateGatewayDependentActions() {
    const online = gatewayOnline();
    if (online === null) return;
    $$('[data-launch-action="create"], [data-lifecycle-action]').forEach((control) => {
      if (online && control.dataset.gatewayDisabled) {
        control.disabled = false; control.classList.remove('is-unavailable'); control.removeAttribute('title'); delete control.dataset.gatewayDisabled;
      } else if (!online && !control.disabled) {
        control.disabled = true; control.classList.add('is-unavailable'); control.title = 'Founder OS Gateway is unavailable.'; control.dataset.gatewayDisabled = '';
      }
    });
  }

  function updateProtectedApproval() {
    const checkbox = $('[data-workspace-confirm]');
    const createButton = $('[data-workspace-create-protected]');
    if (!checkbox || !createButton) return;
    createButton.disabled = !checkbox.checked;
    createButton.setAttribute('aria-disabled', String(!checkbox.checked));
    checkbox.closest('.workspace-confirmation')?.classList.toggle('is-confirmed', checkbox.checked);
  }

  function scrollCarousel(direction) {
    const track = $('[data-workspace-registry-list]');
    const first = track && $$('.workspace-card', track).find((card) => !card.hidden);
    if (!track || !first) return;
    const style = getComputedStyle(track);
    const gap = Number.parseFloat(style.columnGap || style.gap || '0') || 0;
    track.scrollBy({ left: (first.getBoundingClientRect().width + gap) * (direction === 'next' ? 1 : -1), behavior: 'smooth' });
  }

  function refresh() { renderAccountTag(); validateDraftControls(); updateEmptyState(); updateGatewayDependentActions(); updateProtectedApproval(); }
  function scheduleRefresh() { if (refreshQueued) return; refreshQueued = true; requestAnimationFrame(() => { refreshQueued = false; refresh(); }); }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-founder-settings]')) { event.preventDefault(); openSettings(); return; }
    if (event.target.closest('[data-founder-home-tag]')) { event.preventDefault(); window.NNOSPageLinks?.openHome(); return; }
    if (event.target.closest('[data-launch-action="health"]')) { event.preventDefault(); openHealth(); return; }
    const carousel = event.target.closest('[data-carousel-direction]');
    if (carousel && !carousel.disabled) { event.preventDefault(); scrollCarousel(carousel.dataset.carouselDirection); return; }
    if (event.target.closest('[data-clear-workspace-search]')) {
      const search = $('[data-launch-search]');
      if (search) { search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true })); search.focus(); }
      return;
    }
    const healthRow = event.target.closest('[data-health-open-workspace]');
    if (healthRow) {
      event.preventDefault();
      healthRow.closest('dialog')?.close();
      window.NNOSPageLinks?.openWorkspace(healthRow.dataset.healthOpenWorkspace);
    }
  });

  document.addEventListener('change', (event) => { if (event.target.matches('[data-workspace-confirm]')) updateProtectedApproval(); }, true);
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-founder-home-tag]')) {
      event.preventDefault();
      window.NNOSPageLinks?.openHome();
    }
    if (event.key === 'Escape') $('[data-founder-system-dialog][open]')?.close();
  });
  document.addEventListener('input', (event) => { if (event.target.matches('[data-launch-search]')) scheduleRefresh(); });
  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed', 'founder-os:workspace-lifecycle-changed'].forEach((name) => window.addEventListener(name, scheduleRefresh));
  window.addEventListener('storage', scheduleRefresh);

  new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.type === 'childList' || ['hidden', 'disabled', 'data-active-workspace'].includes(mutation.attributeName))) scheduleRefresh();
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'disabled', 'data-active-workspace'] });

  scheduleRefresh();
})();