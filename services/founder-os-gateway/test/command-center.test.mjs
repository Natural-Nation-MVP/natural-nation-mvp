import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommandCenter, handleCommandCenter } from '../src/routes/command-center.js';

const management={workspaces:[{id:'founder-os',name:'Founder OS',status:'active',health:'Online',stage:'Phase 5',progress:60,nextAction:'Review'},{id:'natural-nation',name:'Natural Nation',status:'active',health:'Healthy',stage:'Build',progress:52,nextAction:'Build'}]};
const canonical={workspaces:[{workspaceId:'natural-nation',displayName:'Natural Nation',status:'active'},{workspaceId:'os-studio',displayName:'OS Studio',status:'foundation',health:{summary:'Awaiting package'},roadmap:['M1']} ]};
const orchestration={updatedAt:'2026-08-29T00:00:00Z',tasks:[
  {id:'T1',workspaceId:'natural-nation',packageId:'P1',title:'Running review',owner:'codex',status:'working',providerStatus:'running',startedAt:'2026-08-29T00:00:00Z'},
  {id:'T2',workspaceId:'natural-nation',packageId:'P1',title:'Founder decision',owner:'founder',status:'pending'},
  {id:'T3',workspaceId:'os-studio',packageId:'P2',title:'Blocked build',owner:'codex',status:'blocked',blockedReason:'Missing approved package'}]};
const evidenceRegistry={records:[{evidenceId:'E1',workspaceId:'natural-nation',eventType:'deployment',title:'Deployed',summary:'Checks passed',outcome:{status:'verified'},cost:{amount:.12},repository:{ref:'main',commit:'abc123'},occurredAt:'2026-08-29T00:00:00Z'}]};
const usageRegistry={records:[]};
const agentRegistry={agents:[{id:'codex',provider:'openai'}]};

test('builds a safe portfolio-wide read-only command center',()=>{
  const body=buildCommandCenter({management,canonical,orchestration,evidenceRegistry,usageRegistry,agentRegistry,readiness:{openai:true,google:false},now:new Date('2026-08-29T00:05:00Z')});
  assert.equal(body.readOnly,true); assert.equal(body.live,true); assert.equal(body.summary.workspaces,3);
  assert.equal(body.summary.activeWork,1); assert.equal(body.summary.pendingApprovals,1); assert.equal(body.summary.blockingRisks,1);
  assert.equal(body.summary.providersReady,1); assert.equal(body.summary.verifiedEvidence,1); assert.equal(body.summary.recordedCost,.12);
  assert.equal(body.repository.latestCommit,'abc123'); assert.equal(body.evidence.recent[0].commit,'abc123');
  assert.equal(body.evidence.recent[0].cost,undefined); assert.equal(body.approvals[0].requiredInput,undefined);
});

const originalFetch=globalThis.fetch;
test.after(()=>{globalThis.fetch=originalFetch;});
function installFetch(){
  const files=[management,canonical,orchestration,evidenceRegistry,usageRegistry,agentRegistry];let index=0;
  globalThis.fetch=async()=>new Response(JSON.stringify({type:'file',sha:'sha',content:Buffer.from(JSON.stringify(files[index++])).toString('base64')}),{status:200});
}
test('public endpoint is cache-free and accepts only GET',async()=>{
  installFetch();
  const env={GITHUB_TOKEN:'t',GITHUB_OWNER:'o',GITHUB_REPOSITORY:'r',GITHUB_BRANCH:'main',OPENAI_API_KEY:'configured'};
  const response=await handleCommandCenter(new Request('https://gateway.test/v1/public/command-center'),env,'/v1/public/command-center');
  const body=await response.json(); assert.equal(response.status,200); assert.equal(body.readOnly,true); assert.match(response.headers.get('cache-control'),/no-store/);
  const rejected=await handleCommandCenter(new Request('https://gateway.test/v1/public/command-center',{method:'POST'}),env,'/v1/public/command-center');
  assert.equal(rejected.status,405);
});
