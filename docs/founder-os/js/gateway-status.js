(() => {
  const gatewayUrl = 'https://founder-os-gateway.dmoseley1024.workers.dev/';
  const statusNode = document.querySelector('[data-system-status]');
  const asset = window.NNOSPaths.asset;

  function loadApprovalRuntime() {
    if (!document.querySelector('link[data-blueprint-approval-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = asset('css/blueprint-approval.css?v=0.1.0');
      style.dataset.blueprintApprovalStyle = 'true';
      document.head.appendChild(style);
    }

    if (!document.querySelector('script[data-blueprint-approval-script]')) {
      const script = document.createElement('script');
      script.src = asset('js/blueprint-approval-transaction.js?v=0.1.0');
      script.dataset.blueprintApprovalScript = 'true';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  async function checkGateway() {
    if (statusNode) statusNode.textContent = 'Checking gateway...';

    try {
      const response = await fetch(gatewayUrl, { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`Gateway returned ${response.status}`);
      if (statusNode) statusNode.textContent = 'Gateway online';
      loadApprovalRuntime();
    } catch (error) {
      console.error(error);
      if (statusNode) statusNode.textContent = 'Gateway unavailable';
    }
  }

  checkGateway();
})();
