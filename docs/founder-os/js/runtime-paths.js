(() => {
  const pathname = window.location.pathname.replace(/\/+$/, '');
  const isCompatibilityRoute = pathname.endsWith('/founder-os');
  const founderOsBase = isCompatibilityRoute ? '.' : './founder-os';
  const productionGatewayOrigin = 'https://founder-os-gateway.dmoseley1024.workers.dev';
  const isGatewayHost = /founder-os-gateway/i.test(window.location.hostname) && /\.workers\.dev$/i.test(window.location.hostname);
  const gatewayOrigin = isGatewayHost ? window.location.origin : productionGatewayOrigin;

  window.NNOSPaths = Object.freeze({
    founderOsBase,
    gatewayOrigin,
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
