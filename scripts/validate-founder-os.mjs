import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');

const html = await read('docs/founder-os/index.html');
const registry = JSON.parse(await read('docs/founder-os/config/workspace-registry.json'));
const app = await read('docs/founder-os/js/app.js');
const workspaceRegistry = await read('docs/founder-os/js/workspace-registry.js');
const moduleLoader = await read('docs/founder-os/js/build-studio-polish.js');
const orchestrationUi = await read('docs/founder-os/js/ai-orchestration.js');
const agentRegistry = JSON.parse(await read('docs/founder-os/config/ai-agent-registry.json'));
const orchestrationState = JSON.parse(await read('docs/founder-os/config/ai-orchestration-state.json'));
const gatewayIndex = await read('services/founder-os-gateway/src/index.js');
const gatewayRoute = await read('services/founder-os-gateway/src/routes/ai-orchestration.js');
const gatewayTransaction = await read('services/founder-os-gateway/src/lib/ai-orchestration.js');

const scriptSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1].split('?')[0]);
assert.equal(new Set(scriptSources).size, scriptSources.length, 'Each runtime script must load once.');
assert(!html.includes('queue-meta.js'), 'Deleted local queue script must not be loaded.');
assert(!html.includes('command-engine.js'), 'Deleted local package generator must not be loaded.');
assert(!html.includes('workspace-blueprint.js'), 'Legacy Blueprint execution controller must not be loaded.');
assert.equal(scriptSources.filter((src) => src.includes('gateway-client')).length, 1, 'Only one Gateway client may load.');

for (const phrase of [
  'Your Workspaces', 'What We Know', 'Build Plan', 'Build Package',
  'What Needs Attention', 'Project Records', 'Code & Deployments', 'Build Team'
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
assert(moduleLoader.includes('ai-orchestration.js'), 'The repository-backed AI orchestration runtime must load.');
assert(!moduleLoader.includes('ai-operations.js'), 'The old hard-coded AI operations runtime must not load.');

const agentIds = new Set(agentRegistry.agents.map((agent) => agent.id));
assert.equal(agentIds.size, agentRegistry.agents.length, 'AI agent IDs must be unique.');
for (const requiredAgent of ['art', 'codex', 'gemini', 'gpose', 'founder']) {
  assert(agentIds.has(requiredAgent), `Required AI role is missing: ${requiredAgent}`);
}
assert.equal(orchestrationState.workspaceId, 'natural-nation', 'The initial orchestration state must belong to Natural Nation.');
assert.equal(orchestrationState.packageId, naturalNation.activePackageId, 'The orchestration package must match the active workspace package.');
for (const task of orchestrationState.tasks) {
  assert.equal(task.workspaceId, orchestrationState.workspaceId, `${task.id} has the wrong workspace.`);
  assert.equal(task.packageId, orchestrationState.packageId, `${task.id} has the wrong package.`);
  assert(agentIds.has(task.owner), `${task.id} has an unknown owner.`);
  if (task.nextRole) assert(agentIds.has(task.nextRole), `${task.id} has an unknown next role.`);
  assert(task.requiredInput && task.expectedOutput, `${task.id} must define its input and output.`);
}

assert(gatewayIndex.includes('handleAiOrchestration'), 'The Gateway must activate AI orchestration routes.');
assert(gatewayIndex.includes('0.5.0'), 'The Gateway version must identify the orchestration release.');
assert(gatewayRoute.includes('authenticateFounder'), 'AI task dispatch must require Founder authentication.');
assert(gatewayRoute.includes('dryRun'), 'AI task dispatch must support a no-write validation.');
assert(gatewayTransaction.includes('commitFilesAtomically'), 'Live dispatch must use an atomic repository transaction.');
assert(gatewayTransaction.includes('workspaceId !== workspaceId'), 'Dispatch must reject cross-workspace requests.');
assert(orchestrationUi.includes('data-start-ai-task'), 'The Founder must have a clear Start Work control.');
assert(orchestrationUi.includes('dryRun: true'), 'The UI must validate before starting live work.');

console.log('Founder OS validation passed.');
