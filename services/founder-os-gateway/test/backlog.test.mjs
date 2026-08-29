import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBacklog, handleBacklog } from '../src/routes/backlog.js';

const registry={workspaceId:'natural-nation',workspaceNumber:1,updatedAt:'2026-08-29T00:00:00Z',releaseTarget:'Natural Nation MVP / Phase 1',sourceBlueprint:'blueprint.json',sourcePackage:'package.json',items:[
  {backlogId:'B2',issueNumber:2,issueUrl:'https://github.com/o/r/issues/2',title:'Ready item',status:'ready',ownerRole:'codex',supportingRoles:[],approvalClass:'approved-scope-founder-merge',release:{target:'MVP',phase:'Phase 1'},nextAction:'Build',evidenceRefs:['blueprint'],order:2},
  {backlogId:'B1',issueNumber:1,issueUrl:'https://github.com/o/r/issues/1',title:'Conflict',status:'needs-reconciliation',ownerRole:'codex',supportingRoles:['art'],approvalClass:'routine-review-founder-consequential',release:{target:'MVP',phase:'Phase 1'},nextAction:'Reconcile',evidenceRefs:['package'],order:1}
]};

test('builds an ordered read-only Workspace #1 backlog',()=>{
  const body=buildBacklog(registry);
  assert.equal(body.workspaceId,'natural-nation');assert.equal(body.workspaceNumber,1);assert.equal(body.readOnly,true);
  assert.equal(body.items[0].backlogId,'B1');assert.equal(body.summary.ready,1);assert.equal(body.summary.needsReconciliation,1);
  assert.equal(body.items[0].requiredInput,undefined);
});

const originalFetch=globalThis.fetch;
test.after(()=>{globalThis.fetch=originalFetch;});
function install(value){globalThis.fetch=async()=>new Response(JSON.stringify({type:'file',sha:'sha',content:Buffer.from(JSON.stringify(value)).toString('base64')}),{status:200});}
const env={GITHUB_TOKEN:'t',GITHUB_OWNER:'o',GITHUB_REPOSITORY:'r',GITHUB_BRANCH:'main'};
test('public backlog is cache-free and rejects writes',async()=>{
  install(registry);const response=await handleBacklog(new Request('https://gateway.test/v1/public/workspaces/natural-nation/backlog'),env,'/v1/public/workspaces/natural-nation/backlog');
  assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
  const rejected=await handleBacklog(new Request('https://gateway.test/v1/public/workspaces/natural-nation/backlog',{method:'POST'}),env,'/v1/public/workspaces/natural-nation/backlog');assert.equal(rejected.status,405);
});
test('rejects a registry outside Natural Nation Workspace #1',async()=>{
  install({...registry,workspaceId:'founder-os'});const response=await handleBacklog(new Request('https://gateway.test/v1/public/workspaces/natural-nation/backlog'),env,'/v1/public/workspaces/natural-nation/backlog');assert.equal(response.status,409);
});
