import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const fail = (message) => {
  console.error(`FOS-FOUNDATION-012 validation failed: ${message}`);
  process.exit(1);
};

const manifest = readJson('founder-os/scheduling/scheduling-engine.manifest.json');
const registry = readJson('founder-os/scheduling/automation-policy-registry.json');
const fixtureFile = readJson('founder-os/scheduling/fixtures/automation-fixtures.json');

if (manifest.protectedBoundary !== 'FOS-DIRECTIVE-001') fail('protected boundary missing');
if (!manifest.invariants.some((rule) => rule.includes('exactly one workspaceId'))) fail('single-workspace invariant missing');
if (!manifest.invariants.some((rule) => rule.includes('Founder approval is never inferred'))) fail('approval invariant missing');

const requiredPolicies = [
  'single-workspace-context',
  'registered-target-only',
  'no-overlap-default',
  'consequential-idempotency',
  'approval-preservation',
  'missed-run-bounds',
  'condition-watch-cooldown',
  'protected-data-exclusion'
];
const policyIds = new Set(registry.policies.map((policy) => policy.policyId));
for (const policyId of requiredPolicies) {
  if (!policyIds.has(policyId)) fail(`missing policy ${policyId}`);
}

const fixtures = fixtureFile.fixtures;
if (!Array.isArray(fixtures) || fixtures.length < 3) fail('expected at least three fixtures');
for (const fixture of fixtures) {
  for (const key of ['automationId', 'workspaceId', 'target', 'trigger', 'timezone', 'state', 'overlapPolicy', 'missedRunPolicy', 'auditRef']) {
    if (fixture[key] === undefined) fail(`${fixture.automationId ?? 'unknown'} missing ${key}`);
  }
}

const nn = fixtures.find((fixture) => fixture.automationId === 'automation-nn-daily-mvp-health');
if (!nn || nn.workspaceId !== 'workspace-001-natural-nation') fail('Natural Nation fixture invalid');
if (nn.overlapPolicy !== 'forbid' || nn.missedRunPolicy !== 'run_once') fail('Natural Nation recovery policy invalid');

const ce = fixtures.find((fixture) => fixture.automationId === 'automation-ce-provider-recovery-watch');
if (!ce || ce.trigger.type !== 'condition_watch' || ce.trigger.cooldownMinutes < 1) fail('Contractor Estimator watch invalid');

const blocked = fixtures.find((fixture) => fixture.automationId === 'automation-blocked-cross-workspace');
if (!blocked || blocked.state !== 'blocked') fail('cross-workspace blocking fixture missing');

console.log('FOS-FOUNDATION-012 validation passed.');
