(() => {
  const MAX_INSTALL_ATTEMPTS = 120;
  const POLL_INTERVAL_MS = 3000;
  const MAX_MONITOR_MS = 180000;
  let installAttempts = 0;
  let dispatchInProgress = false;

  const $$ = (selector) => document.querySelectorAll(selector);
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  function setBusy(isBusy, label) {
    $$('[data-action="generate"], [data-start-ai-task]').forEach((button) => {
      button.disabled = isBusy;
      button.setAttribute('aria-busy', String(isBusy));
      if (label && button.dataset.action === 'generate') button.textContent = label;
    });
  }

  function taskFromState(state, taskId) {
    return state?.tasks?.find((task) => task.id === taskId) || null;
  }

  function terminalTask(task) {
    return Boolean(task && ['complete', 'blocked'].includes(task.status));
  }

  function deliveryRecorded(task) {
    return task?.status === 'working' && task?.providerStatus === 'delivered';
  }

  async function refreshCanonical() {
    const state = await window.NNOSCanonicalBuild?.reload?.();
    await window.NNOSAIOrchestration?.reload?.();
    return state || window.NNOSCanonicalBuild?.state || null;
  }

  async function monitor(taskId, startedAt) {
    while (Date.now() - startedAt < MAX_MONITOR_MS) {
      await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
      const state = await refreshCanonical().catch(() => null);
      const task = taskFromState(state, taskId);
      if (terminalTask(task) || deliveryRecorded(task)) return { state, task };
      window.NNOSProcessing?.update({
        title: 'Running provider task',
        message: 'Founder OS is waiting for the provider response and canonical GitHub record.',
        stage: task?.providerStatus === 'dispatching' ? 'Recording handoff' : 'Provider execution'
      });
    }
    return { state: await refreshCanonical().catch(() => null), task: null, expired: true };
  }

  function showOutcome(task, dispatchResult, dispatchError) {
    if (task?.status === 'complete') {
      window.NNOSProcessing?.success({
        title: 'Verified result recorded',
        message: task.resultSummary || 'The provider completed the task and the result was verified.',
        stage: 'Complete'
      });
      return;
    }

    if (task?.status === 'blocked') {
      window.NNOSProcessing?.error({
        title: 'Task needs attention',
        message: task.blockedReason || 'The provider result could not be verified.',
        stage: task.providerStatus || 'Blocked'
      });
      return;
    }

    if (deliveryRecorded(task)) {
      window.NNOSProcessing?.success({
        title: 'Provider response received',
        message: 'The provider response was recorded. Founder OS is finalizing verification in the canonical repository.',
        stage: 'Delivery recorded',
        hideAfter: 2600
      });
      return;
    }

    if (dispatchError) {
      window.NNOSProcessing?.error({
        title: 'Dispatch failed',
        message: dispatchError.message || 'The provider task could not be dispatched.',
        stage: 'Stopped'
      });
      return;
    }

    window.NNOSProcessing?.success({
      title: 'Request recorded',
      message: dispatchResult?.message || 'Founder OS refreshed the canonical task state.',
      stage: 'Recorded'
    });
  }

  function installBridge() {
    const controller = window.NNOSAIOrchestration;
    if (!controller?.dispatchTask || !controller?.reload || !window.NNOSProcessing) {
      installAttempts += 1;
      if (installAttempts < MAX_INSTALL_ATTEMPTS) window.setTimeout(installBridge, 100);
      return;
    }
    if (controller.dispatchTask.__processingBridgeReady) return;

    const originalDispatch = controller.dispatchTask.bind(controller);

    const bridgedDispatch = async (taskId) => {
      if (dispatchInProgress) return null;
      dispatchInProgress = true;
      const startedAt = Date.now();
      let dispatchResult = null;
      let dispatchError = null;

      setBusy(true, 'Preparing protected dispatch…');
      window.NNOSProcessing.start({
        title: 'Preparing protected dispatch',
        message: 'Founder OS is refreshing the canonical state before validation.',
        stage: 'Preparing'
      });

      try {
        await controller.reload();
        window.NNOSProcessing.update({
          title: 'Validating current task',
          message: 'Checking Founder authorization, task ownership, package scope, and provider readiness.',
          stage: 'Validation'
        });
        setBusy(true, 'Validating and running provider…');

        const dispatchPromise = Promise.resolve(originalDispatch(taskId))
          .then((result) => {
            dispatchResult = result;
            return result;
          })
          .catch((error) => {
            dispatchError = error;
            return null;
          });

        window.NNOSProcessing.update({
          title: 'Running provider task',
          message: 'The Gateway is recording the handoff and calling the configured provider.',
          stage: 'Provider execution'
        });
        setText('[data-validation-status]', 'The action is executing. Founder OS is monitoring the canonical GitHub state.');

        const monitored = await monitor(taskId, startedAt);
        await Promise.race([dispatchPromise, Promise.resolve()]);
        const state = monitored.state || await refreshCanonical().catch(() => null);
        const task = monitored.task || taskFromState(state, taskId);
        showOutcome(task, dispatchResult, dispatchError);
        return dispatchResult;
      } catch (error) {
        console.error('Build Work dispatch failed', error);
        window.NNOSProcessing.error({
          title: 'Dispatch failed',
          message: error?.message || 'The task could not be dispatched.',
          stage: 'Stopped'
        });
        await refreshCanonical().catch(() => null);
        return null;
      } finally {
        dispatchInProgress = false;
        setBusy(false);
        const state = window.NNOSCanonicalBuild?.state;
        const task = taskFromState(state, taskId);
        $$('[data-action="generate"]').forEach((button) => {
          button.textContent = task?.status === 'ready'
            ? 'Validate and Run Current Task →'
            : task?.status === 'complete'
              ? 'Result verified'
              : task?.providerStatus || task?.status || 'Refresh Current Task';
        });
      }
    };

    bridgedDispatch.__processingBridgeReady = true;
    controller.dispatchTask = bridgedDispatch;
  }

  window.addEventListener('unhandledrejection', (event) => {
    if (!dispatchInProgress) return;
    console.error('Unhandled Build Work dispatch rejection', event.reason);
    window.NNOSProcessing?.error({
      title: 'Unexpected processing error',
      message: event.reason?.message || 'The operation stopped unexpectedly.',
      stage: 'Stopped'
    });
  });

  installBridge();
})();
