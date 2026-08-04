(function () {
  'use strict';

  var PROFILE_KEY = 'founder-os-profile-v1';
  var DRAFT_KEY = 'founder-os-workspace-discovery-draft-v4';
  var refreshQueued = false;

  function one(selector, root) { return (root || document).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function closest(target, selector) { return target && target.closest ? target.closest(selector) : null; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function read(key) { try { return localStorage.getItem(key); } catch (error) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); return true; } catch (error) { return false; } }
  function remove(key) { try { localStorage.removeItem(key); } catch (error) {} }
  function parse(value, fallback) { try { return JSON.parse(value); } catch (error) { return fallback; } }

  function profile() {
    var saved = parse(read(PROFILE_KEY) || '{}', {});
    return {
      name: saved && saved.name ? saved.name : 'Dewane',
      role: saved && saved.role ? saved.role : 'Founder',
      email: saved && saved.email ? saved.email : '',
      notifications: !saved || saved.notifications !== false
    };
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else if (dialog.parentNode) dialog.parentNode.removeChild(dialog);
  }

  function showDialog(title, eyebrow, body, actions) {
    var existing = one('[data-founder-system-dialog]');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var supportsDialog = typeof window.HTMLDialogElement !== 'undefined';
    var dialog = document.createElement(supportsDialog ? 'dialog' : 'div');
    dialog.className = supportsDialog ? 'founder-system-dialog' : 'founder-settings-overlay';
    dialog.setAttribute('data-founder-system-dialog', '');
    if (!supportsDialog) dialog.setAttribute('role', 'dialog');
    dialog.innerHTML = '<form><header><div><div class="eyebrow">' + esc(eyebrow) + '</div><h2>' + esc(title) + '</h2></div><button type="button" data-close-founder-dialog aria-label="Close dialog">×</button></header><div class="founder-system-dialog__body">' + body + '</div>' + (actions ? '<footer>' + actions + '</footer>' : '') + '</form>';
    document.body.appendChild(dialog);
    if (supportsDialog && typeof dialog.showModal === 'function') dialog.showModal();
    else document.body.classList.add('founder-dialog-open');
    var closeButton = one('[data-close-founder-dialog]', dialog);
    if (closeButton) closeButton.onclick = function () { closeDialog(dialog); document.body.classList.remove('founder-dialog-open'); };
    if (supportsDialog) dialog.addEventListener('close', function () { if (dialog.parentNode) dialog.parentNode.removeChild(dialog); });
    return dialog;
  }

  function renderAccountTag() {
    var crumb = one('.hero .crumb');
    if (!crumb || document.body.getAttribute('data-active-workspace') !== 'registry') return;
    var user = profile();
    var signature = user.name + '|' + user.role;
    if (crumb.getAttribute('data-account-signature') !== signature || !one('[data-open-founder-settings]', crumb)) {
      crumb.setAttribute('data-account-signature', signature);
      crumb.classList.add('founder-account-tag');
      crumb.innerHTML = '<button type="button" class="founder-account-button" data-open-founder-settings aria-label="Open Founder OS settings for ' + esc(user.name) + '"><span class="founder-account-tag__avatar" aria-hidden="true">' + esc(user.name.slice(0, 1).toUpperCase()) + '</span><span class="founder-account-tag__copy"><strong>Welcome back, ' + esc(user.name) + '</strong><small>' + esc(user.role) + ' account</small></span><span class="founder-account-tag__chevron" aria-hidden="true">›</span></button>';
    }
    var button = one('[data-open-founder-settings]', crumb);
    if (button && button.getAttribute('data-direct-settings-ready') !== '054') {
      button.setAttribute('data-direct-settings-ready', '054');
      button.onclick = function (event) { event.preventDefault(); openSettings(); };
    }
  }

  function openSettings() {
    var user = profile();
    var hasDraft = Boolean(read(DRAFT_KEY));
    var body = '<label>Display name<input name="name" value="' + esc(user.name) + '" maxlength="60"></label>' +
      '<label>Role<input name="role" value="' + esc(user.role) + '" maxlength="60"></label>' +
      '<label>Email<input name="email" type="email" value="' + esc(user.email) + '" placeholder="Optional"></label>' +
      '<label class="founder-setting-check"><input name="notifications" type="checkbox" ' + (user.notifications ? 'checked' : '') + '> Enable Founder OS notifications</label>' +
      '<p class="muted">These settings are stored on this device until account authentication is connected.</p>' +
      (hasDraft ? '<button type="button" data-clear-saved-setup>Clear Saved Workspace Setup</button>' : '');
    var dialog = showDialog('Account & Settings', 'Founder OS', body, '<button type="button" data-save-founder-settings class="generate">Save Settings</button>');
    var save = one('[data-save-founder-settings]', dialog);
    if (save) save.onclick = function () {
      var form = one('form', dialog);
      var data = new FormData(form);
      write(PROFILE_KEY, JSON.stringify({
        name: String(data.get('name') || 'Dewane').trim() || 'Dewane',
        role: String(data.get('role') || 'Founder').trim() || 'Founder',
        email: String(data.get('email') || '').trim(),
        notifications: data.get('notifications') === 'on'
      }));
      closeDialog(dialog);
      document.body.classList.remove('founder-dialog-open');
      var crumb = one('.hero .crumb');
      if (crumb) crumb.removeAttribute('data-account-signature');
      scheduleRefresh();
    };
    var clear = one('[data-clear-saved-setup]', dialog);
    if (clear) clear.onclick = function () {
      if (window.confirm('Remove the saved workspace setup from this device?')) {
        remove(DRAFT_KEY); closeDialog(dialog); document.body.classList.remove('founder-dialog-open');
      }
    };
    return dialog;
  }

  function bindWorkspaceButtons() {
    all('[data-open-workspace]').forEach(function (button) {
      if (button.getAttribute('data-direct-workspace-ready') === '054') return;
      button.setAttribute('data-direct-workspace-ready', '054');
      button.onclick = function (event) {
        event.preventDefault();
        var workspaceId = button.getAttribute('data-open-workspace');
        var manager = window.NNOSNavigationManager;
        if (manager && typeof manager.openWorkspace === 'function' && workspaceId) {
          manager.openWorkspace(workspaceId, 'open-workspace-button');
        }
      };
    });
  }

  function updateProtectedApproval() {
    var checkbox = one('[data-workspace-confirm]');
    var createButton = one('[data-workspace-create-protected]');
    if (!checkbox || !createButton) return;
    createButton.disabled = !checkbox.checked;
    createButton.setAttribute('aria-disabled', checkbox.checked ? 'false' : 'true');
    var wrapper = closest(checkbox, '.workspace-confirmation');
    if (wrapper) wrapper.classList.toggle('is-confirmed', checkbox.checked);
  }

  function refresh() { renderAccountTag(); bindWorkspaceButtons(); updateProtectedApproval(); }
  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(function () { refreshQueued = false; refresh(); });
  }

  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches && event.target.matches('[data-workspace-confirm]')) updateProtectedApproval();
  }, true);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var dialog = one('[data-founder-system-dialog]');
      if (dialog) { closeDialog(dialog); document.body.classList.remove('founder-dialog-open'); }
    }
  }, false);

  ['founder-os:workspace-registry-rendered', 'founder-os:workspace-view-changed', 'founder-os:workspace-lifecycle-changed'].forEach(function (name) {
    window.addEventListener(name, scheduleRefresh);
  });
  window.addEventListener('storage', scheduleRefresh);

  window.NNOSFounderHome = { openSettings: openSettings, refresh: scheduleRefresh };
  scheduleRefresh();
})();