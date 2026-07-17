import assert from 'node:assert/strict';
import { buildFixtureRuntime, naturalNationRequest } from '../founder-os/runtime/service/runtime-service.fixture.mjs';

const events = [];
const runtime = buildFixtureRuntime(events);
const first = await runtime.execute(naturalNationRequest);
const second = await runtime.execute(naturalNationRequest);
const crossWorkspace = await runtime.execute({ ...naturalNationRequest, workspaceId: 'workspace-contractor-estimator' });
const protectedPayload = await runtime.execute({ ...naturalNationRequest, idempotencyKey: 'protected', containsProtectedPayload: true });
const approvalFailure = await runtime.execute({ workspaceId: 'workspace-natural-nation', workflowId: 'nn-generate-daily-protocol', action: 'workspace.external.publish', payload: { releaseId: 'changed' }, approvalId: 'approval-publish-001' });

assert.equal(first.status, 'completed');
assert.equal(second.runId, first.runId);
assert.equal(crossWorkspace.reason, 'CROSS_WORKSPACE_WORKFLOW_ACCESS');
assert.equal(protectedPayload.reason, 'PROTECTED_PAYLOAD_BLOCKED');
assert.equal(approvalFailure.reason, 'APPROVAL_INVALID_OR_MISSING');
assert.equal(runtime.health().status, 'healthy');
assert.ok(events.some(({ channel }) => channel === 'evidence'));
assert.ok(events.some(({ channel }) => channel === 'audit'));
assert.ok(events.some(({ channel }) => channel === 'observability'));
assert.ok(events.some(({ channel }) => channel === 'cost'));
console.log('FOS-RUNTIME-002 validation passed');
