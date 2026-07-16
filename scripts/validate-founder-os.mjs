import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

const files = await Promise.all([
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
  read('docs/founder-os/css/founder-review.css'),
  json('docs/founder-os/config/ai-agent-registry.json'),
  json('docs/founder-os/config/ai-orchestration-state.json'),
  read('services/founder-os-gateway/src/index.js'),
  read('services/founder-os-gateway/src/routes/ai-orchestration.js'),
  read('services/founder-os-gateway/src/lib/ai-orchestration.js'),
  read('services/founder-os-gateway/src/lib/ai-provider-adapters.js'),
  read('services/founder-os-gateway/src/lib/structured-log.js'),
  read('services/founder-os-gateway/src/lib/auth.js'),
  read('services/founder-os-gateway/src/lib/http.js'),
  read('docs/founder-os/reports/FOUNDER-OS-RESILIENCE-AUDIT-2026-07-16.md'),
  read('services/founder-os-gateway/src/lib/result-verification.js')
]);

const [html, registry, app, workspaceRegistry, moduleLoader, canonicalBuild, processingStatus, dispatchBridge,
  orchestrationUi, discoveryUi, blueprintUi, knowledgeUi, uxCompletion, uxStyles, founderReviewStyles,
  agentRegistry, orchestrationState, gatewayIndex, gatewayRoute, gatewayTransaction, providerAdapters,
  structuredLog, gatewayAuth, gatewayHttp, resilienceAudit, resultVerification] = files;

const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1].split('?')[0]);
assert.equal(new Set(scripts).size, scripts.length, 'Each runtime script must load once.');
assert.equal(scripts.filter((src) => src.includes('gateway-client')).length, 1, 'Only one Gateway client may load.');
for (const deleted of ['queue-meta.js', 'command-engine.js', 'workspace-blueprint.js']) assert(!html.includes(deleted));

const founderOS = registry.workspaces.find((workspace) => workspace.id === 'founder-os');
const naturalNation = registry.workspaces.find((workspace) => workspace.id === 'natural-nation');
assert(founderOS && naturalNation);
const nnModules = new Set(naturalNation.modules.map((module) => module.target));
for (const required of ['mission', 'discovery', 'blueprint', 'build', 'ai', 'repo', 'knowledge']) assert(nnModules.has(required));
assert.equal(nnModules.size, 7);
assert(app.includes('workspaceAllows') && app.includes('Live Execution'));
assert(workspaceRegistry.includes("window.NNOSActiveWorkspace?.id === 'natural-nation'"));
assert(discoveryUi.includes('Open Approved Plan') && discoveryUi.includes('live Build Work'));
assert(blueprintUi.includes('approvalTransactionId'));
assert(knowledgeUi.includes('scopedKnowledge'));
assert(uxCompletion.includes('v0.5.4 deployed') && uxStyles.includes('.ux-preview-shell'));

for (const source of ['processing-status.js?v=processing-v4', 'canonical-build-studio.js?v=processing-v4', 'ai-orchestration.js?v=processing-v4', 'build-dispatch-bridge.js?v=processing-v4']) {
  assert(moduleLoader.includes(source), `Missing current execution module: ${source}`);
}
assert(processingStatus.includes('window.NNOSProcessing') && processingStatus.includes('aria-live'));
assert(dispatchBridge.includes('monitorCanonicalState') && dispatchBridge.includes("['complete', 'blocked']"));
assert(dispatchBridge.includes('Verifying provider result') && dispatchBridge.includes('Monitoring window ended'));
assert(orchestrationUi.includes('data-reset-ai-task') && orchestrationUi.includes('/reset'));

for (const requirement of [
  'Validate and Run Current Task', 'Retry Current Task Safely', 'Founder Decision', 'Approve slice',
  'Request changes', 'AI-TASK-003.result.json', 'AI-TASK-004.result.json', 'recordFounderDecision',
  '/decision', 'Approval records the slice as complete but does not automatically merge', 'View Canonical Package'
]) assert(canonicalBuild.includes(requirement), `Founder review requirement missing: ${requirement}`);
assert(founderReviewStyles.includes('.founder-review-panel'));
assert(founderReviewStyles.includes(':focus-visible'));
assert(founderReviewStyles.includes('@media'));

const agentIds = new Set(agentRegistry.agents.map((agent) => agent.id));
for (const role of ['art', 'codex', 'gemini', 'gpose', 'founder']) assert(agentIds.has(role));
assert.equal(agentIds.size, agentRegistry.agents.length);
assert.equal(orchestrationState.workspaceId, 'natural-nation');
assert.equal(orchestrationState.packageId, naturalNation.activePackageId);
assert(orchestrationState.tasks.filter((task) => ['ready', 'blocked'].includes(task.status)).length === 1 || orchestrationState.status === 'complete');

assert(gatewayIndex.includes('handleAiOrchestration') && gatewayIndex.includes('0.5.4'));
assert(gatewayIndex.includes('repositoryExecution') && gatewayIndex.includes('structuredObservability'));
assert(gatewayHttp.includes('access-control-allow-origin'));
assert(gatewayRoute.includes('authenticateFounder') && gatewayRoute.includes('dryRun'));
assert(gatewayRoute.includes('resetTask') && gatewayRoute.includes('retryAllowed'));
assert(gatewayRoute.includes('recordFounderDecision'));
assert(gatewayRoute.includes('FOUNDER_DECISION_REJECTED'));
assert(gatewayRoute.includes('founder-approved') && gatewayRoute.includes('changes-requested'));
assert(gatewayTransaction.includes('commitFilesAtomically') && gatewayTransaction.includes('validateDispatchEligibility'));
assert(gatewayTransaction.includes('deliverToProvider') && gatewayTransaction.includes('completedResult'));
assert(resultVerification.includes('structuredCandidates') && resultVerification.includes('founder_review'));

for (const requirement of ['PROVIDER_REGISTRY', 'FAILOVER_CATEGORIES', 'fallbackUsed', 'attempts', 'QUOTA_EXCEEDED', 'AUTHENTICATION_FAILED', 'OPENAI_API_KEY', 'GOOGLE_AI_API_KEY']) {
  assert(providerAdapters.includes(requirement));
}
assert(structuredLog.includes('[REDACTED]') && structuredLog.includes('console.log(JSON.stringify'));
assert(gatewayAuth.includes('FOUNDER_API_KEY'));
for (const finding of ['Delivered-state false completion', 'No Founder-facing blocked-task recovery', 'Provider quota and failover classification']) assert(resilienceAudit.includes(finding));

console.log('Founder OS validation passed.');
