import { createConnectorGateway } from './governed-connector-gateway.mjs';

export const registry = {
  providers: {
    openai: { id: 'openai', adapter: 'mock-ai', fallbackProviderIds: ['google-ai'] },
    'google-ai': { id: 'google-ai', adapter: 'mock-ai' },
    github: { id: 'github', adapter: 'mock-external' },
    cloudflare: { id: 'cloudflare', adapter: 'mock-external' },
    firebase: { id: 'firebase', adapter: 'mock-external' },
    email: { id: 'email', adapter: 'mock-external' },
    notifications: { id: 'notifications', adapter: 'mock-external' },
  },
  connections: {
    'nn-openai': { id: 'nn-openai', workspaceId: 'workspace-natural-nation', providerId: 'openai', status: 'active', secretReference: 'secret://nn/openai', capabilities: ['ai.generate'] },
    'nn-github': { id: 'nn-github', workspaceId: 'workspace-natural-nation', providerId: 'github', status: 'active', secretReference: 'secret://nn/github', capabilities: ['repo.read','repo.write'] },
    'ce-google': { id: 'ce-google', workspaceId: 'workspace-contractor-estimator', providerId: 'google-ai', status: 'active', secretReference: 'secret://ce/google-ai', capabilities: ['ai.generate'] },
  },
};

export function buildConnectorFixture(events = []) {
  const adapters = {
    'mock-ai': { execute: async ({ payload }) => ({ output: `generated:${payload.prompt}`, usage: { units: 12 }, apiKey: 'must-redact' }) },
    'mock-external': { execute: async ({ capability }) => ({ accepted: true, capability, authorization: 'must-redact' }) },
  };
  const emitters = Object.fromEntries(['audit','observability','cost'].map((channel) => [channel, (event) => events.push({ channel, event })]));
  const approvalVerifier = (request) => request.approval?.workspaceId === request.workspaceId
    && request.approval?.capability === request.capability
    && request.approval?.payloadHash === request.payloadHash
    && request.approval?.status === 'approved';
  return createConnectorGateway({ registry, adapters, approvalVerifier, emitters });
}
