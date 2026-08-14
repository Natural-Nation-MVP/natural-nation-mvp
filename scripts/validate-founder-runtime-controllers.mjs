import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const html = await read('docs/founder-os/index.html');
const app = await read('docs/founder-os/js/app.js');
const navigation = await read('docs/founder-os/js/navigation-manager-035.js');
const founderHome = await read('docs/founder-os/js/founder-home-functionality.js');
const founderPresentation = await read('docs/founder-os/js/founder-ux-002.js');
const internalNavigation = await read('docs/founder-os/js/internal-navigation-only.js');
const availability = await read('docs/founder-os/js/interaction-availability.js');

const expectedStaticControllers = [
  'runtime-paths.js',
  'internal-navigation-only.js',
  'app.js',
  'build-studio-polish.js',
  'gateway-status.js',
  'workspace-discovery.js',
  'gateway-client-v2.js',
  'live-approval-controller.js',
  'blueprint-renderer.js',
  'workspace-registry.js',
  'workspace-manager.js',
  'founder-ux-002.js',
  'workspace-creation.js',
  'workspace-identity-ui.js',
  'workspace-flow.js',
  'interaction-availability.js',
  'founder-home-functionality.js',
  'workspace-knowledge-scope.js',
  'knowledge-engine.js',
  'ai-orchestration.js',
  'navigation-manager-035.js'
];

const retiredControllers = [
  'founder-settings-dialog-fix.js',
  'founder-startup-recovery.js',
  'founder-interaction-stability-025.js'
];

const staticScripts = [...html.matchAll(/<script\s+src="\.\/js\/([^"?]+)\?v=([^"]+)"/g)]
  .map((match) => ({ file: match[1], version: match[2] }));

assert.deepEqual(
  staticScripts.map(({ file }) => file),
  expectedStaticControllers,
  'The canonical shell must load the approved runtime controllers once and in deterministic order.'
);
assert.equal(new Set(staticScripts.map(({ file }) => file)).size, staticScripts.length, 'A static runtime controller may load only once.');
assert(staticScripts.every(({ version }) => version === 'fos-actions-013'), 'Every static runtime controller must use the FOS-ACTIONS-013 source version.');
assert(html.includes('<meta name="founder-os-build" content="fos-actions-013" />'), 'The canonical source build marker must match FOS-ACTIONS-013.');

const staticStyles = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="[^"]+\?v=([^"]+)"/g)].map((match) => match[1]);
assert(staticStyles.length >= 4, 'The canonical shell must retain its required static stylesheets.');
assert(staticStyles.every((version) => version === 'fos-actions-013'), 'Every static stylesheet must use the FOS-ACTIONS-013 source version.');

for (const file of retiredControllers) {
  assert(!html.includes(file), `Retired controller remains loaded: ${file}`);
  assert(!existsSync(new URL(`docs/founder-os/js/${file}`, root)), `Retired controller file remains in the production tree: ${file}`);
}

assert(app.includes('window.setWorkspace = setWorkspace'), 'App view state must remain owned by app.js.');
assert(app.includes('window.NNOSResetTransitionState = resetTransitionState'), 'Transition cleanup must remain owned by app.js.');
assert(navigation.includes('openWorkspace: openWorkspace'), 'Workspace routing must remain owned by Navigation Manager.');
assert(navigation.includes('openHome: openHome'), 'Home routing must remain owned by Navigation Manager.');
assert(navigation.includes('openView: openView'), 'Sidebar view routing must remain owned by Navigation Manager.');
assert(founderHome.includes('openSettings: openSettings'), 'Founder settings must remain owned by founder-home-functionality.js.');
assert(founderHome.includes('data-open-workspace'), 'Explicit workspace buttons must remain bound by founder-home-functionality.js.');
assert(!founderPresentation.includes('openWorkspace('), 'Founder presentation must not own workspace routing.');
assert(!founderPresentation.includes('data-nav-view'), 'Founder presentation must not own sidebar routing.');
assert(!availability.includes('openWorkspace('), 'Availability policy must not own workspace routing.');
assert(!availability.includes('data-nav-view'), 'Availability policy must not own sidebar routing.');
assert(!internalNavigation.includes('data-open-workspace'), 'External-link policy must not inspect workspace controls.');
assert(!internalNavigation.includes('data-nav-view'), 'External-link policy must not inspect sidebar controls.');

console.log(`Founder OS runtime controller contract passed: ${staticScripts.length} active static controllers, ${retiredControllers.length} retired controllers removed.`);
