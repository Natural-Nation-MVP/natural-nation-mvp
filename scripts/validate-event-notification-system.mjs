import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(
  fs.readFileSync(path.join(root, relativePath), 'utf8'),
);

const manifest = readJson('founder-os/events/event-notification-manifest.json');
const schema = readJson('founder-os/events/event-envelope.schema.json');
const policies = readJson('founder-os/events/notification-policies.json');
const fixtures = readJson('founder-os/events/fixtures/event-notification-fixtures.json');

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(manifest.id === 'FOS-FOUNDATION-011', 'Manifest ID is incorrect.');
assert(manifest.governance.approvalCannotBeInferred === true, 'Approval inference must be forbidden.');
assert(manifest.governance.notificationCannotExecuteConsequentialAction === true, 'Notifications must not execute consequential actions.');
assert(manifest.governance.crossWorkspaceMutationForbidden === true, 'Cross-workspace mutation must be forbidden.');
assert(manifest.governance.protectedDataRedactionRequired === true, 'Protected-data redaction must be required.');
assert(schema.properties.containsProtectedData.const === false, 'Canonical envelope must reject protected data.');

for (const policy of policies.policies) {
  const forbidden = new Set(policy.forbiddenActions ?? []);
  assert(!policy.allowedActions?.includes('approve'), `${policy.id} must not allow direct approval.`);
  assert(!policy.allowedActions?.includes('execute'), `${policy.id} must not allow direct execution.`);
  assert(
    forbidden.has('execute') || forbidden.has('approve_from_notification') || forbidden.has('approve'),
    `${policy.id} must explicitly forbid consequential notification actions.`,
  );
}

const allEvents = fixtures.fixtures.flatMap((fixture) => fixture.events ?? [fixture.event]);
for (const event of allEvents) {
  assert(Boolean(event.eventId), 'Every fixture event requires an eventId.');
  assert(Boolean(event.auditReference), `${event.eventId} requires an audit reference.`);
  assert(Boolean(event.ownerContext?.id), `${event.eventId} requires an owner context.`);
  if (event.scope === 'workspace') {
    assert(event.ownerContext.type === 'workspace', `${event.eventId} has a workspace scope mismatch.`);
  }
}

const approvalFixture = fixtures.fixtures.find((item) => item.name.includes('approval request'));
assert(approvalFixture.expected.notificationMayApprove === false, 'Approval notification must not approve.');
assert(approvalFixture.expected.executionRemainsPaused === true, 'Approval execution must remain paused.');

const dedupeFixture = fixtures.fixtures.find((item) => item.name.includes('repeated provider outage'));
const dedupeEvents = dedupeFixture.events;
assert(dedupeEvents[0].correlationId === dedupeEvents[1].correlationId, 'Repeated events must share correlation ID.');
assert(dedupeFixture.expected.attentionItemsCreated === 1, 'Repeated events must deduplicate to one attention item.');

const protectedFixture = fixtures.fixtures.find((item) => item.name.includes('Protected data'));
assert(protectedFixture.event.containsProtectedData === true, 'Protected-data rejection fixture is malformed.');
assert(protectedFixture.expected.deliveryBlocked === true, 'Protected-data delivery must be blocked.');

if (failures.length > 0) {
  console.error('FOS-FOUNDATION-011 validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('FOS-FOUNDATION-011 validation passed.');
console.log(`Validated ${allEvents.length} events and ${policies.policies.length} notification policies.`);
