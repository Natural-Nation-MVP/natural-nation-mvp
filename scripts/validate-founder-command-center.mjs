import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const manifest = readJson('founder-os/command-center/command-center.manifest.json');
const schema = readJson('founder-os/command-center/cross-workspace-routing.schema.json');
const portfolio = readJson('founder-os/command-center/fixtures/portfolio.json');

assert(manifest.owner === 'founder-os-platform', 'Command Center must remain platform-owned.');
assert(manifest.invariants.workspaceOwnershipPreserved === true, 'Workspace ownership must be preserved.');
assert(manifest.invariants.singleExecutionContextPerAction === true, 'Each action must have one execution context.');
assert(manifest.invariants.crossWorkspaceMutationForbidden === true, 'Cross-workspace mutation must be forbidden.');
assert(manifest.invariants.founderApprovalCannotBeInferred === true, 'Founder approval must never be inferred.');
assert(manifest.protectedBoundary.directive === 'FOS-DIRECTIVE-001', 'Protected directive must remain FOS-DIRECTIVE-001.');

const workspaceIds = new Set();
for (const workspace of portfolio.workspaces) {
  assert(workspace.workspaceId, 'Every portfolio workspace requires workspaceId.');
  assert(!workspaceIds.has(workspace.workspaceId), `Duplicate workspaceId: ${workspace.workspaceId}`);
  workspaceIds.add(workspace.workspaceId);
  assert(Number.isInteger(workspace.workspaceNumber), 'Every workspace requires an integer workspaceNumber.');
  assert(workspace.lastVerifiedAt, 'Every workspace requires lastVerifiedAt.');
}

for (const item of portfolio.attentionQueue) {
  assert(workspaceIds.has(item.workspaceId), `Attention item references unknown workspace: ${item.workspaceId}`);
  assert(item.actionId, 'Every attention item requires actionId.');
  assert(manifest.attentionQueue.allowedTypes.includes(item.type), `Unsupported attention type: ${item.type}`);
}

for (const approval of portfolio.approvalInbox) {
  assert(workspaceIds.has(approval.workspaceId), `Approval references unknown workspace: ${approval.workspaceId}`);
  assert(approval.approvalId, 'Every approval requires approvalId.');
  assert(approval.evidenceRefs.length > 0, 'Every consequential approval requires evidence.');
  assert(approval.verificationStatus, 'Every approval requires verification status.');
}

const requiredOperationFields = schema.required ?? [];
for (const field of ['operationId', 'workspaceId', 'actionId', 'consequenceClass', 'contextStatus']) {
  assert(requiredOperationFields.includes(field), `Routing schema must require ${field}.`);
}

for (const protectedArea of [
  'authentication',
  'authorization',
  'identity',
  'sessions',
  'tokens',
  'secrets',
  'access-control',
  'security-middleware',
  'preventative-security',
  'security-sensitive-infrastructure'
]) {
  assert(manifest.protectedBoundary.unchanged.includes(protectedArea), `Protected area missing: ${protectedArea}`);
}

console.log('FOS-FOUNDATION-009 validation passed.');
console.log(`Validated ${portfolio.workspaces.length} workspaces, ${portfolio.attentionQueue.length} attention items, and ${portfolio.approvalInbox.length} approvals.`);
