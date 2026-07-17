import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const fixturePath = path.join(root, 'fixtures', 'workspace-context-routing.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(Array.isArray(fixture.contexts) && fixture.contexts.length >= 4, 'Context fixtures are required.');

for (const context of fixture.contexts) {
  assert(context.protectedSecurityBoundaryChanged === false, `${context.contextId}: protected security boundary changed.`);
  assert(typeof context.auditReference === 'string' && context.auditReference.length > 0, `${context.contextId}: audit reference required.`);

  if (context.scope === 'platform') {
    assert(!context.workspaceId, `${context.contextId}: platform context must not claim a workspace.`);
    assert(context.route.startsWith('/founder-os'), `${context.contextId}: platform route must begin with /founder-os.`);
  }

  if (context.scope === 'workspace') {
    assert(typeof context.workspaceId === 'string' && context.workspaceId.length > 0, `${context.contextId}: workspace ID required.`);
    assert(context.route.startsWith(`/workspaces/${context.workspaceId}`), `${context.contextId}: route must match active workspace.`);
    const referencesMatch = context.resourceWorkspaceId === context.workspaceId;
    assert(context.executionAllowed === referencesMatch, `${context.contextId}: execution decision must match workspace isolation.`);
    if (!referencesMatch) {
      assert(typeof context.blockedReason === 'string' && context.blockedReason.length > 0, `${context.contextId}: mismatched context requires blocked reason.`);
    }
  }
}

const naturalNation = fixture.contexts.find((item) => item.workspaceId === 'natural-nation' && item.executionAllowed);
const contractor = fixture.contexts.find((item) => item.workspaceId === 'contractor-estimator' && item.executionAllowed);
const blocked = fixture.contexts.find((item) => item.executionAllowed === false);

assert(naturalNation, 'Natural Nation workspace context proof is required.');
assert(contractor, 'Contractor Estimator workspace context proof is required.');
assert(blocked?.workspaceId !== blocked?.resourceWorkspaceId, 'Cross-workspace fixture must contain a real mismatch.');
assert(blocked?.requestedAction === 'open-project', 'Blocked proof must test a workspace-owned action.');

if (failures.length > 0) {
  console.error('Workspace context validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workspace context and routing validation passed.');
