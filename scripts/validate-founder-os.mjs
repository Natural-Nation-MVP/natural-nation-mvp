import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');

const html = await read('docs/founder-os/index.html');
const registry = JSON.parse(await read('docs/founder-os/config/workspace-registry.json'));
const app = await read('docs/founder-os/js/app.js');
const workspaceRegistry = await read('docs/founder-os/js/workspace-registry.js');

const scriptSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1].split('?')[0]);
assert.equal(new Set(scriptSources).size, scriptSources.length, 'Each runtime script must load once.');
assert(!html.includes('queue-meta.js'), 'Deleted local queue script must not be loaded.');
assert(!html.includes('command-engine.js'), 'Deleted local package generator must not be loaded.');
assert(!html.includes('workspace-blueprint.js'), 'Legacy Blueprint execution controller must not be loaded.');
assert.equal(scriptSources.filter((src) => src.includes('gateway-client')).length, 1, 'Only one Gateway client may load.');

for (const phrase of [
  'Your Workspaces',
  'What We Know',
  'Build Plan',
  'Build Package',
  'What Needs Attention',
  'Project Records',
  'Code & Deployments',
  'Build Team'
]) {
  assert(html.includes(phrase), `Founder-facing label is missing: ${phrase}`);
}

assert(!html.includes('Workspace Registry'), 'The visible interface must not use the technical label Workspace Registry.');
assert(!html.includes('Canonical Output'), 'The visible interface must not lead with repository terminology.');
assert(!html.includes('Execution Catalog'), 'The visible interface must not expose implementation terminology by default.');

const founderOS = registry.workspaces.find((workspace) => workspace.id === 'founder-os');
const naturalNation = registry.workspaces.find((workspace) => workspace.id === 'natural-nation');
assert(founderOS, 'Founder OS workspace is required.');
assert(naturalNation, 'Natural Nation workspace is required.');

const founderModules = new Set(founderOS.modules.map((module) => module.target));
const naturalNationModules = new Set(naturalNation.modules.map((module) => module.target));
assert(!founderModules.has('build'), 'Founder OS must not expose Natural Nation Build Package.');
assert(!founderModules.has('discovery'), 'Founder OS must not expose Natural Nation understanding.');
assert(!founderModules.has('blueprint'), 'Founder OS must not expose Natural Nation Build Plan.');
assert(naturalNationModules.has('build'), 'Natural Nation must own its Build Package.');
assert(naturalNationModules.has('discovery'), 'Natural Nation must own What We Know.');
assert(naturalNationModules.has('blueprint'), 'Natural Nation must own its Build Plan.');

assert(app.includes('workspaceAllows'), 'Route ownership must be enforced by app.js.');
assert(workspaceRegistry.includes("window.NNOSActiveWorkspace?.id === 'natural-nation'"), 'Execution bars must be scoped to Natural Nation.');

console.log('Founder OS validation passed.');