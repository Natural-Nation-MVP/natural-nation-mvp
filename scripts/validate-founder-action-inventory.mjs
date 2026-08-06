import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

const inventoryPath = 'docs/founder-os/config/action-inventory.json';
const htmlPath = 'docs/founder-os/index.html';
const inventory = await json(inventoryPath);
const html = await read(htmlPath);

assert.equal(inventory.schemaVersion, '1.0.0');
assert.equal(inventory.inventoryId, 'FOS-ACTIONS-005');
assert(Array.isArray(inventory.controls));
assert(inventory.controls.length >= 40, 'The canonical action inventory must cover every current control family.');
assert.equal(new Set(inventory.controls.map((control) => control.id)).size, inventory.controls.length, 'Action inventory IDs must be unique.');
assert.equal(new Set(inventory.controls.map((control) => control.selector)).size, inventory.controls.length, 'Action inventory selectors must be unique.');

const ownerSources = new Map();
for (const control of inventory.controls) {
  for (const field of ['id', 'selector', 'surface', 'owner', 'availability', 'outcome', 'browserTest']) {
    assert.equal(typeof control[field], 'string', `${control.id || 'Unknown control'} is missing ${field}.`);
    assert(control[field].trim(), `${control.id || 'Unknown control'} has an empty ${field}.`);
  }

  const ownerPath = `docs/founder-os/js/${control.owner}`;
  assert(existsSync(new URL(ownerPath, root)), `Action owner does not exist: ${ownerPath}`);
  if (!ownerSources.has(control.owner)) ownerSources.set(control.owner, await read(ownerPath));
  const owner = ownerSources.get(control.owner);
  const attributes = [...control.selector.matchAll(/\[(data-[a-z0-9-]+)/gi)].map((match) => match[1]);
  assert(attributes.length > 0, `Inventory selector must include a data attribute: ${control.selector}`);
  for (const attribute of attributes) {
    assert(owner.includes(attribute), `${control.owner} does not contain its inventory selector attribute ${attribute}.`);
  }
}

const coveredAttributes = new Set(
  inventory.controls.flatMap((control) => [...control.selector.matchAll(/\[(data-[a-z0-9-]+)/gi)].map((match) => match[1]))
);
const staticInteractiveTags = [...html.matchAll(/<(?:button|input|textarea|select)\b[^>]*>/gi)].map((match) => match[0]);
for (const tag of staticInteractiveTags) {
  const attributes = [...tag.matchAll(/\b(data-[a-z0-9-]+)(?:=|\s|>)/gi)].map((match) => match[1]);
  for (const attribute of attributes) {
    assert(coveredAttributes.has(attribute), `Static interactive control is missing from action inventory: ${attribute}`);
  }
}

const actionSources = {
  index: html,
  app: await read('docs/founder-os/js/app.js'),
  gatewayStatus: await read('docs/founder-os/js/gateway-status.js'),
  liveApproval: await read('docs/founder-os/js/live-approval-controller.js'),
  blueprintRenderer: await read('docs/founder-os/js/blueprint-renderer.js'),
  actionCenter: await read('docs/founder-os/js/founder-action-center.js'),
  founderActions: await read('docs/founder-os/js/founder-actions.js'),
  missionControl: await read('docs/founder-os/js/mission-control.js'),
  knowledgeEngine: await read('docs/founder-os/js/knowledge-engine.js'),
  workspaceKnowledgeScope: await read('docs/founder-os/js/workspace-knowledge-scope.js'),
  buildRuntime: await read('docs/founder-os/js/canonical-build-runtime-v2.js'),
  dispatchBridge: await read('docs/founder-os/js/build-dispatch-bridge.js'),
  workspaceFlow: await read('docs/founder-os/js/workspace-flow.js')
};
const combinedActionSources = Object.values(actionSources).join('\n');

for (const retiredSelector of ['data-workspace-button', 'data-resume-workspace', 'data-context-module', 'data-page-link-view']) {
  assert(!combinedActionSources.includes(retiredSelector), `Retired action selector remains active: ${retiredSelector}`);
}
assert(!combinedActionSources.includes('onclick='), 'Inline click handlers are not allowed in the canonical action runtime.');
assert(!html.includes('data-action="'), 'The canonical shell must not expose unowned legacy Build Studio action buttons.');
assert(html.includes('data-build-refresh'), 'The canonical Build Work refresh action is missing.');
assert(actionSources.buildRuntime.includes("closest('[data-build-refresh]')"), 'Canonical Build runtime must own Build Work refresh controls.');
assert(!actionSources.dispatchBridge.includes('data-action="generate"'), 'Dispatch bridge must not couple to retired build buttons.');

assert(actionSources.workspaceFlow.includes("closest('[data-review-blueprint]')"), 'Workspace Flow must own the planning review action.');
assert(!actionSources.blueprintRenderer.includes('data-review-blueprint'), 'Blueprint renderer must remain presentation-only.');
assert(actionSources.liveApproval.includes("closest?.('[data-approve-blueprint]')"), 'Live Approval must own the Blueprint approval action.');
assert(!actionSources.gatewayStatus.includes('blueprint-approval'), 'Gateway status must not load a second approval runtime.');
assert(actionSources.actionCenter.includes('NNOSNavigationManager'), 'Founder Action Center must route through Navigation Manager.');
assert(actionSources.missionControl.includes('data-mission-view') && actionSources.missionControl.includes('data-mission-action'), 'Mission Control must expose owned supporting and closeout controls.');
assert(actionSources.missionControl.includes('MutationObserver'), 'Mission Control must restore its owned controls after live fallback rendering.');
assert(actionSources.founderActions.includes("openView(target, 'founder-actions')"), 'Founder utility actions must route through Navigation Manager.');
assert(actionSources.knowledgeEngine.includes('data-knowledge-search') && actionSources.knowledgeEngine.includes('data-knowledge-action'), 'Knowledge Engine must own Project Records search and actions.');
assert(!actionSources.workspaceKnowledgeScope.includes('addEventListener'), 'Workspace knowledge scope must remain presentation-free.');

for (const retiredFile of [
  'docs/founder-os/js/blueprint-approval-transaction.js',
  'docs/founder-os/css/blueprint-approval.css'
]) {
  assert(!existsSync(new URL(retiredFile, root)), `Legacy duplicate approval artifact remains: ${retiredFile}`);
}

console.log(`Founder OS action inventory passed: ${inventory.controls.length} control families have explicit owners and outcomes.`);
