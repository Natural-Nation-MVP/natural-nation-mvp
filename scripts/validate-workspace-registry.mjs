import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));

const registry = await readJson("docs/founder-os/registry/workspaces.json");
const lifecycle = await readJson("docs/founder-os/registry/workspace-lifecycle.json");
const fixture = await readJson("docs/founder-os/registry/fixtures/workspace-002-non-wellness.json");

const STATES = new Set([
  "draft",
  "active",
  "paused",
  "archived",
  "restored",
  "scheduled_for_deletion",
  "deleted"
]);

const REQUIRED_ISOLATION = [
  "namespace",
  "dataBoundary",
  "assetBoundary",
  "executionBoundary",
  "knowledgeBoundary",
  "deliverableBoundary"
];

const REQUIRED_LOCATIONS = ["source", "knowledge", "assets", "deliverables"];
const REQUIRED_GOVERNANCE = ["approvalPolicyRef", "auditPolicyRef", "protectedBoundaryRef"];

function validateWorkspace(workspace, label = workspace?.workspaceId || "workspace") {
  assert.match(workspace.workspaceId, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${label}: invalid workspaceId`);
  assert.ok(workspace.displayName, `${label}: displayName is required`);
  assert.ok(Number.isInteger(workspace.sequence) && workspace.sequence > 0, `${label}: sequence must be a positive integer`);
  assert.match(workspace.workspaceType, /^[a-z0-9]+(?:_[a-z0-9]+)*$/, `${label}: invalid workspaceType`);
  assert.ok(workspace.description, `${label}: description is required`);
  assert.ok(STATES.has(workspace.status), `${label}: invalid lifecycle status`);
  assert.equal(workspace.ownerType, "founder", `${label}: ownerType must be founder`);

  for (const field of REQUIRED_ISOLATION) assert.ok(workspace.isolation?.[field], `${label}: missing isolation.${field}`);
  for (const field of REQUIRED_LOCATIONS) assert.ok(workspace.locations?.[field], `${label}: missing locations.${field}`);
  for (const field of REQUIRED_GOVERNANCE) assert.ok(workspace.governance?.[field], `${label}: missing governance.${field}`);

  assert.ok(Array.isArray(workspace.capabilities), `${label}: capabilities must be an array`);
  assert.equal(new Set(workspace.capabilities).size, workspace.capabilities.length, `${label}: duplicate capabilities`);
  assert.ok(["unknown", "healthy", "attention", "blocked", "inactive"].includes(workspace.health?.state), `${label}: invalid health state`);
  assert.ok(workspace.health?.summary, `${label}: health summary is required`);
  assert.ok(!Number.isNaN(Date.parse(workspace.createdAt)), `${label}: createdAt must be a timestamp`);
  assert.ok(!Number.isNaN(Date.parse(workspace.updatedAt)), `${label}: updatedAt must be a timestamp`);

  if (workspace.status === "scheduled_for_deletion") {
    assert.equal(workspace.lifecycle?.founderApproval?.approved, true, `${label}: scheduled deletion requires Founder approval`);
    assert.ok(workspace.lifecycle?.scheduledDeletionAt, `${label}: scheduledDeletionAt is required`);
  }

  if (workspace.status === "deleted") {
    assert.equal(workspace.lifecycle?.founderApproval?.approved, true, `${label}: deletion requires Founder approval`);
    assert.ok(workspace.lifecycle?.deletedAt, `${label}: deletedAt is required`);
    assert.ok(workspace.lifecycle?.auditRef, `${label}: deletion auditRef is required`);
  }
}

assert.match(registry.schemaVersion, /^\d+\.\d+\.\d+$/, "registry schemaVersion is invalid");
assert.equal(registry.registryId, "founder-os-workspace-registry");
assert.ok(!Number.isNaN(Date.parse(registry.updatedAt)), "registry updatedAt must be a timestamp");
assert.ok(Array.isArray(registry.workspaces) && registry.workspaces.length > 0, "registry must contain workspaces");

for (const workspace of registry.workspaces) validateWorkspace(workspace);

const workspaceIds = registry.workspaces.map((workspace) => workspace.workspaceId);
const sequences = registry.workspaces.map((workspace) => workspace.sequence);
assert.equal(new Set(workspaceIds).size, workspaceIds.length, "workspace IDs must be unique");
assert.equal(new Set(sequences).size, sequences.length, "workspace sequence numbers must be unique");

const naturalNation = registry.workspaces.find((workspace) => workspace.workspaceId === "natural-nation");
assert.ok(naturalNation, "Natural Nation must be registered");
assert.equal(naturalNation.sequence, 1, "Natural Nation must be Workspace #1");
assert.notEqual(naturalNation.workspaceType, "founder_os", "Natural Nation must not be Founder OS core");

assert.equal(lifecycle.lifecycleId, "founder-os-workspace-lifecycle");
assert.deepEqual(new Set(lifecycle.states), STATES, "lifecycle states must match the constitutional model");
for (const [from, targets] of Object.entries(lifecycle.transitions)) {
  assert.ok(STATES.has(from), `unknown lifecycle source state: ${from}`);
  assert.ok(Array.isArray(targets), `transition targets for ${from} must be an array`);
  for (const target of targets) assert.ok(STATES.has(target), `unknown lifecycle target state: ${target}`);
}
assert.deepEqual(lifecycle.transitions.deleted, [], "deleted must be terminal");
assert.ok(lifecycle.approvalRequired.some((rule) => rule.to === "scheduled_for_deletion" && rule.approvalType === "founder_explicit"));
assert.ok(lifecycle.approvalRequired.some((rule) => rule.from === "scheduled_for_deletion" && rule.to === "deleted" && rule.approvalType === "founder_explicit"));

validateWorkspace(fixture, "Workspace #2 fixture");
assert.equal(fixture.sequence, 2);
assert.notEqual(fixture.workspaceType, naturalNation.workspaceType, "Workspace #2 fixture must prove a different domain");
assert.ok(!fixture.workspaceId.includes("natural-nation"), "Workspace #2 fixture must be product independent");

const invalidTransition = lifecycle.transitions.active.includes("deleted");
assert.equal(invalidTransition, false, "active workspaces must not transition directly to deleted");

console.log(`Workspace registry validation passed for ${registry.workspaces.length} registered workspace(s) plus Workspace #2 fixture.`);
