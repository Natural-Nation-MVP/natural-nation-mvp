import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWorkspaceLifecycle } from '../src/routes/workspace-lifecycle.js';

const REGISTRY = {
  schemaVersion: '2.1.0',
  updatedAt: '2026-07-26T00:00:00.000Z',
  workspaces: [
    { workspaceId: 'natural-nation', workspaceKey: 'natural-nation', displayName: 'Natural Nation', status: 'active' },
    {
      workspaceId: 'ws_test-001',
      workspaceKey: 'test-workspace-001',
      displayName: 'Test Workspace',
      status: 'foundation',
      lifecycleStatus: 'created',
      repository: { root: 'workspaces/test-workspace-001/' }
    }
  ]
};

function encode(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8').toString('base64');
}

function request(workspaceId, body) {
  return new Request(`https://gateway.test/v2/workspaces/${encodeURIComponent(workspaceId)}/lifecycle`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer founder-secret',
      'content-type': 'application/json',
      'x-founder-os-workspace': 'founder-os'
    },
    body: JSON.stringify(body)
  });
}

function env() {
  return {
    FOUNDER_API_KEY: 'founder-secret',
    GITHUB_TOKEN: 'github-token',
    GITHUB_OWNER: 'Natural-Nation-MVP',
    GITHUB_REPOSITORY: 'natural-nation-mvp',
    GITHUB_BRANCH: 'main'
  };
}

function installGithubMock(registry = structuredClone(REGISTRY)) {
  const writes = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method || 'GET';
    if (path.includes('/contents/docs/founder-os/registry/workspaces.json') && method === 'GET') {
      return Response.json({ type: 'file', content: encode(registry), sha: 'registry-sha' });
    }
    if (path.includes('/git/ref/heads/')) return Response.json({ object: { sha: 'parent-sha' } });
    if (path.includes('/git/commits/parent-sha')) return Response.json({ tree: { sha: 'parent-tree' } });
    if (path.endsWith('/git/blobs')) {
      const body = JSON.parse(options.body);
      writes.push(body.content);
      return Response.json({ sha: `blob-${writes.length}` });
    }
    if (path.endsWith('/git/trees')) return Response.json({ sha: 'tree-sha' });
    if (path.endsWith('/git/commits')) return Response.json({ sha: 'commit-sha', html_url: 'https://github.test/commit/commit-sha' });
    if (path.includes('/git/refs/heads/')) return Response.json({ object: { sha: 'commit-sha' } });
    throw new Error(`Unhandled GitHub mock request: ${method} ${path}`);
  };
  return {
    writes,
    restore() { globalThis.fetch = original; }
  };
}

function confirmation(workspaceId, extras = {}) {
  return {
    sourceWorkspaceId: 'founder-os',
    reason: 'Founder approved lifecycle transition for workspace management.',
    confirmation: {
      approved: true,
      effectAcknowledged: true,
      workspaceId,
      ...extras
    }
  };
}

test('blocks lifecycle actions against protected workspaces', async () => {
  const response = await handleWorkspaceLifecycle(
    request('natural-nation', { action: 'archive', ...confirmation('natural-nation') }),
    env(),
    '/v2/workspaces/natural-nation/lifecycle'
  );
  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.error.code, 'PROTECTED_WORKSPACE');
});

test('archives by immutable workspace ID and writes registry plus audit evidence', async () => {
  const mock = installGithubMock();
  try {
    const response = await handleWorkspaceLifecycle(
      request('ws_test-001', { action: 'archive', ...confirmation('ws_test-001') }),
      env(),
      '/v2/workspaces/ws_test-001/lifecycle'
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.workspace.workspaceId, 'ws_test-001');
    assert.equal(payload.workspace.lifecycleStatus, 'archived');
    assert.equal(payload.audit.priorState, 'created');
    assert.equal(payload.audit.resultingState, 'archived');
    assert.equal(mock.writes.length, 2);
    assert.match(mock.writes[0], /"lifecycleStatus": "archived"/);
    assert.match(mock.writes[1], /"action": "archive"/);
  } finally {
    mock.restore();
  }
});

test('requires soft delete before purge and separate permanent confirmation', async () => {
  const mock = installGithubMock();
  try {
    const check = await handleWorkspaceLifecycle(
      request('ws_test-001', { action: 'purge-check', sourceWorkspaceId: 'founder-os' }),
      env(),
      '/v2/workspaces/ws_test-001/lifecycle'
    );
    const checkPayload = await check.json();
    assert.equal(checkPayload.eligible, false);
    assert.equal(checkPayload.blockers[0].code, 'WORKSPACE_NOT_SOFT_DELETED');

    const purge = await handleWorkspaceLifecycle(
      request('ws_test-001', { action: 'purge', ...confirmation('ws_test-001') }),
      env(),
      '/v2/workspaces/ws_test-001/lifecycle'
    );
    assert.equal(purge.status, 422);
    const purgePayload = await purge.json();
    assert.equal(purgePayload.error.code, 'PERMANENT_PURGE_CONFIRMATION_REQUIRED');
  } finally {
    mock.restore();
  }
});

test('restores a soft-deleted workspace to its prior operational state', async () => {
  const registry = structuredClone(REGISTRY);
  registry.workspaces[1] = {
    ...registry.workspaces[1],
    status: 'deleted',
    lifecycleStatus: 'soft-deleted',
    deletedAt: '2026-07-26T01:00:00.000Z',
    lifecycle: { previousOperationalStatus: 'foundation' }
  };
  const mock = installGithubMock(registry);
  try {
    const response = await handleWorkspaceLifecycle(
      request('ws_test-001', { action: 'restore', ...confirmation('ws_test-001') }),
      env(),
      '/v2/workspaces/ws_test-001/lifecycle'
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.workspace.status, 'foundation');
    assert.equal(payload.workspace.lifecycleStatus, 'created');
    assert.equal('deletedAt' in payload.workspace, false);
  } finally {
    mock.restore();
  }
});
