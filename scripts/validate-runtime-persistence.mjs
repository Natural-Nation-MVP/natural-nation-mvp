import assert from 'node:assert/strict';
import { createRuntimeRepository } from '../founder-os/runtime/persistence/runtime-repository.mjs';

const repo = createRuntimeRepository();
const run = { id: 'run-1', workspaceId: 'workspace-natural-nation', workflowId: 'nn-protocol', action: 'generate', payloadHash: 'a'.repeat(64), idempotencyKey: 'day-1', status: 'completed' };
repo.saveRun(run);
repo.appendEvidence({ id: 'ev-1', workspaceId: run.workspaceId, runId: run.id, evidenceType: 'result', contentHash: 'b'.repeat(64), storageReference: 'artifact://ev-1' });
repo.appendEvent({ id: 'event-1', workspaceId: run.workspaceId, runId: run.id, channel: 'audit', eventType: 'runtime.completed', payload: {} });
repo.appendRetry({ id: 'retry-1', workspaceId: run.workspaceId, runId: run.id, attemptNumber: 1, outcome: 'success' });
repo.saveCheckpoint({ id: 'cp-1', workspaceId: run.workspaceId, runId: run.id, checkpointName: 'completed', stateHash: 'c'.repeat(64), storageReference: 'checkpoint://cp-1' });

assert.equal(repo.saveRun({ ...run, id: 'run-2' }).id, 'run-1');
assert.equal(repo.getRun('workspace-natural-nation', 'run-1').id, 'run-1');
assert.equal(repo.getRun('workspace-contractor-estimator', 'run-1'), null);
assert.equal(repo.snapshot('workspace-natural-nation').evidence.length, 1);
assert.equal(repo.snapshot('workspace-contractor-estimator').runs.length, 0);
assert.throws(() => repo.appendEvidence({ workspaceId: 'workspace-contractor-estimator', runId: 'run-1' }), /run not found/);
console.log('FOS-RUNTIME-003 validation passed');
