import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');

const html = await read('docs/founder-os/index.html');
const registry = JSON.parse(await read('docs/founder-os/config/workspace-registry.json'));
const app = await read('docs/founder-os/js/app.js');
const workspaceRegistry = await read('docs/founder-os/js/workspace-registry.js');
const moduleLoader = await read('docs/founder-os/js/build-studio-polish.js');
const uxCompletion = await read('docs/founder-os/js/ux-completion.js');
const uxStyles = await read('docs/founder-os/css/ux-completion.css');
const orchestrationUi = await read('docs/founder-os/js/ai-orchestration.js');
const agentRegistry = JSON.parse(await read('docs/founder-os/config/ai-agent-registry.json'));
const orchestrationState = JSON.parse(await read('docs/founder-os/config/ai-orchestration-state.json'));
const gatewayIndex = await read('services/founder-os-gateway/src/index.js');
const gatewayRoute = await read('services/founder-os-gateway/src/routes/ai-orchestration.js');
const gatewayTransaction = await read('services/founder-os-gateway/src/lib/ai-orchestration.js');
const providerAdapters = await read('services/founder-os-gateway/src/lib/ai-provider-adapters.js');
const structuredLog = await read('services/founder-os-gateway/src/lib/structured-log.js');
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
assert(app.includes('ux-completion.js'), 'The completed founder-facing module runtime must load.');
assert(app.includes('ux-completion.css'), 'The completed founder-facing module styles must load.');
assert(workspaceRegistry.includes("window.NNOSActiveWorkspace?.id === 'natural-nation'"), 'Execution bars must be scoped to Natural Nation.');

for (const phrase of ['Product definition', 'Customer application', 'Build package', 'Provider execution is not yet verified', 'Customer app preview only', 'automated repository validation passed']) {
  assert(uxCompletion.includes(phrase), `Completed UX truthfulness text is missing: ${phrase}`);
}
assert(uxCompletion.includes("workspace.id === 'founder-os'"), 'Founder OS and Natural Nation overview content must remain separated.');
assert(uxCompletion.includes("workspace.id !== 'natural-nation'"), 'Build work must remain scoped to Natural Nation.');
assert(uxStyles.includes('.ux-preview-shell'), 'Customer preview must retain responsive styling.');

assert(moduleLoader.includes('ai-orchestration.js'), 'The repository-backed AI orchestration runtime must load.');
assert(!moduleLoader.includes('ai-operations.js'), 'The old browser-local AI operations runtime must not load.');

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
assert(gatewayIndex.includes('0.5.3'), 'The Gateway version must identify the stabilization release.');
assert(gatewayIndex.includes('gatewayConfiguration'), 'Gateway configuration readiness must be calculated centrally.');
assert(gatewayIndex.includes('Object.values(required).every(Boolean)'), 'All protected Gateway and GitHub bindings must be required.');
assert(gatewayIndex.includes('Object.values(providers).some(Boolean)'), 'At least one direct AI provider must be ready.');
assert(gatewayIndex.includes('optionalLegacy'), 'Legacy callback bindings must be reported separately from direct-provider readiness.');
assert(gatewayIndex.includes('structuredObservability'), 'The Gateway must advertise structured observability.');
assert(gatewayIndex.includes('OPENAI_API_KEY'), 'Gateway configuration must recognize the direct OpenAI secret.');
assert(gatewayIndex.includes('GOOGLE_AI_API_KEY'), 'Gateway configuration must recognize the direct Google AI secret.');
assert(gatewayRoute.includes('authenticateFounder'), 'AI task dispatch must require Founder authentication.');
assert(gatewayRoute.includes('authenticateAgentCallback'), 'Legacy AI result callbacks must require callback authentication.');
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
assert(gatewayTransaction.includes('result.dispatchId !== task.dispatchId'), 'A provider result cannot complete the wrong dispatch.');
assert(gatewayTransaction.includes('status: successful ? "working" : "blocked"'), 'Failed provider delivery must block the task instead of claiming execution.');
assert(gatewayTransaction.includes('deliverToProvider'), 'Queued work must pass through the provider adapter.');
assert(gatewayTransaction.includes('delivery.synchronous === true'), 'Direct-provider results must enter synchronous completion handling.');
assert(gatewayTransaction.includes('completedResult'), 'Synchronous provider delivery must include a verified completion result.');
assert(gatewayTransaction.includes('structuredLog'), 'Orchestration must emit structured audit events.');

assert(providerAdapters.includes('PROVIDER_REGISTRY'), 'Providers must be added and removed through a central registry.');
assert(providerAdapters.includes('FAILOVER_CATEGORIES'), 'Failover behavior must be governed by normalized error categories.');
assert(providerAdapters.includes('providerOrder'), 'The router must order preferred and fallback providers centrally.');
assert(providerAdapters.includes('capabilities'), 'Registered providers must declare supported capabilities.');
assert(providerAdapters.includes('fallbackUsed'), 'Provider delivery must record whether fallback occurred.');
assert(providerAdapters.includes('attempts'), 'Provider delivery must preserve an audit trail of routing attempts.');
assert(providerAdapters.includes('QUOTA_EXCEEDED'), 'Quota failures must use a normalized failover category.');
assert(providerAdapters.includes('AUTHENTICATION_FAILED'), 'Authentication failures must use a terminal normalized category.');
assert(providerAdapters.includes('OPENAI_API_KEY'), 'The direct OpenAI adapter must use OPENAI_API_KEY.');
assert(providerAdapters.includes('GOOGLE_AI_API_KEY'), 'The direct Google adapter must use GOOGLE_AI_API_KEY.');
assert(providerAdapters.includes('api.openai.com/v1/responses'), 'The direct OpenAI adapter must call the Responses API.');
assert(providerAdapters.includes('generativelanguage.googleapis.com'), 'The direct Google adapter must call the Gemini API.');
assert(providerAdapters.includes('synchronous: true'), 'Direct providers must identify immediate completion semantics.');
assert(providerAdapters.includes('delivery-failed'), 'Provider failures must remain truthful and blocked.');
assert(providerAdapters.includes('AI_CALLBACK_TOKEN') || gatewayAuth.includes('AI_CALLBACK_TOKEN'), 'Legacy provider callbacks must use a dedicated secret.');

assert(structuredLog.includes('console.log(JSON.stringify'), 'Structured logs must be emitted as JSON.');
assert(structuredLog.includes('redact'), 'Structured logging must redact protected values.');
assert(!structuredLog.includes('OPENAI_API_KEY'), 'Structured logging must not reference the OpenAI secret by name.');
assert(!structuredLog.includes('GOOGLE_AI_API_KEY'), 'Structured logging must not reference the Google AI secret by name.');

assert(orchestrationUi.includes('data-start-ai-task'), 'The Founder must have a clear dispatch control.');
assert(orchestrationUi.includes('dryRun: true'), 'The UI must validate before dispatching live work.');
assert(orchestrationUi.includes('Direct providers may complete and record the task during this request'), 'The UI must explain synchronous direct-provider completion.');
assert(orchestrationUi.includes("body.dispatch?.status === 'completed'"), 'The UI must report direct-provider completion truthfully.');
assert(orchestrationUi.includes('executionConfirmed'), 'The UI must report provider acceptance truthfully.');
assert(orchestrationUi.includes('/v1/ai/providers'), 'The UI must display provider readiness.');
assert(!orchestrationUi.includes('Work started for'), 'The UI must not claim execution merely because a handoff was recorded.');

console.log('Founder OS validation passed.');