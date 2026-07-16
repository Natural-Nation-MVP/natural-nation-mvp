import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

const [
  html, registry, app, workspaceRegistry, moduleLoader, canonicalBuild, processingStatus, dispatchBridge,
  orchestrationUi, discoveryUi, blueprintUi, knowledgeUi, uxCompletion, uxStyles, agentRegistry,
  orchestrationState, gatewayIndex, gatewayRoute, gatewayTransaction, providerAdapters, structuredLog,
  gatewayAuth, gatewayHttp, resilienceAudit
] = await Promise.all([
  read('docs/founder-os/index.html'),
  json('docs/founder-os/config/workspace-registry.json'),
  read('docs/founder-os/js/app.js'),
  read('docs/founder-os/js/workspace-registry.js'),
  read('docs/founder-os/js/build-studio-polish.js'),
  read('docs/founder-os/js/canonical-build-studio.js'),
  read('docs/founder-os/js/processing-status.js'),
  read('docs/founder-os/js/build-dispatch-bridge.js'),
  read('docs/founder-os/js/ai-orchestration.js'),
  read('docs/founder-os/js/workspace-discovery.js'),
  read('docs/founder-os/js/blueprint-renderer.js'),
  read('docs/founder-os/js/knowledge-engine.js'),
  read('docs/founder-os/js/ux-completion.js'),
  read('docs/founder-os/css/ux-completion.css'),
  json('docs/founder-os/config/ai-agent-registry.json'),
  json('docs/founder-os/config/ai-orchestration-state.json'),
  read('services/founder-os-gateway/src/index.js'),
  read('services/founder-os-gateway/src/routes/ai-orchestration.js'),
  read('services/founder-os-gateway/src/lib/ai-orchestration.js'),
  read('services/founder-os-gateway/src/lib/ai-provider-adapters.js'),
  read('services/founder-os-gateway/src/lib/structured-log.js'),
  read('services/founder-os-gateway/src/lib/auth.js'),
  read('services/founder-os-gateway/src/lib/http.js'),
  read('docs/founder-os/reports/FOUNDER-OS-RESILIENCE-AUDIT-2026-07-16.md')
]);

const scriptSources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1].split('?')[0]);
assert.equal(new Set(scriptSources).size, scriptSources.length, 'Each runtime script must load once.');
for (const deleted of ['queue-meta.js', 'command-engine.js', 'workspace-blueprint.js']) assert(!html.includes(deleted), `Deleted legacy runtime must not load: ${deleted}`);
assert.equal(scriptSources.filter((src) => src.includes('gateway-client')).length, 1, 'Only one Gateway client may load.');

for (const phrase of ['Your Workspaces', 'What We Know', 'Build Plan', 'Build Package', 'What Needs Attention', 'Project Records', 'Code & Deployments', 'Build Team']) assert(html.includes(phrase), `Founder-facing label is missing: ${phrase}`);
assert(!html.includes('Workspace Registry'), 'The visible interface must not use the technical label Workspace Registry.');

const founderOS = registry.workspaces.find((workspace) => workspace.id === 'founder-os');
const naturalNation = registry.workspaces.find((workspace) => workspace.id === 'natural-nation');
assert(founderOS && naturalNation, 'Founder OS and Natural Nation workspaces are required.');
const founderModules = new Set(founderOS.modules.map((module) => module.target));
const naturalNationModules = new Set(naturalNation.modules.map((module) => module.target));
for (const forbidden of ['build', 'discovery', 'blueprint']) assert(!founderModules.has(forbidden), `Founder OS must not expose ${forbidden}.`);
for (const required of ['mission', 'discovery', 'blueprint', 'build', 'ai', 'repo', 'knowledge']) {
  assert(naturalNationModules.has(required), `Natural Nation page is missing: ${required}`);
  assert(html.includes(`data-workspace="${required}"`), `Natural Nation page section is missing: ${required}`);
}
assert.equal(naturalNationModules.size, 7, 'Natural Nation must expose exactly seven approved workspace pages.');

