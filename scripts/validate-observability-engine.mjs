import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const engine = readJson('founder-os/observability/observability-engine.json');
const naturalNation = readJson('founder-os/observability/fixtures/natural-nation.observability.json');
const contractorEstimator = readJson('founder-os/observability/fixtures/contractor-estimator.observability.json');

assert(engine.directive === 'FOS-DIRECTIVE-001', 'Constitutional directive must be preserved.');
assert(engine.requirements.explicit_workspace_context === true, 'Workspace context must be explicit.');
assert(engine.requirements.protected_data_excluded === true, 'Protected data must be excluded.');
assert(engine.requirements.founder_approval_preserved === true, 'Founder approval must be preserved.');
assert(engine.prohibitions.includes('perform_unregistered_remediation'), 'Unregistered remediation must be prohibited.');

const validateFixture = (fixture) => {
  assert(typeof fixture.workspace_id === 'string' && fixture.workspace_id.length > 0, 'Fixture workspace_id is required.');
  assert(Array.isArray(fixture.records) && fixture.records.length > 0, 'Fixture records are required.');
  for (const record of fixture.records) {
    assert(record.workspace_id === fixture.workspace_id, `Cross-workspace record blocked: ${record.record_id}`);
    assert(typeof record.audit_ref === 'string' && record.audit_ref.length > 0, `Audit reference required: ${record.record_id}`);
    assert(record.source && record.source.source_id, `Source provenance required: ${record.record_id}`);
    assert(record.classification !== 'restricted', `Restricted data must not enter Founder-visible observability: ${record.record_id}`);
    assert(record.quality && typeof record.quality.confidence === 'number', `Quality confidence required: ${record.record_id}`);
    if (record.remediation_workflow_id) {
      assert(record.founder_attention_required === true, `Remediation recommendation requires Founder attention: ${record.record_id}`);
    }
  }
};

validateFixture(naturalNation);
validateFixture(contractorEstimator);
assert(naturalNation.workspace_id !== contractorEstimator.workspace_id, 'Workspace fixtures must remain isolated.');

console.log('FOS-FOUNDATION-014 observability validation passed.');
