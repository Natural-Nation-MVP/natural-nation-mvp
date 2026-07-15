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
const providerAdapters = await read('services/founder-os-gateway/src/lib/ai-provider-adapters.js');
const gatewayAuth = await read('services/founder-os-gateway/src/lib/auth.js');

const scriptSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1].split('?')[0]);
assert.equal(new Set(scriptSources).size, scriptSources.length, 'Each runtime script must load once.');
assert(!html.includes('queue-meta.js'), 'Deleted local queue script must not be loaded.');
assert(!html.includes('command-engine.js'), 'Deleted local package generator must not be loaded.');
assert(!html.includes('workspace-blueprint.js'), 'Legacy Blueprint execution controller must not be loaded.');
assert.equal(scriptSources.filter((src) => src.includes('gateway-client')).length, 1, 'Only one Gateway client may load.');

for (const phrase of ['Your Workspaces', 'What We Know', 'Build Plan', 'Build Package', 'What Needs Attention', 'Project Records', 'Code & Deployments', 'Build Team']) {
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
for (const agent of agentRegistry.agents) assert(agent.provider, `${agent.id} must define a provider adapter.`);

assert.equal(orchestrationState.workspaceId, 'natural-nation', 'The initial orchestration state must belong to Natural Nation.');
assert.equal(orchestrationState.packageId, naturalNation.activePackageId, 'The orchestration package must match the active workspace package.');
assert.equal(orchestrationState.tasks.filter((task) => task.status === 'ready').length, 1, 'Exactly one initial task may be ready.');
for (const task of orchestrationState.tasks) {
  assert.equal(task.workspaceId, orchestrationState.workspaceId, `${task.id} has the wrong workspace.`);
  assert.equal(task.packageId, orchestrationState.packageId, `${task.id} has the wrong package.`);
  assert(agentIds.has(task.owner), `${task.id} has an unknown owner.`);
  if (task.nextRole) assert(agentIds.has(task.nextRole), `${task.id} has an unknown next role.`);
  assert(task.requiredInput && task.expectedOutput, `${task.id} must define its input and output.`);
}

assert(gatewayIndex.includes('handleAiOrchestration'), 'The Gateway must activate AI orchestration routes.');
assert(gatewayIndex.includes('0.5.1'), 'The Gateway version must identify the provider orchestration release.');
assert(gatewayRoute.includes('authenticateFounder'), 'AI task dispatch must require Founder authentication.');
assert(gatewayRoute.includes('authenticateAgentCallback'), 'AI results must require callback authentication.');
assert(gatewayRoute.includes('/v1/ai/providers'), 'The Gateway must expose safe provider readiness.');
assert(gatewayRoute.includes('dryRun'), 'AI task dispatch must support a no-write validation.');
assert(gatewayRoute.includes('body.dispatchId'), 'AI result callbacks must include a dispatch ID.');
assert(gatewayRoute.includes('AI_DISPATCH_CONFLICT'), 'Duplicate or invalid dispatch attempts must return a conflict.');

assert(gatewayTransaction.includes('commitFilesAtomically'), 'Live dispatch must use repository transactions.');
assert(gatewayTransaction.includes('workspaceId !== workspaceId'), 'Dispatch must reject cross-workspace requests.');
assert(gatewayTransaction.includes('validateDispatchEligibility'), 'Dispatch must enforce current task readiness and ownership.');
assert(gatewayTransaction.includes('task.status !== "ready"'), 'Waiting and blocked tasks must not be dispatched.');
assert(gatewayTransaction.includes('task.startedAt || task.dispatchId'), 'Duplicate dispatch records must be rejected.');
assert(gatewayTransaction.includes('providerStatus !== "delivered"'), 'A task cannot complete before provider delivery is confirmed.');
assert(gatewayTransaction.includes('result.dispatchId !== task.dispatchId'), 'A callback cannot complete the wrong dispatch.');
assert(gatewayTransaction.includes('status: successful ? "working" : "blocked"'), 'Failed provider delivery must block the task instead of claiming execution.');
assert(gatewayTransaction.includes('deliverToProvider'), 'Queued work must pass through the provider adapter.');

assert(providerAdapters.includes('awaiting-configuration'), 'Unconfigured providers must remain truthful and blocked.');
assert(providerAdapters.includes('AI_CALLBACK_TOKEN') || gatewayAuth.includes('AI_CALLBACK_TOKEN'), 'Provider callbacks must use a dedicated secret.');

assert(orchestrationUi.includes('data-start-ai-task'), 'The Founder must have a clear dispatch control.');
assert(orchestrationUi.includes('dryRun: true'), 'The UI must validate before dispatching live work.');
assert(orchestrationUi.includes('It will not mark the task complete'), 'The UI must distinguish dispatch from completion.');
assert(orchestrationUi.includes('executionConfirmed'), 'The UI must report provider acceptance truthfully.');
assert(orchestrationUi.includes('/v1/ai/providers'), 'The UI must display provider adapter readiness.');
assert(!orchestrationUi.includes('Work started for'), 'The UI must not claim execution merely because a handoff was recorded.');

console.log('Founder OS validation passed.');
