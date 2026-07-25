import fs from 'node:fs';

const files = {
  gateway: 'services/founder-os-gateway/src/index.js',
  route: 'services/founder-os-gateway/src/routes/create-workspace.js',
  auth: 'services/founder-os-gateway/src/lib/auth.js',
  client: 'docs/founder-os/js/gateway-client-v2.js',
  discovery: 'docs/founder-os/js/workspace-creation.js',
  tests: 'services/founder-os-gateway/test/create-workspace.test.mjs'
};

for (const path of Object.values(files)) {
  if (!fs.existsSync(path)) throw new Error(`FOUNDER-WS-001 missing required file: ${path}`);
}

const gateway = fs.readFileSync(files.gateway, 'utf8');
const route = fs.readFileSync(files.route, 'utf8');
const auth = fs.readFileSync(files.auth, 'utf8');
const client = fs.readFileSync(files.client, 'utf8');
const discovery = fs.readFileSync(files.discovery, 'utf8');
const tests = fs.readFileSync(files.tests, 'utf8');

for (const contract of [
  'handleCreateWorkspace',
  'protectedWorkspaceCreation',
  'workspaceCreationIdempotency',
  'canonicalWorkspaceRegistry',
  'workspaceScaffolding'
]) {
  if (!gateway.includes(contract)) throw new Error(`Gateway workspace creation contract missing: ${contract}`);
}

for (const contract of [
  '/v2/workspaces',
  'authenticateFounder',
  'x-founder-os-workspace',
  'sourceWorkspaceId',
  'FOUNDER_CONFIRMATION_REQUIRED',
  'IDEMPOTENCY_KEY_REQUIRED',
  'WORKSPACE_CREATION_SCOPE_FORBIDDEN',
  'WORKSPACE_SAFETY_GATE_BLOCKED',
  'WORKSPACE_ALREADY_EXISTS',
  'FOUNDER_OS_RUNTIME_STORE',
  'status: "running"',
  'status: "committed"',
  'commitFilesAtomically',
  'docs/founder-os/registry/workspaces.json',
  'canonical-monorepo',
  'governance/approved-blueprint.json',
  'governance/ai-team.json',
  'knowledge/README.md',
  'evidence/creation-record.json',
  'Art → Codex → Gemini → GPose → Founder'
]) {
  if (!route.includes(contract)) throw new Error(`Protected creation route contract missing: ${contract}`);
}

if (!auth.includes('"workspace:create"')) throw new Error('Founder authentication does not authorize workspace creation.');

for (const contract of [
  'createWorkspace',
  "headers: { 'x-founder-os-workspace': 'founder-os' }",
  "sourceWorkspaceId: 'founder-os'",
  'effectAcknowledged: true',
  "createClientRequestId('workspace-create')"
]) {
  if (!client.includes(contract)) throw new Error(`Gateway client workspace creation contract missing: ${contract}`);
}

for (const contract of [
  'Generated securely after approval',
  'data-workspace-confirm',
  'data-workspace-create-protected',
  'executeCreation',
  'Retry safely',
  'View creation evidence',
  'founder-os:workspace-created',
  "state.creation.status = 'creating'",
  "state.creation.status = 'failed'",
  "state.creation.status = 'complete'"
]) {
  if (!discovery.includes(contract)) throw new Error(`Workspace creation UX contract missing: ${contract}`);
}

for (const contract of [
  'blocks creation from a product workspace',
  'requires explicit Founder effect acknowledgement',
  'requires an idempotency key',
  'protects Founder OS and Natural Nation identities',
  're-runs safety and governance checks on the Gateway'
]) {
  if (!tests.includes(contract)) throw new Error(`Workspace creation test contract missing: ${contract}`);
}

if (discovery.includes('no repository action was performed')) {
  throw new Error('Placeholder-only workspace creation alert is still present.');
}

console.log('FOUNDER-WS-001 protected workspace creation contracts passed.');
