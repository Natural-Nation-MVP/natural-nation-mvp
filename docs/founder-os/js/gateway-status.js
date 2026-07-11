(() => {
  const gatewayUrl = 'https://founder-os-gateway.dmoseley1024.workers.dev/';
  const statusNode = document.querySelector('[data-system-status]');

  function loadApprovalRuntime() {
    if (!document.querySelector('link[data-blueprint-approval-style]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = './css/blueprint-approval.css?v=0.1.0';
      style.dataset.blueprintApprovalStyle = 'true';
      document.head.appendChild(style);
    }

    if (!document.querySelector('script[data-blueprint-approval-script]')) {
      const script = document.createElement('script');
      script.src = './js/blueprint-approval-transaction.js?v=0.1.0';
      script.dataset.blueprintApprovalScript = 'true';
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  async function checkGateway() {
    if (statusNode) statusNode.textContent = 'Checking gateway...';

    try {
      const response = await fetch(gatewayUrl, {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Gateway returned ${response.status}`);
      }

      const data = await response.json();
      const isOnline = data?.status === 'online';

      if (statusNode) {
        statusNode.textContent = isOnline
          ? `Gateway online · v${data.version || 'unknown'}`
          : 'Gateway response received';
      }

      window.NNOSGateway = {
        url: gatewayUrl,
        connected: true,
        response: data
      };
    } catch (error) {
      if (statusNode) statusNode.textContent = 'Gateway unavailable';

      window.NNOSGateway = {
        url: gatewayUrl,
        connected: false,
        error: error.message
      };

      console.error('Founder OS gateway status check failed.', error);
    }
  }

  loadApprovalRuntime();
  checkGateway();
})();
