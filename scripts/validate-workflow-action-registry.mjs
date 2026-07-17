import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const fixtures = [
  read('fixtures/workflow-action-contractor-estimator.json'),
  read('fixtures/workflow-action-natural-nation-compatibility.json')
];

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

for (const registry of fixtures) {
  assert(registry.schemaVersion === '1.0.0', `${registry.workspaceId}: schema version must be 1.0.0.`);
  assert(registry.protectedSecurityBoundaryChanged === false, `${registry.workspaceId}: protected security boundary changed.`);
  assert(Array.isArray(registry.workflows) && registry.workflows.length > 0, `${registry.workspaceId}: workflows required.`);
  assert(Array.isArray(registry.actions) && registry.actions.length > 0, `${registry.workspaceId}: actions required.`);

  const workflowIds = new Set(registry.workflows.map((workflow) => workflow.workflowId));
  for (const workflow of registry.workflows) {
    assert(workflow.workspaceId === registry.workspaceId, `${registry.workspaceId}: workflow workspace mismatch.`);
    const taskIds = new Set(workflow.tasks.map((task) => task.taskId));
    assert(taskIds.size === workflow.tasks.length, `${workflow.workflowId}: duplicate task IDs.`);

    for (const task of workflow.tasks) {
      assert(Array.isArray(task.capabilities) && task.capabilities.length > 0, `${task.taskId}: capabilities required.`);
      assert(['autonomous', 'verification-gated', 'founder-required', 'protected'].includes(task.approvalClass), `${task.taskId}: invalid approval class.`);
      for (const dependency of task.dependsOn) {
        assert(taskIds.has(dependency), `${task.taskId}: unknown dependency ${dependency}.`);
        assert(dependency !== task.taskId, `${task.taskId}: task cannot depend on itself.`);
      }
    }
  }

  for (const action of registry.actions) {
    assert(action.workspaceId === registry.workspaceId, `${registry.workspaceId}: action workspace mismatch.`);
    if (action.startsWorkflowId) assert(workflowIds.has(action.startsWorkflowId), `${action.actionId}: unknown workflow.`);
    if (['externally-consequential', 'irreversible', 'protected'].includes(action.consequence)) {
      assert(['founder-required', 'protected'].includes(action.approvalClass), `${action.actionId}: consequential action requires Founder or protected approval.`);
    }
    assert(action.auditRequired === true, `${action.actionId}: audit is required.`);
  }

  for (const mapping of registry.compatibilityMappings || []) {
    const workflow = registry.workflows.find((item) => item.workflowId === mapping.workflowId);
    assert(Boolean(workflow), `${mapping.legacyTaskId}: mapped workflow missing.`);
    assert(Boolean(workflow?.tasks.some((task) => task.taskId === mapping.taskId)), `${mapping.legacyTaskId}: mapped task missing.`);
  }
}

const contractor = fixtures.find((fixture) => fixture.workspaceId === 'contractor-estimator');
const naturalNation = fixtures.find((fixture) => fixture.workspaceId === 'natural-nation');
assert(contractor.workflows[0].tasks.length === 4, 'Contractor Estimator must prove a four-task workflow.');
assert(naturalNation.compatibilityMappings.length === 5, 'Natural Nation must map all five legacy task IDs.');
assert(contractor.workflows[0].workflowId !== naturalNation.workflows[0].workflowId, 'Workspaces must own distinct workflows.');

if (failures.length) {
  console.error('Workflow and action registry validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workflow and action registry validation passed for Natural Nation and Contractor Estimator.');
