import crypto from 'node:crypto';
import { createRuntimeService, hashPayload } from '../../runtime/service/runtime-service.mjs';
import { createConnectorGateway } from '../../runtime/connectors/governed-connector-gateway.mjs';
import { createRuntimeRepository } from '../../runtime/persistence/runtime-repository.mjs';

// Executes a deterministic local pilot and returns evidence without claiming live production execution.
export async function runNaturalNationPilot() {
  const events = [];
  const repo = createRuntimeRepository();
  let transientAttempts = 0;
  const emitters = Object.fromEntries(['evidence','audit','observability','cost'].map((channel) => [channel, (event) => events.push({ channel, event })]));

  const workspaces = {
    'workspace-natural-nation': { active: true },
    'workspace-contractor-estimator': { active: true },
  };
  const workflows = {
    'nn-day-one-mission': {
      workspaceId: 'workspace-natural-nation', maxAttempts: 2,
      handler: async ({ payload }) => {
        transientAttempts += 1;
        if (transientAttempts === 1) throw Object.assign(new Error('simulated transient provider failure'), { code: 'TRANSIENT' });
        return { missionId: 'mission-day-1', guidance: `Start with ${payload.focus}` };
      },
    },
    'nn-publish-pilot': {
      workspaceId: 'workspace-natural-nation', maxAttempts: 1,
      handler: async ({ payload }) => ({ publishedReleaseId: payload.releaseId, environment: 'pilot' }),
    },
  };
  const publishPayload = { releaseId: 'nn-pilot-release-001' };
  const policies = {
    'workspace.mission.generate': { effect: 'allow', approvalRequired: false },
    'workspace.external.publish': { effect: 'allow', approvalRequired: true },
  };
  const approvals = {
    'approval-nn-publish-001': {
      workspaceId: 'workspace-natural-nation', action: 'workspace.external.publish',
      payloadHash: hashPayload(publishPayload), status: 'approved', expiresAt: '2099-01-01T00:00:00.000Z',
    },
  };
  const runtime = createRuntimeService({ workspaces, workflows, policies, approvals, emitters });

  const connectorRegistry = {
    providers: { openai: { id: 'openai', adapter: 'pilot-ai', fallbackProviderIds: ['google-ai'] }, 'google-ai': { id: 'google-ai', adapter: 'pilot-ai' } },
    connections: { 'nn-ai': { id: 'nn-ai', workspaceId: 'workspace-natural-nation', providerId: 'openai', status: 'active', secretReference: 'secret://nn/ai', capabilities: ['ai.generate'] } },
  };
  const gateway = createConnectorGateway({
    registry: connectorRegistry,
    adapters: { 'pilot-ai': { execute: async ({ payload }) => ({ output: `Duey pilot response for ${payload.topic}`, usage: { inputUnits: 20, outputUnits: 12 } }) } },
    approvalVerifier: () => false,
    emitters,
  });

  const aiResult = await gateway.execute({ workspaceId: 'workspace-natural-nation', connectionId: 'nn-ai', capability: 'ai.generate', payload: { topic: 'Day 1 energy mission' } });
  const missionRequest = { workspaceId: 'workspace-natural-nation', workflowId: 'nn-day-one-mission', action: 'workspace.mission.generate', payload: { focus: 'hydration and a whole-food breakfast' }, idempotencyKey: 'nn-pilot-mission-001', estimatedCost: 0.02 };
  const mission = await runtime.execute(missionRequest);
  const idempotentReplay = await runtime.execute(missionRequest);
  const approvalDenied = await runtime.execute({ workspaceId: 'workspace-natural-nation', workflowId: 'nn-publish-pilot', action: 'workspace.external.publish', payload: { releaseId: 'changed-release' }, approvalId: 'approval-nn-publish-001' });
  const publish = await runtime.execute({ workspaceId: 'workspace-natural-nation', workflowId: 'nn-publish-pilot', action: 'workspace.external.publish', payload: publishPayload, approvalId: 'approval-nn-publish-001', idempotencyKey: 'nn-publish-001' });
  const isolation = await runtime.execute({ ...missionRequest, workspaceId: 'workspace-contractor-estimator', idempotencyKey: 'cross-workspace-test' });

  repo.saveRun({ id: mission.runId, workspaceId: mission.workspaceId, workflowId: mission.workflowId, action: mission.action, payloadHash: mission.payloadHash, idempotencyKey: missionRequest.idempotencyKey, status: mission.status });
  repo.appendEvidence({ id: crypto.randomUUID(), workspaceId: mission.workspaceId, runId: mission.runId, evidenceType: 'pilot-result', contentHash: hashPayload(mission.result), storageReference: 'artifact://fos-pilot-001/mission' });
  repo.appendEvent({ id: crypto.randomUUID(), workspaceId: mission.workspaceId, runId: mission.runId, channel: 'audit', eventType: 'pilot.completed', payload: { status: mission.status } });
  repo.appendRetry({ id: crypto.randomUUID(), workspaceId: mission.workspaceId, runId: mission.runId, attemptNumber: mission.attempts, outcome: 'success-after-retry' });
  repo.saveCheckpoint({ id: crypto.randomUUID(), workspaceId: mission.workspaceId, runId: mission.runId, checkpointName: 'pilot-complete', stateHash: hashPayload({ mission, publish }), storageReference: 'checkpoint://fos-pilot-001/complete' });

  const estimatedCost = events.filter((event) => event.channel === 'cost').reduce((sum, event) => sum + Number(event.event.estimated ?? 0), 0);
  return {
    pilotId: 'FOS-PILOT-001', evidenceClass: 'local-simulated-runtime', productionEvidence: false,
    executedAt: new Date().toISOString(), workspaceId: 'workspace-natural-nation',
    results: { aiResult, mission, idempotentReplaySameRun: idempotentReplay.runId === mission.runId, approvalDenied, publish, isolation },
    retryEvidence: { transientAttempts, completedAttempts: mission.attempts },
    emissions: events.reduce((counts, event) => ({ ...counts, [event.channel]: (counts[event.channel] ?? 0) + 1 }), {}),
    costReconciliation: { estimatedRuntimeCost: estimatedCost, connectorUsageCaptured: Boolean(aiResult.result?.usage) },
    persistence: repo.snapshot('workspace-natural-nation'),
    releaseReadiness: { localPilotPassed: true, liveProviderEvidenceRequired: true, productionDeploymentApproved: false },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(await runNaturalNationPilot(), null, 2));
