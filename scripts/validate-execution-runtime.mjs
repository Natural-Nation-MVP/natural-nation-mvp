import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const manifest = readJson('founder-os/execution/runtime.manifest.json');
const schema = readJson('founder-os/execution/execution-run.schema.json');
const fixtureFile = readJson('founder-os/execution/fixtures/execution-runtime.fixtures.json');

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(manifest.workspaceContext?.required === true, 'Workspace context must be required.');
assert(manifest.workspaceContext?.singleWorkspaceOnly === true, 'Runtime must use one workspace context.');
assert(manifest.workspaceContext?.crossWorkspaceMutation === false, 'Cross-workspace mutation must be disabled.');
assert(manifest.rules?.approvalCannotBeInferred === true, 'Founder approval must never be inferred.');
assert(manifest.rules?.verificationCannotBeSkipped === true, 'Verification must not be skippable.');
assert(manifest.rules?.auditReferenceRequiredForEveryTransition === true, 'Every transition must require an audit reference.');
assert(manifest.rules?.idempotencyKeyRequiredForConsequentialActions === true, 'Consequential actions must require idempotency.');
assert(manifest.protectedBoundary === 'FOS-DIRECTIVE-001', 'Protected boundary must remain FOS-DIRECTIVE-001.');

for (const terminalState of manifest.terminalStates ?? []) {
  assert(Array.isArray(manifest.transitions?.[terminalState]), `Terminal state ${terminalState} must exist in transitions.`);
  assert(manifest.transitions?.[terminalState]?.length === 0, `Terminal state ${terminalState} must not transition further.`);
}

const requiredSchemaFields = new Set(schema.required ?? []);
for (const requiredField of ['runId', 'workspaceId', 'workflowId', 'status', 'taskContractVersion', 'auditRefs']) {
  assert(requiredSchemaFields.has(requiredField), `Schema must require ${requiredField}.`);
}

const runs = fixtureFile.fixtures.filter((fixture) => fixture.runId);
assert(runs.length >= 2, 'At least two execution-run fixtures are required.');
assert(runs.some((run) => run.workspaceId === 'workspace-001-natural-nation'), 'Natural Nation fixture is required.');
assert(runs.some((run) => run.workspaceId === 'workspace-002-contractor-estimator'), 'Contractor Estimator fixture is required.');

for (const run of runs) {
  assert(manifest.states.includes(run.status), `${run.name}: status must be registered.`);
  assert(typeof run.workspaceId === 'string' && run.workspaceId.length > 0, `${run.name}: workspaceId is required.`);
  assert(Array.isArray(run.auditRefs) && run.auditRefs.length > 0, `${run.name}: auditRefs are required.`);
  assert(typeof run.taskContractVersion === 'string', `${run.name}: task contract version is required.`);

  if (run.status === 'awaiting_founder_approval') {
    assert(run.approval?.required === true, `${run.name}: approval must be required.`);
    assert(run.approval?.status === 'pending', `${run.name}: Founder decision must remain pending.`);
    assert(run.verification?.status === 'passed', `${run.name}: verification must pass before approval.`);
  }

  if (run.status === 'retry_scheduled') {
    assert(run.failure?.retryable === true, `${run.name}: scheduled retry must be retryable.`);
    assert(run.retry?.attempt < run.retry?.maxAttempts, `${run.name}: retry attempts must remain.`);
    assert(run.retry?.recoveryStrategy === 'provider-fallback-preserve-contract', `${run.name}: fallback must preserve contract.`);
  }
}

const mismatch = fixtureFile.fixtures.find((fixture) => fixture.name === 'workspace-mismatch-blocked');
assert(mismatch?.workspaceId !== mismatch?.requestedWorkspaceId, 'Mismatch fixture must use different workspaces.');
assert(mismatch?.expectedResult === 'blocked', 'Workspace mismatch must be blocked.');
assert(mismatch?.failureClass === 'workspace_mismatch', 'Workspace mismatch must use the correct failure class.');

if (errors.length > 0) {
  console.error('Execution runtime validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Execution runtime validation passed.');
console.log(`Validated ${runs.length} workspace execution runs and ${manifest.states.length} task states.`);
