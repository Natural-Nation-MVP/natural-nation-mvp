import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildConnectorFixture } from '../founder-os/runtime/connectors/connector-registry.fixture.mjs';

const events = [];
const gateway = buildConnectorFixture(events);
const payload = { prompt: 'Create Day 1 mission', apiKey: 'never-log' };
const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

const ai = await gateway.execute({ workspaceId: 'workspace-natural-nation', connectionId: 'nn-openai', capability: 'ai.generate', payload });
const crossWorkspace = await gateway.execute({ workspaceId: 'workspace-contractor-estimator', connectionId: 'nn-openai', capability: 'ai.generate', payload });
const missingCapability = await gateway.execute({ workspaceId: 'workspace-natural-nation', connectionId: 'nn-openai', capability: 'repo.write', payload });
const missingApproval = await gateway.execute({ workspaceId: 'workspace-natural-nation', connectionId: 'nn-github', capability: 'repo.write', payload: { path: 'README.md' }, consequential: true });
const approved = await gateway.execute({ workspaceId: 'workspace-natural-nation', connectionId: 'nn-github', capability: 'repo.write', payload, payloadHash, consequential: true, approval: { workspaceId: 'workspace-natural-nation', capability: 'repo.write', payloadHash, status: 'approved' } });

assert.equal(ai.status, 'completed');
assert.equal(ai.result.apiKey, '[REDACTED]');
assert.equal(crossWorkspace.reason, 'WORKSPACE_MISMATCH');
assert.equal(missingCapability.reason, 'CAPABILITY_NOT_REGISTERED');
assert.equal(missingApproval.reason, 'APPROVAL_REQUIRED');
assert.equal(approved.status, 'completed');
assert.equal(approved.result.authorization, '[REDACTED]');
assert.ok(events.some(({ channel }) => channel === 'audit'));
assert.ok(events.some(({ channel }) => channel === 'observability'));
assert.ok(events.some(({ channel }) => channel === 'cost'));
assert.ok(gateway.health().every((item) => item.providerRegistered && item.secretReferencePresent));
console.log('FOS-RUNTIME-004 validation passed');
