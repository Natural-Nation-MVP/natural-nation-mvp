(() => {
  // Compatibility shim retained only because older HTML revisions may still request this file.
  // Founder settings are owned exclusively by founder-home-functionality.js.
  // This module intentionally installs no document-level click, pointer, or keyboard listeners.
  window.NNOSFounderSettingsLegacy = Object.freeze({
    retired: true,
    owner: 'founder-home-functionality.js',
    version: 'FOUNDER-UX-044'
  });
})();
