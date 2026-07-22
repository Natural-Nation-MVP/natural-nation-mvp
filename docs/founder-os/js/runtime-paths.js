(() => {
  const pathname = window.location.pathname.replace(/\/+$/, '');
  const isCompatibilityRoute = pathname.endsWith('/founder-os');
  const founderOsBase = isCompatibilityRoute ? '.' : './founder-os';

  window.NNOSPaths = Object.freeze({
    founderOsBase,
    asset(path = '') {
      const normalized = String(path).replace(/^\/+/, '');
      return `${founderOsBase}/${normalized}`;
    },
    site(path = '') {
      const normalized = String(path).replace(/^\/+/, '');
      return isCompatibilityRoute ? `../${normalized}` : `./${normalized}`;
    }
  });
})();
