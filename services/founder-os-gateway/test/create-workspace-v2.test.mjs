import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkspaceCreationV2, isActiveWorkspaceCreationV2 } from '../src/routes/create-workspace-v2.js';

function request(headers = {}) {
  return new Request('https://gateway.test/v2/workspaces', { method: 'POST', headers });
}

function body(overrides = {}) {
  return {
    sourceWorkspaceId: 'founder-os',
    clientRequestId: 'workspace-create-lighting-bolt-001',
    confirmation: { approved: true, effectAcknowledged: true },
    blueprint: {
      name: 'Lighting Bolt',
      purpose: 'Create a specialized customer experience for this independent business.',
      objectives: ['Launch a focused MVP'],
      constraints: ['Workspace isolation required'],
      roadmap: ['M1 Foundation']
    },
    ...overrides
  };
}

test('allows a non-protected duplicate-capable display name', () => {
  assert.deepEqual(validateWorkspaceCreationV2(body(), request({ 'x-founder-os-workspace': 'founder-os' })), []);
});

test('protects reserved Founder OS identities', () => {
  for (const name of ['Founder OS', 'Natural Nation']) {
    const candidate = body({ blueprint: { ...body().blueprint, name } });
    const blockers = validateWorkspaceCreationV2(candidate, request({ 'x-founder-os-workspace': 'founder-os' }));
    assert.ok(blockers.some((item) => item.code === 'PROTECTED_WORKSPACE_ID'));
  }
});

test('requires Founder OS scope and explicit approval', () => {
  const blockers = validateWorkspaceCreationV2(
    body({ sourceWorkspaceId: 'natural-nation', confirmation: { approved: false, effectAcknowledged: false } }),
    request({ 'x-founder-os-workspace': 'natural-nation' })
  );
  assert.ok(blockers.some((item) => item.code === 'WORKSPACE_CREATION_SCOPE_FORBIDDEN'));
  assert.ok(blockers.some((item) => item.code === 'FOUNDER_CONFIRMATION_REQUIRED'));
});

test('treats only recent running records as active', () => {
  const now = Date.now();
  assert.equal(isActiveWorkspaceCreationV2({ status: 'running', startedAt: new Date(now - 30_000).toISOString() }, now), true);
  assert.equal(isActiveWorkspaceCreationV2({ status: 'running', startedAt: new Date(now - 180_000).toISOString() }, now), false);
  assert.equal(isActiveWorkspaceCreationV2({ status: 'running', startedAt: 'invalid' }, now), false);
});