assert(app.includes('workspaceAllows'), 'Route ownership must be enforced.');
assert(app.includes('ux-completion.js') && app.includes('ux-completion.css'), 'Founder-facing completion modules must load.');
assert(app.includes('Live Execution'), 'Build Work must identify live execution.');
assert(workspaceRegistry.includes("window.NNOSActiveWorkspace?.id === 'natural-nation'"), 'Execution bars must be scoped to Natural Nation.');

for (const phrase of ['Product definition', 'Customer application', 'Build package', 'Providers online', 'Customer app preview only', 'v0.5.4 deployed']) assert(uxCompletion.includes(phrase), `Current UX truthfulness text is missing: ${phrase}`);
assert(uxStyles.includes('.ux-preview-shell'), 'Customer preview must retain responsive styling.');
assert(discoveryUi.includes('Open Approved Plan') && discoveryUi.includes('live Build Work'), 'Confirmed Direction must use approved workflow labels.');
assert(blueprintUi.includes('natural-nation-blueprint.json') && blueprintUi.includes('approvalTransactionId'), 'Approved Plan must verify canonical Founder approval.');
assert(knowledgeUi.includes('activeWorkspaceId') && knowledgeUi.includes('scopedKnowledge'), 'Product Records must remain workspace-scoped.');

for (const source of ['processing-status.js?v=processing-v2', 'canonical-build-studio.js?v=processing-v2', 'ai-orchestration.js?v=processing-v2', 'build-dispatch-bridge.js?v=processing-v2']) assert(moduleLoader.includes(source), `Current execution module must be cache-busted: ${source}`);
assert(!moduleLoader.includes('ai-operations.js'), 'The old browser-local AI operations runtime must not load.');

assert(processingStatus.includes('window.NNOSProcessing'), 'Founder OS must expose a shared processing status API.');
for (const requirement of ['data-processing-status', 'data-processing-elapsed', 'aria-live', 'processing-active']) assert(processingStatus.includes(requirement), `Processing status requirement is missing: ${requirement}`);
assert(dispatchBridge.includes('monitorCanonicalState'), 'Build Work must monitor canonical state during provider requests.');
assert(dispatchBridge.includes("['complete', 'blocked']"), 'Only terminal canonical task states may end monitoring.');
assert(dispatchBridge.includes('Verifying provider result'), 'Delivered provider output must remain in verification monitoring.');
assert(dispatchBridge.includes('Monitoring window ended'), 'Long-running tasks must produce an actionable non-terminal recovery message.');
assert(!dispatchBridge.includes('Provider response received'), 'Delivery alone must never be presented as successful completion.');
assert(orchestrationUi.includes('data-reset-ai-task') && orchestrationUi.includes('/reset'), 'Blocked current tasks must expose protected safe retry.');
assert(orchestrationUi.includes('Completed upstream work and failure history will be preserved'), 'Reset confirmation must explain preservation guarantees.');

assert(canonicalBuild.includes('/orchestration') && canonicalBuild.includes('currentTask'), 'Build Work must derive the current task from Gateway state.');
assert(canonicalBuild.includes('Validate and Run Current Task'), 'Build Work must expose protected dispatch.');
assert(canonicalBuild.includes('NNOSAIOrchestration.dispatchTask'), 'Build Work must use the shared orchestration controller.');
assert(canonicalBuild.includes('View Canonical Package'), 'The canonical package must remain available as a secondary action.');

const agentIds = new Set(agentRegistry.agents.map((agent) => agent.id));
for (const required of ['art', 'codex', 'gemini', 'gpose', 'founder']) assert(agentIds.has(required), `Required AI role is missing: ${required}`);
assert.equal(agentIds.size, agentRegistry.agents.length, 'AI role IDs must be unique.');
for (const agent of agentRegistry.agents) assert(agent.provider, `${agent.id} must define a provider adapter.`);

