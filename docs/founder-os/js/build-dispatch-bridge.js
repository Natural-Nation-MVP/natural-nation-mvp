(() => {
  const MAX_INSTALL_ATTEMPTS = 120;
  const POLL_INTERVAL_MS = 3500;
  const LONG_RUNNING_NOTICE_MS = 90000;
  const MAX_MONITOR_MS = 360000;
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

  function hasTaskAdvanced(task) {
    return Boolean(task && ['complete', 'blocked'].includes(task.status));
  }

  async function refreshCanonical() {
    const buildState = await window.NNOSCanonicalBuild?.reload?.();
    await window.NNOSAIOrchestration?.reload?.();
    return buildState || window.NNOSCanonicalBuild?.state || null;
  }

  async function monitorCanonicalState(taskId, startedAt) {
    let longNoticeShown = false;

    while (Date.now() - startedAt < MAX_MONITOR_MS) {
      await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
      const state = await refreshCanonical().catch(() => null);
      const task = taskFromState(state, taskId);

      if (hasTaskAdvanced(task)) return { state, task };

      if (!longNoticeShown && Date.now() - startedAt >= LONG_RUNNING_NOTICE_MS) {
        longNoticeShown = true;
        window.NNOSProcessing?.update({
          title: 'Provider is still working',
          message: 'The browser is continuing to monitor GitHub. Do not run the task again or refresh the page.',
          stage: 'Waiting for verified repository result'
        });
        setText('[data-validation-status]', 'The provider is still processing. Founder OS is monitoring the canonical GitHub state.');
      } else {
        window.NNOSProcessing?.update({
          title: 'Running provider task',
          message: 'Founder OS is monitoring GitHub for the branch, pull request, and verified result.',
          stage: task?.providerStatus === 'dispatching' ? 'Recording handoff' : 'Provider execution'
        });
      }
    }

    return { state: await refreshCanonical().catch(() => null), task: null, monitoringExpired: true };
  }

  function completionMessage(task) {
    if (task?.status === 'complete') {
      return {
        success: true,
        title: 'Verified result recorded',
        message: task.resultSummary || 'The provider completed the task and Founder OS recorded the verified result.',
        stage: 'Complete'
      };
    }
    if (task?.status === 'blocked') {
      return {
        success: false,
        title: 'Task needs attention',
        message: task.blockedReason || 'The provider could not complete a verifiable result.',
        stage: task.providerStatus || 'Blocked'
      };
    }
    return null;
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
      let dispatchSettled = false;
      let dispatchError = null;
      let dispatchResult = null;

      setBusy(true, 'Preparing protected dispatch…');
      window.NNOSProcessing.start({
        title: 'Preparing protected dispatch',
        message: 'Founder OS is refreshing the canonical state before validation.',
        stage: 'Preparing'
      });
      setText('[data-validation-status]', 'Refreshing the canonical orchestration state before validation.');

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
            dispatchSettled = true;
            dispatchResult = result;
            return result;
          })
          .catch((error) => {
            dispatchSettled = true;
            dispatchError = error;
            return null;
          });

        window.NNOSProcessing.update({
          title: 'Running provider task',
          message: 'The Gateway is recording the handoff and waiting for a verified repository result.',
          stage: 'Provider execution'
        });
        setText('[data-validation-status]', 'The Gateway is recording the handoff and monitoring provider execution.');

        const monitorPromise = monitorCanonicalState(taskId, startedAt);
        const first = await Promise.race([
          dispatchPromise.then(() => ({ source: 'dispatch' })),
          monitorPromise.then((value) => ({ source: 'monitor', value }))
        ]);

        let state;
        let task;

        if (first.source === 'monitor' && first.value?.task) {
          state = first.value.state;
          task = first.value.task;
        } else {
          state = await refreshCanonical().catch(() => null);
          task = taskFromState(state, taskId);
          if (!hasTaskAdvanced(task) && !dispatchError) {
            const monitored = await monitorPromise;
            state = monitored.state;
            task = monitored.task || taskFromState(state, taskId);
          }
        }

        const completion = completionMessage(task);
        if (completion?.success) {
          window.NNOSProcessing.success(completion);
        } else if (completion) {
          window.NNOSProcessing.error(completion);
        } else if (dispatchError) {
          window.NNOSProcessing.error({
            title: 'Dispatch failed',
            message: dispatchError.message || 'The provider task could not be dispatched.',
            stage: 'Stopped'
          });
        } else if (!dispatchSettled) {
          window.NNOSProcessing.update({
            title: 'Provider request continues',
            message: 'The request is still active. Founder OS will continue reading the canonical state when the page refreshes.',
            stage: 'Still processing'
          });
        } else {
          window.NNOSProcessing.success({
            title: 'Provider request recorded',
            message: dispatchResult?.message || 'The request completed and Founder OS refreshed the canonical state.',
            stage: 'Recorded'
          });
        }

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
        const stillReady = task?.status === 'ready';
        $$('[data-action="generate"]').forEach((button) => {
          button.textContent = stillReady ? 'Validate and Run Current Task →' : (task?.status === 'complete' ? 'Result verified' : task?.providerStatus || task?.status || 'Refresh Current Task');
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
