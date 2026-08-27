import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const readJson = async (path) => JSON.parse(await read(path));

const [policy, registry, workspaceRegistry, html, analytics, gateway, orchestration] = await Promise.all([
  readJson('docs/founder-os/config/usage-optimization-policy.json'),
  readJson('docs/founder-os/registry/usage-records.json'),
  readJson('docs/founder-os/config/workspace-registry.json'),
  read('docs/founder-os/index.html'),
  read('docs/founder-os/js/usage-analytics.js'),
  read('services/founder-os-gateway/src/index.js'),
  read('services/founder-os-gateway/src/lib/ai-orchestration.js')
]);

assert.equal(policy.status, 'active');
assert.equal(policy.scope, 'all-workspaces');
assert.deepEqual(policy.memoryLayers, ['permanent-archive', 'verified-project-state', 'task-context-pack']);
for (const control of [
  'compactTaskContext',
  'unrelatedConversationHistoryExcluded',
  'onDemandEvidenceRetrieval',
  'payloadFingerprinting',
  'duplicateDispatchProtection',
  'unchangedValidationReuse',
  'eventDrivenStatusChecks',
  'differentialVisualReview',
  'batchRepositoryOperations',
  'preserveRawEvidence',
  'preserveFounderAuthority'
]) assert.equal(policy.controls[control], true, `Usage optimization control is not active: ${control}`);

assert.equal(registry.schemaVersion, '1.0.0');
assert.equal(registry.historicalCoverage.status, 'unmetered');
assert.ok(Array.isArray(registry.records));
assert.equal(new Set(registry.records.map((record) => record.usageId)).size, registry.records.length, 'Usage IDs must be unique.');
for (const record of registry.records) {
  assert.equal(record.schemaVersion, '1.0.0');
  assert.match(record.workspaceId, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(record.provider);
  assert.ok(Number.isInteger(record.requests) && record.requests >= 0);
  for (const field of ['input', 'output', 'total', 'cached']) assert.ok(Number.isInteger(record.tokens[field]) && record.tokens[field] >= 0);
  assert.ok(Number.isInteger(record.optimization.retryCount) && record.optimization.retryCount >= 0);
  assert.ok(!Number.isNaN(Date.parse(record.occurredAt)));
}

const founderWorkspace = workspaceRegistry.workspaces.find((workspace) => workspace.id === 'founder-os');
assert.ok(founderWorkspace.modules.some((module) => module.target === 'analytics' && module.label === 'Usage Analytics'));
assert(html.includes('data-workspace="analytics"'));
assert(html.includes('usage-analytics.js?v=fos-actions-014'));
assert(html.includes('usage-analytics.css?v=fos-actions-014'));
for (const required of ['Highest measured usage', 'usage-pie', 'usage-trend', 'Historical usage is preserved but unmetered']) assert(analytics.includes(required));
assert(gateway.includes('handleUsageAnalytics'));
assert(orchestration.includes('payloadFingerprint'));
assert(orchestration.includes('USAGE_PATH'));
assert(orchestration.includes('unrelated-conversation-history'));

console.log(`Usage optimization validation passed: ${registry.records.length} exact usage record(s), historical usage explicitly unmetered.`);