assert.equal(orchestrationState.workspaceId, 'natural-nation');
assert.equal(orchestrationState.packageId, naturalNation.activePackageId);
const actionableTasks = orchestrationState.tasks.filter((task) => ['ready', 'blocked'].includes(task.status));
assert(actionableTasks.length === 1 || orchestrationState.status === 'complete', 'The orchestration must expose exactly one current actionable or blocked task unless complete.');
for (const task of orchestrationState.tasks) {
  assert.equal(task.workspaceId, orchestrationState.workspaceId, `${task.id} has the wrong workspace.`);
  assert.equal(task.packageId, orchestrationState.packageId, `${task.id} has the wrong package.`);
  assert(agentIds.has(task.owner), `${task.id} has an unknown owner.`);
  assert(task.requiredInput && task.expectedOutput, `${task.id} must define its input and output.`);
}

assert(gatewayIndex.includes('handleAiOrchestration') && gatewayIndex.includes('0.5.4'), 'Gateway orchestration and release identity are required.');
assert(gatewayIndex.includes('repositoryExecution') && gatewayIndex.includes('structuredObservability'), 'Gateway capabilities must remain advertised.');
assert(gatewayHttp.includes('new Response(null') && gatewayHttp.includes('access-control-allow-origin'), 'Gateway HTTP handling must preserve valid CORS and bodyless 204 responses.');
assert(gatewayRoute.includes('authenticateFounder') && gatewayRoute.includes('dryRun'), 'Protected dispatch must authenticate and validate before writes.');
assert(gatewayRoute.includes('resetTask') && gatewayRoute.includes('retryAllowed'), 'Gateway must expose protected recovery for blocked tasks.');
assert(gatewayTransaction.includes('commitFilesAtomically') && gatewayTransaction.includes('validateDispatchEligibility'), 'Dispatch must use canonical transactions and eligibility checks.');
assert(gatewayTransaction.includes('providerStatus !== "delivered"') && gatewayTransaction.includes('result.dispatchId !== task.dispatchId'), 'Completion must verify provider delivery and dispatch identity.');
assert(gatewayTransaction.includes('deliverToProvider') && gatewayTransaction.includes('completedResult'), 'Direct provider delivery must enter verified completion handling.');

for (const requirement of ['PROVIDER_REGISTRY', 'FAILOVER_CATEGORIES', 'providerOrder', 'fallbackUsed', 'attempts', 'QUOTA_EXCEEDED', 'AUTHENTICATION_FAILED', 'OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'api.openai.com/v1/responses', 'generativelanguage.googleapis.com', 'synchronous: true', 'delivery-failed']) assert(providerAdapters.includes(requirement), `Provider adapter requirement is missing: ${requirement}`);
assert(structuredLog.includes('console.log(JSON.stringify') && structuredLog.includes('sanitize') && structuredLog.includes('[REDACTED]'), 'Structured logging must remain JSON and sanitized.');
for (const protectedKey of ['OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'GITHUB_TOKEN', 'FOUNDER_API_KEY']) assert(structuredLog.includes(protectedKey), `${protectedKey} must be redacted.`);
assert(gatewayAuth.includes('FOUNDER_API_KEY'), 'Founder authentication must use the dedicated secret.');

assert(orchestrationUi.includes('data-start-ai-task'), 'The Founder must have a clear dispatch control.');
assert(orchestrationUi.includes('dryRun: true'), 'The UI must validate before dispatching live work.');
assert(orchestrationUi.includes('Direct providers may complete and record the task during this request'), 'The UI must explain synchronous direct-provider completion.');
assert(orchestrationUi.includes('window.NNOSProcessing'), 'AI execution must report through shared processing status.');
assert(orchestrationUi.includes('/v1/ai/providers'), 'The UI must display provider readiness.');
assert(!orchestrationUi.includes('Work started for'), 'The UI must not claim execution merely because a handoff was recorded.');

for (const finding of ['Delivered-state false completion', 'No Founder-facing blocked-task recovery', 'Provider quota and failover classification', 'Canonical commit conflicts', 'Worker interruption after handoff commit']) assert(resilienceAudit.includes(finding), `Resilience audit is missing finding: ${finding}`);

console.log('Founder OS validation passed.');