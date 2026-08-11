import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [ui, route, registry] = await Promise.all([
  read('docs/founder-os/js/ai-orchestration.js'),
  read('services/founder-os-gateway/src/routes/ai-orchestration.js'),
  read('docs/founder-os/config/ai-agent-registry.json').then(JSON.parse)
]);

for (const control of ['open', 'retry', 'handoff', 'reassign', 'provider_switch', 'submit_review']) {
  assert(ui.includes(`data-ai-control="${control}"`), `Missing AI Team control: ${control}`);
}
for (const contract of [
  'Governed AI Team Actions',
  'Role identity',
  'Provider override',
  'one request',
  'expectedUpdatedAt',
  'founder-os:ai-team-control-recorded',
  '/control'
]) assert(ui.includes(contract), `Missing AI Team UI contract: ${contract}`);

for (const contract of [
  'CONTROL_ACTIONS',
  'AI_TEAM_CONTROL_REJECTED',
  'expectedUpdatedAt',
  'executionProviderOverride',
  'providerOverrideScope',
  '"single-request"',
  'founderControls',
  'commitFilesAtomically'
]) assert(route.includes(contract), `Missing Gateway AI Team contract: ${contract}`);

assert(route.includes('authenticateFounder(request, env)'));
assert(route.includes('Completed work cannot be changed'));
assert(route.includes('No orchestration state exists for this workspace and package.'));
assert(route.includes('Select a supported AI role for this handoff.'));
assert(route.includes('Provider switching requires an active AI-owned task'));
assert(!route.includes('authenticateAgentCallback(request, env, controlRoute)'));

const ids = new Set(registry.agents.map((agent) => agent.id));
for (const id of ['art', 'codex', 'gemini', 'gpose', 'founder']) assert(ids.has(id));
for (const agent of registry.agents) {
  assert(agent.role && agent.provider && Array.isArray(agent.allowedActions));
}

console.log('Founder OS AI Team controls validation passed.');
