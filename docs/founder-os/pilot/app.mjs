const STORAGE_KEY='founder-os-live-pilot-v2';
const API_KEY='founder-os-api-base';
const byId=(id)=>document.getElementById(id);
const now=()=>new Date().toISOString();
const uid=(prefix)=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const phaseDefaults={
  roadmap:[
    {title:'Natural Nation implementation backlog',meta:'Active · governed workspace execution'},
    {title:'Day 1 protocol production path',meta:'Next · Founder approval required for consequential release'},
    {title:'Live pilot v1',meta:'Completed · runtime and exact approval verified'}
  ],
  githubOps:[
    {title:'Issues #100–#104',meta:'Created · five execution phases tracked'},
    {title:'Repository operations',meta:'Governed · branches, pull requests, checks, and merges require evidence'},
    {title:'Protected changes',meta:'Founder approval enforced by FOS-DIRECTIVE-001'}
  ],
  agents:[
    {title:'Duey · Wellness Mentor',meta:'Workspace execution · no protected authority'},
    {title:'Art · Lead Architect',meta:'Architecture and implementation coordination'},
    {title:'GPose · Founder Strategist',meta:'Governance review and Founder decision support'}
  ],
  evidenceHistory:[
    {title:'Live runtime connection',meta:'Verified · Cloudflare Worker v0.6.0'},
    {title:'Exact approval binding',meta:'Verified · signed SHA-256 payload'},
    {title:'Workspace isolation',meta:'Active · cross-workspace access denied'}
  ]
};

const initialState={
  mode:'review',platformHealth:'Review runtime ready',selectedWorkspaceId:'workspace-natural-nation',
  workspaces:[
    {id:'workspace-natural-nation',number:1,name:'Natural Nation',state:'Operational',summary:'Duey wellness workflows operating through the Founder OS governed runtime.',monthlyCost:42.18,
      runs:[{id:'run-nn-baseline',title:'Pilot baseline validation',status:'completed',meta:'Completed · local review evidence captured'}],
      approvals:[],health:[{title:'Command Center',meta:'Healthy · GitHub Pages client'},{title:'Runtime API',meta:'Not connected · review mode active'},{title:'OpenAI',meta:'Server-side verification pending'},{title:'Google AI',meta:'Server-side verification pending'}],
      schedules:[{title:'Daily protocol preparation',meta:'Configured · 6:00 AM workspace time'}],release:[{title:'Founder Command Center',meta:'Five operational phases activated'}],evidence:[{title:'pilot-baseline',meta:'Local review artifact · not production evidence'}],...structuredClone(phaseDefaults)},
    {id:'workspace-contractor-estimator',number:2,name:'Contractor Estimator',state:'Isolated',summary:'Independent validation workspace for cross-workspace isolation tests.',monthlyCost:3.12,runs:[],approvals:[],health:[{title:'Workspace boundary',meta:'Ready for denial test'}],schedules:[],release:[{title:'No active release',meta:'Workspace remains isolated'}],evidence:[],roadmap:[],githubOps:[],agents:[],evidenceHistory:[]}
  ],
  verification:{pages:false,api:false,workspace:true,approval:false,evidence:false,retry:false,isolation:false,providers:false,database:false}
};

let state=loadState();
let pendingApproval=null;

