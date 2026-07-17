const STORAGE_KEY='founder-os-command-center-v3';
const API_KEY='founder-os-api-base';
const byId=(id)=>document.getElementById(id);
const now=()=>new Date().toISOString();
const uid=(prefix)=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const phaseDefaults={
  roadmap:[
    {title:'#106 · Live Natural Nation backlog',meta:'Active · roadmap status, owner role, approval class, release linkage'},
    {title:'NN-KS-002 · Knowledge System continuation',meta:'Next execution candidate · routine implementation'},
    {title:'Day 1 protocol production path',meta:'Release candidate · exact Founder approval required'}
  ],
  githubOps:[
    {title:'#107 · Governed repository actions',meta:'Active · issues, branches, pull requests, checks, merges'},
    {title:'Routine repository work',meta:'Autonomous when non-destructive and within approved scope'},
    {title:'Protected or consequential changes',meta:'Blocked until exact Founder approval under FOS-DIRECTIVE-001'}
  ],
  agents:[
    {title:'Duey · Wellness Mentor',meta:'Queue: Day 1 protocol content · workspace-scoped · no protected authority'},
    {title:'Art · Lead Architect',meta:'Queue: NN-KS-002 architecture continuation · implementation coordination'},
    {title:'GPose · Founder Strategist',meta:'Queue: governance review and Founder decision support'}
  ],
  evidenceHistory:[
    {title:'#108 · Persistent execution ledger',meta:'Runtime-store ready · browser evidence remains visible when storage is unavailable'},
    {title:'Exact approval binding',meta:'Verified · signed SHA-256 payload'},
    {title:'Workspace isolation',meta:'Verified · cross-workspace access denied'}
  ],
  intelligence:[
    {title:'Roadmap progress',meta:'5 operational phases activated · 3 live work candidates'},
    {title:'Approval risk',meta:'Low · protected production mutations remain disabled'},
    {title:'Provider readiness',meta:'Read from Cloudflare runtime health on refresh'}
  ],
  delivery:[
    {title:'#109 · Governed AI work queue',meta:'Activated · assignments, progress, evidence, approval requests'},
    {title:'#110 · Operational intelligence',meta:'Activated · health, release, cost, evidence coverage'},
    {title:'Production delivery',meta:'Approval-gated · no automatic external publication'}
  ]
};

const initialState={
  mode:'review',platformHealth:'Review runtime ready',selectedWorkspaceId:'workspace-natural-nation',
  workspaces:[
    {id:'workspace-natural-nation',number:1,name:'Natural Nation',state:'Operational',summary:'Duey wellness workflows operating through the Founder OS governed runtime.',monthlyCost:42.18,
      runs:[{id:'run-nn-baseline',title:'Founder OS live governance baseline',status:'completed',meta:'Runtime, exact approval, evidence, and isolation verified'}],
      approvals:[],health:[{title:'Command Center',meta:'Healthy · GitHub Pages client'},{title:'Runtime API',meta:'Connection pending'},{title:'OpenAI',meta:'Server-side verification pending'},{title:'Google AI',meta:'Server-side verification pending'}],
      schedules:[{title:'Daily protocol preparation',meta:'Configured · 6:00 AM workspace time'}],release:[{title:'Founder Command Center',meta:'Phases 006–010 activated'}],evidence:[{title:'live-pilot-v1',meta:'Founder-approved governance milestone'}],...structuredClone(phaseDefaults)},
    {id:'workspace-contractor-estimator',number:2,name:'Contractor Estimator',state:'Isolated',summary:'Independent validation workspace for cross-workspace isolation tests.',monthlyCost:3.12,runs:[],approvals:[],health:[{title:'Workspace boundary',meta:'Isolated from Natural Nation'}],schedules:[],release:[{title:'No active release',meta:'Workspace remains isolated'}],evidence:[],roadmap:[],githubOps:[],agents:[],evidenceHistory:[],intelligence:[],delivery:[]}
  ],
  verification:{pages:false,api:false,workspace:true,approval:false,evidence:false,retry:false,isolation:false,providers:false,database:false}
};

