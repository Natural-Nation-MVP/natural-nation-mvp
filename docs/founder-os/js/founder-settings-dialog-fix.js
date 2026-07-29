(() => {
  const PROFILE_KEY = 'founder-os-profile-v1';
  const DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const readJson = (key, fallback = {}) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch { return fallback; }
  };

  const profile = () => {
    const saved = readJson(PROFILE_KEY);
    return {
      name: saved.name || 'Dewane',
      role: saved.role || 'Founder',
      email: saved.email || '',
      notifications: saved.notifications !== false
    };
  };

  const closeOverlay = () => {
    const overlay = document.querySelector('[data-founder-settings-overlay]');
    if (!overlay) return;
    const returnFocus = overlay._returnFocus;
    overlay.remove();
    document.body.classList.remove('founder-dialog-open');
    returnFocus?.focus?.();
  };

  const refreshAccountTag = () => {
    const crumb = document.querySelector('.hero .crumb');
    if (crumb) delete crumb.dataset.accountSignature;
    window.dispatchEvent(new CustomEvent('founder-os:workspace-view-changed', {
      detail: { workspace: null, target: document.body.dataset.activeWorkspace || 'registry' }
    }));
  };

  const openOverlay = (trigger) => {
    document.querySelector('[data-founder-settings-overlay]')?.remove();
    const user = profile();
    const hasDraft = (() => {
      try { return Boolean(localStorage.getItem(DRAFT_KEY)); }
      catch { return false; }
    })();

    const overlay = document.createElement('div');
    overlay.className = 'founder-settings-overlay';
    overlay.dataset.founderSettingsOverlay = '';
    overlay.setAttribute('role', 'presentation');
    overlay._returnFocus = trigger;
    overlay.innerHTML = `
      <section class="founder-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="founder-settings-title">
        <header>
          <div><div class="eyebrow">Founder OS</div><h2 id="founder-settings-title">Account & Settings</h2></div>
          <button type="button" data-close-founder-settings aria-label="Close settings">×</button>
        </header>
        <form data-founder-settings-form>
          <div class="founder-settings-fields">
            <label>Display name<input name="name" value="${escapeHtml(user.name)}" maxlength="60" /></label>
            <label>Role<input name="role" value="${escapeHtml(user.role)}" maxlength="60" /></label>
            <label>Email<input name="email" type="email" value="${escapeHtml(user.email)}" placeholder="Optional" /></label>
            <label class="founder-setting-check"><input name="notifications" type="checkbox" ${user.notifications ? 'checked' : ''} /><span>Enable Founder OS notifications</span></label>
            <p class="muted">These settings are stored on this device until account authentication is connected.</p>
            ${hasDraft ? '<button type="button" data-clear-saved-setup>Clear Saved Workspace Setup</button>' : ''}
          </div>
          <footer><button type="submit" class="generate">Save Settings</button></footer>
        </form>
      </section>`;

    document.body.appendChild(overlay);
    document.body.classList.add('founder-dialog-open');

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('[data-close-founder-settings]')) {
        event.preventDefault();
        closeOverlay();
        return;
      }
      if (event.target.closest('[data-clear-saved-setup]')) {
        event.preventDefault();
        if (window.confirm('Remove the saved workspace setup from this device?')) {
          try { localStorage.removeItem(DRAFT_KEY); } catch {}
          event.target.closest('[data-clear-saved-setup]')?.remove();
        }
      }
    });

    overlay.querySelector('[data-founder-settings-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const nextProfile = {
        name: String(data.get('name') || 'Dewane').trim() || 'Dewane',
        role: String(data.get('role') || 'Founder').trim() || 'Founder',
        email: String(data.get('email') || '').trim(),
        notifications: data.get('notifications') === 'on'
      };
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile)); } catch {}
      closeOverlay();
      refreshAccountTag();
    });

    requestAnimationFrame(() => overlay.querySelector('input,button')?.focus());
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-founder-settings]');
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openOverlay(trigger);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.querySelector('[data-founder-settings-overlay]')) {
      event.preventDefault();
      closeOverlay();
      return;
    }
    const trigger = event.target.closest?.('[data-open-founder-settings]');
    if (trigger && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openOverlay(trigger);
    }
  }, true);
})();