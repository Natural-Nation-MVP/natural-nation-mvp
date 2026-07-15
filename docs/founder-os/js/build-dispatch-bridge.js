(() => {
  const MAX_ATTEMPTS = 80;
  let attempts = 0;

  function installBridge() {
    const controller = window.NNOSAIOrchestration;
    if (!controller?.dispatchTask || !controller?.reload) {
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) window.setTimeout(installBridge, 100);
      return;
    }

    if (controller.dispatchTask.__buildWorkReady) return;

    const dispatchTask = controller.dispatchTask.bind(controller);
    const bridgedDispatch = async (taskId) => {
      // Build Work can be opened before the AI Team page has initialized its private state.
      // Refresh the shared orchestration controller first so the protected dispatch does not
      // silently return without presenting the Founder Key prompt.
      await controller.reload();
      return dispatchTask(taskId);
    };

    bridgedDispatch.__buildWorkReady = true;
    controller.dispatchTask = bridgedDispatch;
  }

  installBridge();
})();