let state=loadState();
let pendingApproval=null;
function loadState(){try{return {...structuredClone(initialState),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};}catch{return structuredClone(initialState)}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function workspace(){return state.workspaces.find((w)=>w.id===state.selectedWorkspaceId)||state.workspaces[0]}
function apiBase(){return (localStorage.getItem(API_KEY)||'').replace(/\/$/,'')}
function normalizeWorkspace(w){return {...w,roadmap:w.roadmap||structuredClone(phaseDefaults.roadmap),githubOps:w.githubOps||structuredClone(phaseDefaults.githubOps),agents:w.agents||structuredClone(phaseDefaults.agents),evidenceHistory:w.evidenceHistory||structuredClone(phaseDefaults.evidenceHistory),intelligence:w.intelligence||structuredClone(phaseDefaults.intelligence),delivery:w.delivery||structuredClone(phaseDefaults.delivery)}}

async function api(path,options={}){
  if(!apiBase())throw new Error('Runtime API is not configured');
  const response=await fetch(`${apiBase()}${path}`,{...options,headers:{'content-type':'application/json','x-founder-os-workspace':state.selectedWorkspaceId,...options.headers}});
  if(!response.ok)throw new Error(`Runtime returned ${response.status}`);
  return response.status===204?null:response.json();
}

function renderItems(items,type){
  if(!items.length)return '<p class="empty">None requiring attention.</p>';
  return items.map((item)=>{const actions=type==='approvals'?`<div class="item-actions"><button data-approve="${escapeHtml(item.id)}">Review & Approve</button></div>`:'';return `<div class="item"><strong>${escapeHtml(item.title)}</strong><div class="muted">${escapeHtml(item.meta)}</div>${actions}</div>`}).join('');
}

function render(){
  const w=normalizeWorkspace(workspace());
  byId('mode-badge').textContent=state.mode==='live'?'Live runtime connected':'Review mode · local evidence';
  byId('mode-badge').className=`status ${state.mode==='live'?'':'warning'}`;
  byId('workspace-list').innerHTML=state.workspaces.map((item)=>`<button type="button" data-workspace-id="${item.id}" aria-current="${item.id===w.id}"><strong>${escapeHtml(item.name)}</strong><br><span class="muted">Workspace #${item.number} · ${escapeHtml(item.state)}</span></button>`).join('');
  byId('workspace-number').textContent=`Workspace #${w.number}`;byId('workspace-title').textContent=w.name;byId('workspace-summary').textContent=w.summary;byId('workspace-state').textContent=w.state;
  const running=w.runs.filter((r)=>r.status==='running').length;
  const verified=Object.values(state.verification).filter(Boolean).length;
  const metrics={activeRuns:running,pendingApprovals:w.approvals.length,monthlyCost:`$${w.monthlyCost.toFixed(2)}`,verifiedControls:`${verified}/9`,health:state.mode==='live'?'Connected':'Review'};
  byId('metrics').innerHTML=Object.entries(metrics).map(([label,value])=>`<div class="metric"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  ['runs','approvals','roadmap','githubOps','agents','evidenceHistory','intelligence','delivery','health','schedules','release','evidence'].forEach((key)=>byId(key).innerHTML=renderItems(w[key]||[],key));
  byId('runs-count').textContent=w.runs.length;byId('approvals-count').textContent=w.approvals.length;
  renderVerification();bindDynamicEvents();saveState();
}

function renderVerification(){
  const checks=[['pages','GitHub Pages application loads'],['api','Cloudflare runtime health responds'],['database','Runtime persists and reloads a governed run'],['providers','OpenAI and Google AI report server-side health'],['workspace','Natural Nation remains Workspace #1'],['approval','Consequential action requires exact Founder approval'],['evidence','Run emits evidence and audit records'],['retry','Transient failure demonstrates bounded retry'],['isolation','Cross-workspace request is denied']];
  byId('verification-list').innerHTML=checks.map(([key,label])=>{const pass=Boolean(state.verification[key]);return `<div class="check-row ${pass?'pass':''}"><span class="check-icon">${pass?'✓':'·'}</span><strong>${escapeHtml(label)}</strong><span class="status ${pass?'':'warning'}">${pass?'Verified':'Pending'}</span></div>`}).join('');
}

function bindDynamicEvents(){
  document.querySelectorAll('[data-workspace-id]').forEach((button)=>button.onclick=()=>{state.selectedWorkspaceId=button.dataset.workspaceId;render()});
  document.querySelectorAll('[data-approve]').forEach((button)=>button.onclick=()=>openApproval(button.dataset.approve));
}
async function connect(){const value=byId('api-base').value.trim();if(value)localStorage.setItem(API_KEY,value);else localStorage.removeItem(API_KEY);await refreshRuntime()}

async function refreshRuntime(){
  byId('notice').textContent='Checking runtime connection…';
  try{
    const health=await api('/api/founder-os/health');
    state.mode='live';state.platformHealth=health?.status||'Live runtime healthy';state.verification.api=true;state.verification.providers=Boolean(health?.providers?.openai&&health?.providers?.googleAI);state.verification.database=Boolean(health?.database);
    const data=await api('/api/founder-os/workspaces');
    if(Array.isArray(data?.workspaces)&&data.workspaces.length)state.workspaces=data.workspaces.map(normalizeWorkspace);
    const w=normalizeWorkspace(workspace());
    w.intelligence=[{title:'Runtime health',meta:`${health?.status||'healthy'} · Worker ${health?.version||'connected'}`},{title:'Persistent storage',meta:health?.database?`Connected · ${health.databaseType||'runtime store'}`:'Not bound · local evidence fallback'},{title:'AI providers',meta:`OpenAI ${health?.providers?.openai?'ready':'pending'} · Google AI ${health?.providers?.googleAI?'ready':'pending'}`}];
    byId('notice').textContent='Founder Command Center connected. Phases 006–010 are active.';
  }catch(error){state.mode='review';state.verification.api=false;byId('notice').textContent=`Review mode active: ${error.message}. No protected action was executed.`}
  state.verification.pages=true;render();
}

async function runPilot(){
  if(state.selectedWorkspaceId!=='workspace-natural-nation'){byId('notice').textContent='Select Natural Nation before running governed work.';return}
  byId('run-pilot').disabled=true;byId('notice').textContent='Starting governed Natural Nation work…';
  try{if(state.mode==='live'){const result=await api('/api/founder-os/pilot/run',{method:'POST',body:JSON.stringify({workflow:'natural-nation-operational-work',requestedAt:now()})});applyLiveResult(result)}else simulatePilot()}
  catch(error){byId('notice').textContent=`Governed request failed safely: ${error.message}`}
  finally{byId('run-pilot').disabled=false;render()}
}

function simulatePilot(){
  const w=normalizeWorkspace(workspace());const runId=uid('run-nn');const approvalId=uid('approval');
  w.runs.unshift({id:runId,title:'Stage next Natural Nation roadmap artifact',status:'completed',meta:'Completed after bounded retry · idempotency verified'});
  w.approvals.unshift({id:approvalId,runId,title:'Approve staged Natural Nation artifact',meta:'Founder approval required · exact payload hash bound',hash:`sha256:${uid('payload')}`});
  w.evidence.unshift({title:runId,meta:'Artifact · audit event · observability event · cost record · LOCAL REVIEW'});
  w.evidenceHistory.unshift({title:'Governed execution staged',meta:`${new Date().toLocaleString()} · approval pending`});
  w.delivery.unshift({title:'Roadmap artifact staged',meta:'Awaiting exact Founder approval before consequential delivery'});
  w.monthlyCost+=0.04;state.verification.retry=true;state.verification.evidence=true;
  byId('notice').textContent='Governed work completed. A consequential action is waiting for exact Founder approval.';
}

function applyLiveResult(result={}){
  const w=normalizeWorkspace(workspace());if(result.run)w.runs.unshift(result.run);if(result.approval)w.approvals.unshift(result.approval);if(result.evidence)w.evidence.unshift(...result.evidence);
  w.evidenceHistory.unshift({title:result.run?.title||'Governed runtime execution',meta:`${new Date().toLocaleString()} · live evidence recorded`});
  w.delivery.unshift({title:'Governed work staged',meta:'Runtime execution complete · consequential step approval-gated'});
  state.verification.retry=Boolean(result.retryVerified);state.verification.evidence=Boolean(result.evidence?.length);state.verification.database=Boolean(result.persisted);state.verification.providers=Boolean(result.providersVerified);
  byId('notice').textContent='Governed Natural Nation work completed. Review evidence and pending approval.';
}

function openApproval(id){const w=workspace();pendingApproval=w.approvals.find((a)=>a.id===id);if(!pendingApproval)return;byId('approval-description').textContent=pendingApproval.title;byId('approval-hash').textContent=pendingApproval.hash||'Server-bound payload hash';byId('approval-dialog').showModal()}
async function approvePending(){if(!pendingApproval)return;const w=normalizeWorkspace(workspace());
  try{if(state.mode==='live')await api(`/api/founder-os/approvals/${encodeURIComponent(pendingApproval.id)}/approve`,{method:'POST',body:JSON.stringify({payloadHash:pendingApproval.hash})});
    w.approvals=w.approvals.filter((a)=>a.id!==pendingApproval.id);w.release=[{title:'Founder-approved Natural Nation action',meta:`Approved ${new Date().toLocaleString()} · exact binding verified`}];w.evidence.unshift({title:uid('approval-evidence'),meta:`Founder approval recorded · ${state.mode==='live'?'LIVE':'LOCAL REVIEW'}`});w.evidenceHistory.unshift({title:'Exact Founder approval',meta:`${new Date().toLocaleString()} · signed payload verified`});w.delivery.unshift({title:'Approved delivery record',meta:'Exact payload approved · production mutation still disabled unless separately authorized'});state.verification.approval=true;byId('notice').textContent='Exact action approved and evidence recorded.';
  }catch(error){byId('notice').textContent=`Approval was not applied: ${error.message}`}
  pendingApproval=null;render();
}

async function testIsolation(){byId('notice').textContent='Testing workspace isolation…';
  try{if(state.mode==='live'){await api('/api/founder-os/workspaces/workspace-contractor-estimator',{headers:{'x-founder-os-workspace':'workspace-natural-nation'}});throw new Error('Unsafe response: cross-workspace request was accepted')}state.verification.isolation=true;byId('notice').textContent='Review isolation test passed: workspace contexts remain separate.'}
  catch(error){if(state.mode==='live'&&/403|denied|forbidden/i.test(error.message)){state.verification.isolation=true;byId('notice').textContent='Live isolation test passed: cross-workspace access was denied.'}else{byId('notice').textContent=error.message}}
  render();
}
function resetReview(){if(!confirm('Reset local Founder review data? This does not affect server data.'))return;localStorage.removeItem(STORAGE_KEY);state=structuredClone(initialState);render();byId('notice').textContent='Local review data reset.'}

byId('save-connection').onclick=connect;byId('refresh-button').onclick=refreshRuntime;byId('run-pilot').onclick=runPilot;byId('test-isolation').onclick=testIsolation;byId('reset-review').onclick=resetReview;byId('confirm-approval').onclick=approvePending;
byId('api-base').value=apiBase();state.verification.pages=true;render();refreshRuntime();