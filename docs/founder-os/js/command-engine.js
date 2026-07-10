(() => {
  const registryPath = './config/command-registry.json?v=1.0.0';
  let registry = null;

  const bySelector = (selector) => document.querySelector(selector);

  function buildPayload(command) {
    return {
      commandId: command.id,
      command: command.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      requestedBy: 'Founder',
      requestedAt: new Date().toISOString(),
      mode: registry?.mode || 'preview',
      target: command.target,
      approval: command.approval,
      execution: command.execution,
      status: command.approval.required ? 'awaiting-founder-approval' : 'ready-for-preflight'
    };
  }

  function showPayload(command) {
    const output = bySelector('[data-command-output]');
    const status = bySelector('[data-command-status]');
    if (!output || !status) return;

    output.textContent = JSON.stringify(buildPayload(command), null, 2);
    status.textContent = command.approval.required
      ? `${command.id} prepared. Founder approval required before connected execution.`
      : `${command.id} prepared and ready for connected preflight.`;
  }

  function renderCommands() {
    const list = bySelector('[data-command-list]');
    const status = bySelector('[data-command-status]');
    if (!list || !registry) return;

    list.innerHTML = registry.commands.map((command) => `
      <div class="module-card">
        <strong>${command.id} — ${command.name}</strong>
        <p class="muted">${command.description}</p>
        <div class="record-row"><span>Target</span><span>${command.target.branch}</span></div>
        <div class="record-row"><span>Approval</span><span>${command.approval.required ? command.approval.role : 'Automatic'}</span></div>
        <button type="button" data-command-id="${command.id}">Prepare Command</button>
      </div>
    `).join('');

    status.textContent = `${registry.commands.length} commands loaded in ${registry.mode} mode.`;
  }

  async function loadRegistry() {
    const status = bySelector('[data-command-status]');
    try {
      const response = await fetch(registryPath, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Registry load failed: ${response.status}`);
      registry = await response.json();
      renderCommands();
    } catch (error) {
      if (status) status.textContent = 'Command Registry could not be loaded.';
      console.error(error);
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-command-id]');
    if (!button || !registry) return;
    const command = registry.commands.find((item) => item.id === button.dataset.commandId);
    if (command) showPayload(command);
  });

  loadRegistry();
})();
