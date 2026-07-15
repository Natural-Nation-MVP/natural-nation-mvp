(() => {
  const MAX_INSTALL_ATTEMPTS = 80;
  const DISPATCH_TIMEOUT_MS = 90000;
  let installAttempts = 0;
  let dispatchInProgress = false;

  const $$ = (selector) => document.querySelectorAll(selector);
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  function setBuildUi(label, disabled, status) {
    $$('[data-action="generate"]').forEach((button) => {
      button.disabled = disabled;
      button.textContent = label;
    });
    if (status) {
      setText('[data-validation-status]', status);
      setText('[data-build-approval]', disabled ? 'Running' : 'Ready to Run');
      setText('[data-approval]', disabled ? 'Running' : 'Ready to Run');
    }
  }

  function withTimeout(promise) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error('The provider request did not finish within 90 seconds. The task state will be refreshed so you can see whether GitHub recorded a result.')), DISPATCH_TIMEOUT_MS);
      })
    ]);
  }

  function installBridge() {
    const controller = window.NNOSAIOrchestration;
    if (!controller?.dispatchTask || !controller?.reload) {
      installAttempts += 1;
      if (installAttempts < MAX_INSTALL_ATTEMPTS) window.setTimeout(installBridge, 100);
      return;
    }

    if (controller.dispatchTask.__buildWorkReady) return;

    const dispatchTask = controller.dispatchTask.bind(controller);
    const bridgedDispatch = async (taskId) => {
      if (dispatchInProgress) return;
      dispatchInProgress = true;

      setBuildUi('Preparing protected dispatch…', true, 'Refreshing the canonical orchestration state before validation.');

      try {
        // Build Work can open before AI Team has initialized its private canonical state.
        await controller.reload();
        setBuildUi('Validating and running provider…', true, 'Validation passed. The Gateway is recording the handoff and calling the configured provider.');
        await withTimeout(dispatchTask(taskId));
        await window.NNOSCanonicalBuild?.reload?.();
      } catch (error) {
        console.error('Build Work dispatch failed', error);
        window.alert(error?.message || 'The task could not be dispatched.');
        await window.NNOSCanonicalBuild?.reload?.();
      } finally {
        dispatchInProgress = false;
        const state = window.NNOSCanonicalBuild?.state;
        const task = state?.tasks?.find((item) => item.id === taskId);
        const stillReady = task?.status === 'ready';
        setBuildUi(
          stillReady ? 'Validate and Run Current Task →' : 'Refresh Current Task',
          false,
          stillReady
            ? 'The task remains ready. Review any displayed error and try again.'
            : 'The canonical task state was refreshed after provider execution.'
        );
      }
    };

    bridgedDispatch.__buildWorkReady = true;
    controller.dispatchTask = bridgedDispatch;
  }

  window.addEventListener('unhandledrejection', (event) => {
    if (!dispatchInProgress) return;
    console.error('Unhandled Build Work dispatch rejection', event.reason);
    setText('[data-validation-status]', event.reason?.message || 'The dispatch failed unexpectedly.');
  });

  installBridge();
})();