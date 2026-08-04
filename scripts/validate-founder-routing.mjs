import fs from 'node:fs';
import assert from 'node:assert/strict';

const files = {
  shell: 'docs/founder-os/index.html',
  registry: 'docs/founder-os/js/workspace-registry.js',
  navigation: 'docs/founder-os/js/navigation-manager-035.js',
  app: 'docs/founder-os/js/app.js',
  home: 'docs/founder-os/js/founder-home-functionality.js'
};

for (const path of Object.values(files)) {
  assert.equal(fs.existsSync(path), true, `Founder routing contract missing required file: ${path}`);
}

const shell = fs.readFileSync(files.shell, 'utf8');
const registry = fs.readFileSync(files.registry, 'utf8');
const navigation = fs.readFileSync(files.navigation, 'utf8');
const app = fs.readFileSync(files.app, 'utf8');
const home = fs.readFileSync(files.home, 'utf8');

assert.match(shell, /navigation-manager-035\.js/);
assert.match(shell, /founder-home-functionality\.js/);
assert.match(registry, /data-open-workspace=/);
assert.doesNotMatch(registry, /data-workspace-link/);
assert.match(home, /NNOSNavigationManager/);
assert.match(home, /data-open-workspace/);

for (const contract of [
  'history.pushState',
  'history.replaceState',
  "window.addEventListener('popstate'",
  "window.addEventListener('hashchange'",
  "window.addEventListener('pageshow'",
  "writeHistory(requestedId, target, historyMode",
  "activateWorkspace(workspaceId, source, requestedView, historyMode)",
  "openWorkspace(workspaceId, source)",
  "openHome(source, historyMode)",
  "openView(target, source)",
  "routeFromLocation(source)",
  "data-nav-home",
  "data-nav-view"
]) {
  assert.match(navigation, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Routing contract missing: ${contract}`);
}

assert.match(navigation, /openWorkspace\(workspaceId, source\)[\s\S]*'push'/);
assert.match(navigation, /openView\(target, source\)[\s\S]*writeHistory\(workspace\.id, target, 'push'\)/);
assert.match(navigation, /routeFromLocation\('popstate'\)/);
assert.match(app, /view\.hidden = !active/);
assert.match(app, /selected\.style\.pointerEvents = 'auto'/);
assert.match(app, /document\.body\.setAttribute\('data-active-workspace'/);
assert.match(app, /document\.body\.setAttribute\('data-active-view'/);

console.log('Founder OS deterministic routing and browser-history contracts passed.');
