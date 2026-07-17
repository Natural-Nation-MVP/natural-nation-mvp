import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pass = (message) => console.log(`PASS: ${message}`);

const backbone = readJson('founder-os/runtime/runtime-backbone.json');
const schema = readJson('founder-os/runtime/runtime-request.schema.json');
const fixtures = [
  readJson('founder-os/runtime/fixtures/natural-nation.runtime-request.json'),
  readJson('founder-os/runtime/fixtures/contractor-estimator.runtime-request.json')
];

if (backbone.constitutionalDirective !== 'FOS-DIRECTIVE-001') fail('constitutional directive missing'); else pass('constitutional directive preserved');
if (backbone.defaultDecision !== 'deny') fail('runtime must deny by default'); else pass('deny-by-default enforced');
for (const required of ['validate_policy_and_approval', 'capture_evidence', 'emit_audit', 'emit_observability', 'reconcile_cost']) {
  if (!backbone.pipeline.includes(required)) fail(`pipeline missing ${required}`); else pass(`pipeline includes ${required}`);
}
if (!backbone.hardStops.includes('cross_workspace_reference')) fail('cross-workspace hard stop missing'); else pass('workspace isolation hard stop present');
if (!backbone.hardStops.includes('changed_payload_after_approval')) fail('approval replay protection missing'); else pass('payload-bound approval protection present');
if (!schema.required.includes('workspaceId') || !schema.required.includes('payloadHash')) fail('request schema missing governed context'); else pass('request schema requires workspace and payload hash');
const workspaces = new Set(fixtures.map((fixture) => fixture.workspaceId));
if (workspaces.size !== fixtures.length) fail('fixtures do not demonstrate isolated workspaces'); else pass('fixtures demonstrate isolated workspace contexts');
for (const fixture of fixtures) {
  if (!/^[a-f0-9]{64}$/.test(fixture.payloadHash)) fail(`${fixture.requestId} has invalid payload hash`);
  if (!fixture.workflowId) fail(`${fixture.requestId} lacks registered workflow reference`);
}
if (!process.exitCode) console.log('Founder OS runtime backbone validation complete.');
