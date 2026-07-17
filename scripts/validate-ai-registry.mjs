import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const registry = await readJson('docs/founder-os/ai-registry/registry.json');
const route = await readJson('docs/founder-os/ai-registry/routing-example.json');

const unique = (items, key, label) => {
  const values = items.map((item) => item[key]);
  assert.equal(new Set(values).size, values.length, `${label} IDs must be unique.`);
};

unique(registry.roles, 'roleId', 'Role');
unique(registry.capabilities, 'capabilityId', 'Capability');
unique(registry.providers, 'providerId', 'Provider');
unique(registry.models, 'modelId', 'Model');
unique(registry.tools, 'toolId', 'Tool');

const capabilityIds = new Set(registry.capabilities.map((item) => item.capabilityId));
const roleIds = new Set(registry.roles.map((item) => item.roleId));
const providerIds = new Set(registry.providers.map((item) => item.providerId));
const modelIds = new Set(registry.models.map((item) => item.modelId));
const toolIds = new Set(registry.tools.map((item) => item.toolId));

for (const provider of registry.providers) assert.equal(provider.independentAuthority, false, `${provider.providerId} must not have independent authority.`);
for (const role of registry.roles) {
  assert(!providerIds.has(role.roleId), `Role ${role.roleId} must not be a provider name.`);
  for (const capability of role.requiredCapabilities) assert(capabilityIds.has(capability), `Unknown role capability: ${capability}`);
}
for (const model of registry.models) {
  assert(providerIds.has(model.providerId), `Model ${model.modelId} references an unknown provider.`);
  for (const capability of model.capabilities) assert(capabilityIds.has(capability), `Unknown model capability: ${capability}`);
}
for (const tool of registry.tools) for (const capability of tool.capabilities) assert(capabilityIds.has(capability), `Unknown tool capability: ${capability}`);

const workspaceIds = new Set(registry.workspaceTeams.map((team) => team.workspaceId));
assert(workspaceIds.has('natural-nation'), 'Natural Nation team is required.');
assert(workspaceIds.has('contractor-estimator'), 'Contractor Estimator team is required.');

for (const team of registry.workspaceTeams) {
  for (const assignment of team.assignments) {
    assert(roleIds.has(assignment.roleId), `${team.workspaceId} references an unknown role.`);
    for (const capability of assignment.requiredCapabilities) assert(capabilityIds.has(capability), `Unknown assignment capability: ${capability}`);
    for (const tool of assignment.permittedTools) assert(toolIds.has(tool), `Unknown permitted tool: ${tool}`);
    assert(modelIds.has(assignment.routing.primaryModelId), `Unknown primary model.`);
    for (const model of assignment.routing.fallbackModelIds) assert(modelIds.has(model), `Unknown fallback model.`);
    assert.equal(assignment.routing.preserveContract, true, 'Fallback routing must preserve the task contract.');

    const eligibleModels = [assignment.routing.primaryModelId, ...assignment.routing.fallbackModelIds]
      .map((id) => registry.models.find((model) => model.modelId === id));
    for (const model of eligibleModels) {
      for (const capability of assignment.requiredCapabilities) {
        assert(model.capabilities.includes(capability), `${model.modelId} cannot satisfy ${assignment.roleId}: ${capability}`);
      }
    }
  }
}

assert.equal(route.routingDecision.fallbackUsed, true);
assert.equal(route.routingDecision.roleChanged, false);
assert.equal(route.routingDecision.taskContractChanged, false);
assert.equal(route.routingDecision.approvalBoundaryChanged, false);
assert.equal(route.routingDecision.evidenceRequirementsChanged, false);
assert.equal(route.execution.independentProviderAuthority, false);
assert.equal(route.execution.founderApprovalRequiredForExternalDelivery, true);
assert.equal(route.protectedSecurityBoundaryChanged, false);
assert(route.execution.auditReference, 'Routing must produce an audit reference.');

console.log('FOS-FOUNDATION-007 AI registry validation passed.');