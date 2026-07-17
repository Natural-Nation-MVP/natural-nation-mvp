import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const fixturePath = path.join(root, 'fixtures', 'workspace-activation-contractor-estimator.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(fixture.currentState === 'draft', 'Activation must begin from Draft state.');
assert(fixture.requestedState === 'active', 'Activation must request Active state.');
assert(fixture.protectedSecurityBoundaryChanged === false, 'Protected security boundary must remain unchanged.');
assert(Array.isArray(fixture.readinessReport?.checks) && fixture.readinessReport.checks.length > 0, 'Readiness checks are required.');

const blockingFailures = fixture.readinessReport.checks.filter(
  (check) => check.severity === 'blocking' && check.passed === false,
).length;
const advisoryFindings = fixture.readinessReport.checks.filter(
  (check) => check.severity === 'advisory' && check.passed === false,
).length;

assert(blockingFailures === fixture.readinessReport.blockingFailures, 'Blocking-failure count must match the check results.');
assert(advisoryFindings === fixture.readinessReport.advisoryFindings, 'Advisory-finding count must match the check results.');
assert(fixture.readinessReport.readyForFounderDecision === (blockingFailures === 0), 'Founder decision readiness must be deterministic.');

if (fixture.transitionResult?.outcome === 'activated') {
  assert(blockingFailures === 0, 'A workspace cannot activate with blocking failures.');
  assert(fixture.founderDecision?.status === 'approved', 'Founder approval is required before activation.');
  assert(fixture.transitionResult.resultingState === 'active', 'Successful activation must result in Active state.');
}

assert(fixture.workspaceId === 'ws-contractor-estimator', 'Workspace #2 non-wellness proof must remain product-neutral.');
assert(fixture.transitionResult?.auditReference, 'Activation must produce an audit reference.');

if (failures.length > 0) {
  console.error('Workspace activation validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workspace activation validation passed.');
