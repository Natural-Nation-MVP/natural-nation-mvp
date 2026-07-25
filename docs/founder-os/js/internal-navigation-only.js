(() => {
  const SAME_ORIGIN = window.location.origin;

  function isExternal(value) {
    if (!value) return false;
    try {
      const url = new URL(value, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) && url.origin !== SAME_ORIGIN;
    } catch {
      return false;
    }
  }

  function removeExternalLink(anchor) {
    if (!(anchor instanceof HTMLAnchorElement) || !isExternal(anchor.getAttribute('href'))) return;
    anchor.removeAttribute('href');
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
    anchor.setAttribute('role', 'text');
    anchor.setAttribute('aria-disabled', 'true');
    anchor.dataset.externalNavigationRemoved = 'true';
    anchor.classList.add('external-navigation-removed');
    anchor.textContent = anchor.textContent.replace(/\s*↗\s*$/, '');
  }

  function sanitize(root = document) {
    if (root instanceof HTMLAnchorElement) removeExternalLink(root);
    root.querySelectorAll?.('a[href]').forEach(removeExternalLink);
  }

  const nativeOpen = window.open.bind(window);
  window.open = (url, ...args) => {
    if (isExternal(url)) return null;
    return nativeOpen(url, ...args);
  };

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || !isExternal(anchor.getAttribute('href'))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    removeExternalLink(anchor);
  }, true);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) sanitize(node);
    }));
  });

  function start() {
    sanitize();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.NNOSInternalNavigationOnly = { sanitize, isExternal };
})();
