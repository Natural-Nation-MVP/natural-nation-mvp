(() => {
  const gatewayUrl = 'https://founder-os-gateway.dmoseley1024.workers.dev/';
  const statusNode = document.querySelector('[data-system-status]');

  async function checkGateway() {
    if (statusNode) statusNode.textContent = 'Checking gateway...';

    try {
      const response = await fetch(gatewayUrl, { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`Gateway returned ${response.status}`);
      if (statusNode) statusNode.textContent = 'Gateway online';
      return true;
    } catch (error) {
      console.error(error);
      if (statusNode) statusNode.textContent = 'Gateway unavailable';
      return false;
    }
  }

  window.NNOSGatewayStatus = { refresh: checkGateway };
  checkGateway();
})();
