import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const manifest = readJson('founder-os/workspaces/natural-nation/workspace.manifest.json');
const migration = readJson('founder-os/workspaces/natural-nation/migration.contract.json');
const routes = readJson('founder-os/workspaces/natural-nation/route-ownership.map.json');

assert(manifest.workspaceNumber === 1, 'Natural Nation must remain Workspace #1.');
assert(manifest.workspaceId === 'workspace-001-natural-nation', 'Unexpected Natural Nation workspace ID.');
assert(manifest.lifecycleState === 'active', 'Natural Nation must be represented as an active workspace.');
assert(manifest.migration.preserveCanonicalUserUuid === true, 'Guest First UUID preservation is required.');

const requiredLocks = [
  'navigation-architecture',
  'dashboard-structure',
  'duey-core-role',
  'wellness-score',
  'rejuvenation-score',
  'agr-001',
  'guest-first',
  'feature-based-repository',
  'flow-001-onboarding'
];
for (const lock of requiredLocks) {
  assert(manifest.lockedProductDecisions.includes(lock), `Missing locked decision: ${lock}`);
}

assert(migration.workflowBindings.length === 5, 'All five Natural Nation legacy AI tasks must be mapped.');
assert(migration.aiTeamBindings.length >= 3, 'Natural Nation must define its minimum AI team.');
assert(migration.approvalBindings.lockedProductDecisionChange === 'founder-required', 'Locked decisions must remain Founder-gated.');
assert(migration.approvalBindings.securityBoundaryChange === 'founder-required', 'Security-boundary changes must remain Founder-gated.');

const authRoute = routes.routes.find((entry) => entry.route === '/api/v1/auth/*');
assert(authRoute?.owner === 'founder-os', 'Authentication must remain Founder OS-owned.');
assert(authRoute?.workspaceContextRequired === false, 'Authentication must not be moved into workspace routing.');

for (const entry of routes.routes.filter((route) => route.owner === 'natural-nation')) {
  assert(entry.workspaceContextRequired === true, `Workspace context required for ${entry.route}`);
}

assert(routes.contextRules.crossWorkspaceMismatch === 'block-and-audit', 'Cross-workspace mismatches must block and audit.');

console.log('FOS-FOUNDATION-008 validation passed.');
