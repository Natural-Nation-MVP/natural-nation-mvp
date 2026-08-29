import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const json=(path)=>JSON.parse(read(path));
const registry=json('docs/founder-os/registry/natural-nation-backlog.json');
const schema=json('docs/founder-os/schemas/backlog-item.schema.json');
const controller=read('docs/founder-os/js/mission-control.js');
const route=read('services/founder-os-gateway/src/routes/backlog.js');
const gateway=read('services/founder-os-gateway/src/index.js');
const css=read('docs/founder-os/css/founder-os.css');

assert.equal(registry.workspaceId,'natural-nation');assert.equal(registry.workspaceNumber,1);
assert.equal(registry.items.length,4);assert.equal(new Set(registry.items.map((item)=>item.backlogId)).size,4);
assert(registry.items.every((item)=>item.issueNumber&&item.issueUrl&&item.ownerRole&&item.approvalClass&&item.release?.target&&item.release?.phase&&item.nextAction&&item.evidenceRefs.length));
assert(registry.items.some((item)=>item.status==='needs-reconciliation'&&item.backlogId==='NN-BACKLOG-001'));
assert.equal(schema.additionalProperties,false);
assert.match(controller,/NATURAL_NATION_BACKLOG_ENDPOINT/);assert.match(controller,/currentWorkspaceId\(\)==='natural-nation'/);assert.match(controller,/Workspace #1 only/);assert.match(controller,/backlog-issue-link/);
assert.match(route,/BACKLOG_SCOPE_INVALID/);assert.match(route,/cache-control.*no-store/);assert.match(route,/readOnly: true/);
assert.match(gateway,/handleBacklog/);assert.match(gateway,/liveWorkspaceBacklog/);assert.match(css,/backlog-summary/);assert.match(css,/@media\(max-width:560px\)/);
assert(!JSON.stringify(registry).match(/api[_-]?key|authorization|password|secret/i));
console.log('FOS-PHASE-6-LIVE-BACKLOG-001 validation passed');
