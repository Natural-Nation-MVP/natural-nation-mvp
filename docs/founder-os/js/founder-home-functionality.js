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
    else dialog.remove();
  }

  function showDialog(title, eyebrow, body, actions) {
    var existing = one('[data-founder-system-dialog]');
    if (existing) existing.remove();
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
    if (closeButton) closeButton.addEventListener('click', function () { closeDialog(dialog); document.body.classList.remove('founder-dialog-open'); });
    if (supportsDialog) dialog.addEventListener('close', function () { dialog.remove(); });
    requestAnimationFrame(function () {
      var focusTarget = one('button,input,select,textarea', dialog);
      if (focusTarget) focusTarget.focus();
    });
    return dialog;
  }

  function renderAccountTag() {
    var crumb = one('.hero .crumb');
    if (!crumb || document.body.getAttribute('data-active-workspace') !== 'registry') return;
    var user = profile();
    var signature = user.name + '|' + user.role;
    if (crumb.getAttribute('data-account-signature') === signature && one('[data-open-founder-settings]', crumb)) return;
    crumb.setAttribute('data-account-signature', signature);
    crumb.classList.add('founder-account-tag');
    crumb.innerHTML = '<button type="button" class="founder-account-button" data-open-founder-settings aria-label="Open Founder OS settings for ' + esc(user.name) + '"><span class="founder-account-tag__avatar" aria-hidden="true">' + esc(user.name.slice(0, 1).toUpperCase()) + '</span><span class="founder-account-tag__copy"><strong>Welcome back, ' + esc(user.name) + '</strong><small>' + esc(user.role) + ' account</small></span><span class="founder-account-tag__chevron" aria-hidden="true">›</span></button>';
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
    if (save) save.addEventListener('click', function () {
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
    });
    var clear = one('[data-clear-saved-setup]', dialog);
    if (clear) clear.addEventListener('click', function () {
      if (window.confirm('Remove the saved workspace setup from this device?')) {
        remove(DRAFT_KEY);
        closeDialog(dialog);
        document.body.classList.remove('founder-dialog-open');
      }
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

  function scrollCarousel(direction) {
    var track = one('[data-workspace-registry-list]');
    var cards = track ? all('.workspace-card', track).filter(function (card) { return !card.hidden; }) : [];
    if (!track || !cards.length) return;
    var style = window.getComputedStyle(track);
    var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    var amount = cards[0].getBoundingClientRect().width + gap;
    try { track.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' }); }
    catch (error) { track.scrollLeft += direction === 'next' ? amount : -amount; }
  }

  function refresh() {
    renderAccountTag();
    updateProtectedApproval();
  }

  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(function () { refreshQueued = false; refresh(); });
  }

  document.addEventListener('click', function (event) {
    var settings = closest(event.target, '[data-open-founder-settings]');
    if (settings) { event.preventDefault(); openSettings(); return; }
    var carousel = closest(event.target, '[data-carousel-direction]');
    if (carousel && !carousel.disabled) {
      event.preventDefault();
      scrollCarousel(carousel.getAttribute('data-carousel-direction'));
      return;
    }
    var healthRow = closest(event.target, '[data-health-open-workspace]');
    if (healthRow && window.NNOSNavigationManager) {
      event.preventDefault();
      var dialog = closest(healthRow, 'dialog,[data-founder-system-dialog]');
      closeDialog(dialog);
      window.NNOSNavigationManager.openWorkspace(healthRow.getAttribute('data-health-open-workspace'), 'health-dialog');
    }
  }, false);

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
  scheduleRefresh();
})();