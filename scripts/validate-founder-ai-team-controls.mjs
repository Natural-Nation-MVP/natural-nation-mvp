import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [ui, route, registry] = await Promise.all([
  read('docs/founder-os/js/ai-orchestration.js'),
  read('services/founder-os-gateway/src/routes/ai-orchestration.js'),
  read('docs/founder-os/config/ai-agent-registry.json').then(JSON.parse)
]);

for (const contract of [
  'AI-Controlled Team',
  'Workspace Team Plan',
  'effectiveTeam',
  'state?.teamPlan?.roles',
  'Monitor by exception',
  'Founder override and recovery',
  'data-founder-ai-override'
]) assert(ui.includes(contract), `Missing AI-composed team UI contract: ${contract}`);

for (const control of ['open', 'retry', 'handoff', 'reassign', 'provider_switch', 'submit_review']) {
  assert(ui.includes(`data-ai-control="${control}"`), `Missing Founder exception control: ${control}`);
}
assert(ui.indexOf('data-founder-ai-override') < ui.indexOf('data-ai-control="handoff"'));
assert(!ui.includes('Enter the AI role: art, codex, gemini, or gpose.'));

for (const contract of [
  'parseTeamPlanRoute',
  'recordAiTeamPlan',
  'normalizePlannedRole',
  'AI_TEAM_PLAN_REJECTED',
  'ai-team-composed',
  'team-plan.json',
  'between 1 and 12 roles',
  'AI-created role IDs must be unique',
  'expectedUpdatedAt',
  'founderOverrideAvailable'
]) assert(route.includes(contract), `Missing AI team composition Gateway contract: ${contract}`);

assert(route.includes('authenticateAgentCallback(request, env)'));
assert(route.includes('authenticateFounder(request, env)'));
assert(route.includes('executionProviderOverride'));
assert(route.includes('"single-request"'));
assert(route.includes('Completed work cannot be changed'));
assert(route.includes('active workspace-scoped AI role'));

assert.equal(registry.registryVersion, '2.0.0');
assert.equal(registry.operatingModel, 'role-templates-for-ai-composed-workspace-teams');
const requiredGovernedRoles = new Set(['art', 'codex', 'gemini', 'gpose', 'duey', 'founder']);
for (const roleId of requiredGovernedRoles) {
  assert(registry.agents.some((agent) => agent.id === roleId), `Missing governed AI role template: ${roleId}`);
}
for (const agent of registry.agents) {
  assert(agent.role && agent.provider && Array.isArray(agent.allowedActions));
  assert('templateOnly' in agent);
  assert(agent.workspaceRoleSource);
}

const duey = registry.agents.find((agent) => agent.id === 'duey');
assert.equal(duey.workspaceRoleSource, 'ai-team-plan');
assert.equal(duey.templateOnly, true);
assert(duey.allowedActions.includes('validate-protocol-logic'));
assert(duey.requiresFounderApprovalFor.includes('mentor-identity-change'));
assert(route.includes('"duey"'), 'Duey must be available to governed AI-composed workspace plans.');

console.log('Founder OS AI-controlled team composition validation passed.');
