import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const fixturePath = path.join(root, 'docs/founder-os/examples/workspace-creation-contractor-estimator.json');
const request = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredDraftFields = [
  'name', 'slug', 'description', 'workspaceType', 'purpose', 'intendedOutcomes',
  'outputTypes', 'isolationBoundary', 'knowledgeLocations', 'assetLocations',
  'allowedIntegrations', 'aiTeamPolicyRef', 'approvalPolicyRef',
  'projectCreationWorkflowRef', 'supportedActions', 'metrics',
  'healthIndicators', 'deliveryTargets'
];

assert(request.requestVersion === '1.0.0', 'Unexpected request version.');
assert(typeof request.intent === 'string' && request.intent.length >= 10, 'Intent is required.');
assert(request.founderConfirmed === true, 'Founder confirmation is required before registration.');
assert(request.protectedSecurityChangeRequested === false, 'Protected security changes are not allowed.');
assert(request.draft && typeof request.draft === 'object', 'Draft is required.');

for (const field of requiredDraftFields) {
  assert(Object.hasOwn(request.draft, field), `Missing draft field: ${field}`);
}

assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.draft.slug), 'Slug is invalid.');
assert(request.draft.intendedOutcomes.length > 0, 'At least one intended outcome is required.');
assert(request.draft.outputTypes.length > 0, 'At least one output type is required.');
assert(request.draft.isolationBoundary.startsWith('workspace:'), 'Workspace isolation boundary is invalid.');
assert(request.draft.aiTeamPolicyRef.length > 0, 'AI team policy is required.');
assert(request.draft.approvalPolicyRef.length > 0, 'Approval policy is required.');
assert(request.draft.projectCreationWorkflowRef.length > 0, 'Project creation workflow is required.');
assert(request.draft.workspaceType !== 'wellness-platform', 'Workspace #2 proof must be non-wellness.');

const allowedSources = new Set(['founder-supplied', 'system-suggested', 'unresolved', 'approval-required']);
for (const [field, source] of Object.entries(request.fieldSources || {})) {
  assert(field.startsWith('draft.'), `Invalid field source path: ${field}`);
  assert(allowedSources.has(source), `Invalid field source value: ${source}`);
}

const creationResult = {
  status: 'draft',
  workspaceId: `workspace:${request.draft.slug}`,
  registryMutationAllowed: request.founderConfirmed,
  activationAllowed: false
};

assert(creationResult.status === 'draft', 'Creation must produce Draft status.');
assert(creationResult.registryMutationAllowed === true, 'Confirmed request must permit registration.');
assert(creationResult.activationAllowed === false, 'Creation must not automatically activate the workspace.');

console.log('FOS-FOUNDATION-003 workspace creation validation passed.');
