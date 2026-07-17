import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const registry = readJson('config/founder-os/integration-registry.json');
const fixtures = readJson('fixtures/founder-os/integration-governance.fixtures.json');

const fail = (message) => {
  console.error(`FOS-FOUNDATION-013 validation failed: ${message}`);
  process.exit(1);
};

if (registry.package !== 'FOS-FOUNDATION-013') fail('wrong package identifier');
if (registry.constitutionalDirective !== 'FOS-DIRECTIVE-001') fail('constitutional directive missing');

const requiredInvariants = [
  'explicitWorkspaceContextRequired',
  'rawCredentialsForbidden',
  'registeredCapabilitiesOnly',
  'crossWorkspaceInvocationBlocked',
  'consequentialWritesRequireFounderApproval',
  'protectedPayloadRequiresRedactionOrBlock',
  'runtimeExecutionRequired',
  'evidenceAndVerificationPreserved',
  'authorityExpansionForbidden'
];

for (const invariant of requiredInvariants) {
  if (registry.invariants?.[invariant] !== true) fail(`required invariant not enabled: ${invariant}`);
}

const capabilities = new Map();
for (const integration of registry.integrations ?? []) {
  for (const capability of integration.capabilities ?? []) {
    const key = `${integration.integrationId}:${capability.capabilityId}`;
    if (capabilities.has(key)) fail(`duplicate capability: ${key}`);
    capabilities.set(key, capability);
  }
}

const dispatchableStates = new Set(['healthy', 'degraded']);

function evaluate(request) {
  if (request.workspaceId !== request.connectionWorkspaceId) return 'workspace-mismatch';
  if (!request.credentialReferenceOnly) return 'raw-credential-forbidden';
  if (!dispatchableStates.has(request.connectionState)) return 'connection-not-dispatchable';

  const capability = capabilities.get(`${request.integrationId}:${request.capabilityId}`);
  if (!capability) return 'unregistered-capability';

  if (request.payloadClassification === 'protected') return 'protected-payload-blocked';

  if (capability.class === 'write-consequential') {
    if (!request.approvalRecord) return 'founder-approval-required';
    if (request.approvalRecord.workspaceId !== request.workspaceId) return 'approval-workspace-mismatch';
    if (!request.approvalRecord.payloadDigest) return 'approval-payload-digest-missing';
    if (!capability.idempotencyRequired) return 'consequential-idempotency-missing';
  }

  return 'allowed';
}

for (const fixture of fixtures.fixtures ?? []) {
  const actual = evaluate(fixture.request);
  const expected = fixture.expected === 'allowed' ? 'allowed' : fixture.reason;
  if (actual !== expected) fail(`${fixture.name}: expected ${expected}, received ${actual}`);
}

console.log(`FOS-FOUNDATION-013 validation passed (${fixtures.fixtures.length} fixtures).`);