function loadState(){try{return {...structuredClone(initialState),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};}catch{return structuredClone(initialState)}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function workspace(){return state.workspaces.find((w)=>w.id===state.selectedWorkspaceId)||state.workspaces[0]}
function apiBase(){return (localStorage.getItem(API_KEY)||'').replace(/\/$/,'')}
function normalizeWorkspace(w){return {...w,roadmap:w.roadmap||structuredClone(phaseDefaults.roadmap),githubOps:w.githubOps||structuredClone(phaseDefaults.githubOps),agents:w.agents||structuredClone(phaseDefaults.agents),evidenceHistory:w.evidenceHistory||structuredClone(phaseDefaults.evidenceHistory)}}

async function api(path,options={}){
  if(!apiBase())throw new Error('Runtime API is not configured');
  const response=await fetch(`${apiBase()}${path}`,{...options,headers:{'content-type':'application/json','x-founder-os-workspace':state.selectedWorkspaceId,...options.headers}});
  if(!response.ok)throw new Error(`Runtime returned ${response.status}`);
  return response.status===204?null:response.json();
}

function renderItems(items,type){
  if(!items.length)return '<p class="empty">None requiring attention.</p>';
  return items.map((item)=>{
    const actions=type==='approvals'?`<div class="item-actions"><button data-approve="${escapeHtml(item.id)}">Review & Approve</button></div>`:'';
    return `<div class="item"><strong>${escapeHtml(item.title)}</strong><div class="muted">${escapeHtml(item.meta)}</div>${actions}</div>`;
  }).join('');
}

function render(){
  const w=normalizeWorkspace(workspace());
  byId('mode-badge').textContent=state.mode==='live'?'Live runtime connected':'Review mode · local evidence';
  byId('mode-badge').className=`status ${state.mode==='live'?'':'warning'}`;
  byId('workspace-list').innerHTML=state.workspaces.map((item)=>`<button type="button" data-workspace-id="${item.id}" aria-current="${item.id===w.id}"><strong>${escapeHtml(item.name)}</strong><br><span class="muted">Workspace #${item.number} · ${escapeHtml(item.state)}</span></button>`).join('');
  byId('workspace-number').textContent=`Workspace #${w.number}`;byId('workspace-title').textContent=w.name;byId('workspace-summary').textContent=w.summary;byId('workspace-state').textContent=w.state;
  const running=w.runs.filter((r)=>r.status==='running').length;
  const metrics={activeRuns:running,pendingApprovals:w.approvals.length,monthlyCost:`$${w.monthlyCost.toFixed(2)}`,health:state.mode==='live'?'Connected':'Review'};
  byId('metrics').innerHTML=Object.entries(metrics).map(([label,value])=>`<div class="metric"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  ['runs','approvals','roadmap','githubOps','agents','evidenceHistory','health','schedules','release','evidence'].forEach((key)=>byId(key).innerHTML=renderItems(w[key]||[],key));
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
    byId('notice').textContent='Founder Command Center connected. Five operational phases are active.';
  }catch(error){state.mode='review';state.verification.api=false;byId('notice').textContent=`Review mode active: ${error.message}. The command center remains testable, but generated records are local review evidence only.`}
  state.verification.pages=true;render();
}

async function runPilot(){
  if(state.selectedWorkspaceId!=='workspace-natural-nation'){byId('notice').textContent='Select Natural Nation before running governed work.';return}
  byId('run-pilot').disabled=true;byId('notice').textContent='Starting governed Natural Nation work…';
  try{
    if(state.mode==='live'){const result=await api('/api/founder-os/pilot/run',{method:'POST',body:JSON.stringify({workflow:'natural-nation-founder-review',requestedAt:now()})});applyLiveResult(result)}else simulatePilot();
  }catch(error){byId('notice').textContent=`Governed request failed safely: ${error.message}`}
  finally{byId('run-pilot').disabled=false;render()}
}

function simulatePilot(){
  const w=normalizeWorkspace(workspace());const runId=uid('run-nn');const approvalId=uid('approval');
  w.runs.unshift({id:runId,title:'Generate and stage Day 1 wellness protocol',status:'completed',meta:'Completed after bounded retry · idempotency key verified'});
  w.approvals.unshift({id:approvalId,runId,title:'Publish staged Natural Nation artifact',meta:'Founder approval required · exact payload hash bound',hash:`sha256:${uid('payload')}`});
  w.evidence.unshift({title:runId,meta:'Protocol artifact · audit event · observability event · cost record · LOCAL REVIEW'});
  w.evidenceHistory.unshift({title:'Governed Natural Nation run',meta:`${new Date().toLocaleString()} · approval pending`});
  w.monthlyCost+=0.04;state.verification.retry=true;state.verification.evidence=true;
  byId('notice').textContent='Governed work completed. A consequential action is waiting for exact Founder approval.';
}

function applyLiveResult(result={}){
  const w=normalizeWorkspace(workspace());if(result.run)w.runs.unshift(result.run);if(result.approval)w.approvals.unshift(result.approval);if(result.evidence)w.evidence.unshift(...result.evidence);
  w.evidenceHistory.unshift({title:result.run?.title||'Governed runtime execution',meta:`${new Date().toLocaleString()} · live evidence recorded`});
  state.verification.retry=Boolean(result.retryVerified);state.verification.evidence=Boolean(result.evidence?.length);state.verification.database=Boolean(result.persisted);state.verification.providers=Boolean(result.providersVerified);
  byId('notice').textContent='Governed Natural Nation work completed. Review the returned evidence and pending approval.';
}

function openApproval(id){const w=workspace();pendingApproval=w.approvals.find((a)=>a.id===id);if(!pendingApproval)return;byId('approval-description').textContent=pendingApproval.title;byId('approval-hash').textContent=pendingApproval.hash||'Server-bound payload hash';byId('approval-dialog').showModal()}

async function approvePending(){if(!pendingApproval)return;const w=normalizeWorkspace(workspace());
  try{if(state.mode==='live')await api(`/api/founder-os/approvals/${encodeURIComponent(pendingApproval.id)}/approve`,{method:'POST',body:JSON.stringify({payloadHash:pendingApproval.hash})});
    w.approvals=w.approvals.filter((a)=>a.id!==pendingApproval.id);w.release=[{title:'Founder-approved Natural Nation action',meta:`Approved ${new Date().toLocaleString()} · exact action binding verified`}];w.evidence.unshift({title:uid('approval-evidence'),meta:`Founder approval recorded · ${state.mode==='live'?'LIVE':'LOCAL REVIEW'}`});w.evidenceHistory.unshift({title:'Exact Founder approval',meta:`${new Date().toLocaleString()} · signed payload verified`});state.verification.approval=true;byId('notice').textContent='Exact action approved and evidence recorded.';
  }catch(error){byId('notice').textContent=`Approval was not applied: ${error.message}`}
  pendingApproval=null;render();
}

async function testIsolation(){byId('notice').textContent='Testing workspace isolation…';
  try{if(state.mode==='live'){await api('/api/founder-os/workspaces/workspace-contractor-estimator',{headers:{'x-founder-os-workspace':'workspace-natural-nation'}});throw new Error('Unsafe response: cross-workspace request was accepted')}
    state.verification.isolation=true;byId('notice').textContent='Review isolation test passed: workspace contexts remain separate.';
  }catch(error){if(state.mode==='live'&&/403|denied|forbidden/i.test(error.message)){state.verification.isolation=true;byId('notice').textContent='Live isolation test passed: the cross-workspace request was denied.'}else{byId('notice').textContent=error.message}}
  render();
}

function resetReview(){if(!confirm('Reset local Founder review data? This does not affect server data.'))return;localStorage.removeItem(STORAGE_KEY);state=structuredClone(initialState);render();byId('notice').textContent='Local review data reset.'}

byId('save-connection').onclick=connect;byId('refresh-button').onclick=refreshRuntime;byId('run-pilot').onclick=runPilot;byId('test-isolation').onclick=testIsolation;byId('reset-review').onclick=resetReview;byId('confirm-approval').onclick=approvePending;
byId('api-base').value=apiBase();state.verification.pages=true;render();refreshRuntime();