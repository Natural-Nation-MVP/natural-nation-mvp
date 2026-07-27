import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('docs/founder-os/index.html', 'utf8');
const manager = fs.readFileSync('docs/founder-os/js/workspace-manager.js', 'utf8');
const gateway = fs.readFileSync('docs/founder-os/js/gateway-client-v2.js', 'utf8');
const lifecycle = fs.readFileSync('services/founder-os-gateway/src/routes/workspace-lifecycle.js', 'utf8');
const migration = JSON.parse(fs.readFileSync('docs/founder-os/registry/migrations/FOUNDER-WS-005-os-studio-duplicate-review.json', 'utf8'));

assert.match(html, /data-workspace-manager/);
assert.match(html, /workspace-manager\.js\?v=founder-ws-005/);
assert.match(html, /workspace-manager\.css\?v=founder-ws-005/);
assert.match(manager, /data-workspace-filter/);
assert.match(manager, /data-lifecycle-action/);
assert.match(manager, /manageWorkspaceLifecycle/);
assert.match(manager, /purge-check/);
assert.match(manager, /immutable workspace ID/i);
assert.match(manager, /Compare OS Studio Records/);
assert.match(gateway, /async function manageWorkspaceLifecycle/);
assert.match(lifecycle, /PROTECTED_WORKSPACES/);
assert.match(lifecycle, /workspace\.workspaceId === workspaceId/);
assert.match(lifecycle, /lifecycle-audit/);
assert.equal(migration.destructiveActionTaken, false);
assert.equal(migration.automaticActionTaken, false);
assert.equal(migration.recommendedCanonicalWorkspaceId, 'ws_b79fd264-341c-413c-867f-998a5a57a651');

console.log('FOUNDER-WS-005 workspace manager, lifecycle governance, and OS Studio comparison validated.');
