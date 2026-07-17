import { createRuntimeService, hashPayload } from './runtime-service.mjs';

export const naturalNationRequest = {
  workspaceId: 'workspace-natural-nation', workflowId: 'nn-generate-daily-protocol',
  action: 'workspace.protocol.generate', payload: { userId: 'guest-001', day: 1 },
  idempotencyKey: 'nn-day-1-protocol', estimatedCost: 0.02,
};

export const contractorRequest = {
  workspaceId: 'workspace-contractor-estimator', workflowId: 'ce-build-estimate',
  action: 'workspace.estimate.build', payload: { jobId: 'job-001', trade: 'carpentry' },
  idempotencyKey: 'ce-job-001', estimatedCost: 0.01,
};

export function buildFixtureRuntime(events = []) {
  const workspaces = {
    'workspace-natural-nation': { active: true },
    'workspace-contractor-estimator': { active: true },
  };
  const workflows = {
    'nn-generate-daily-protocol': { workspaceId: 'workspace-natural-nation', maxAttempts: 2, handler: async ({ payload }) => ({ protocolId: `protocol-${payload.day}` }) },
    'ce-build-estimate': { workspaceId: 'workspace-contractor-estimator', maxAttempts: 2, handler: async ({ payload }) => ({ estimateId: `estimate-${payload.jobId}` }) },
  };
  const policies = {
    'workspace.protocol.generate': { effect: 'allow', approvalRequired: false },
    'workspace.estimate.build': { effect: 'allow', approvalRequired: false },
    'workspace.external.publish': { effect: 'allow', approvalRequired: true },
  };
  const approvals = {
    'approval-publish-001': {
      workspaceId: 'workspace-natural-nation', action: 'workspace.external.publish',
      payloadHash: hashPayload({ releaseId: 'release-001' }), status: 'approved',
      expiresAt: '2099-01-01T00:00:00.000Z',
    },
  };
  const emitters = Object.fromEntries(['evidence','audit','observability','cost'].map((name) => [name, (event) => events.push({ channel: name, event })]));
  return createRuntimeService({ workspaces, workflows, policies, approvals, emitters });
}
