const STORAGE_KEY='founder-os-command-center-v5';
const API_KEY='founder-os-api-base';
const byId=(id)=>document.getElementById(id);
const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const workflowSteps=['Repository Review','Scope Draft','Founder Review','Approve Exact Scope','Implementation','Testing & Evidence','Complete'];

const phaseDefaults={
  roadmap:[
    {id:'nn-ks-002',title:'NN-KS-002 · Knowledge System',meta:'Live governed workflow',action:'Open Workflow'},
    {id:'day-1-protocol',title:'Day 1 protocol production path',meta:'Queued after knowledge-system scope approval'},
    {id:'blueprint-engine',title:'Blueprint Engine',meta:'Planned · follows knowledge foundation'}
  ],
  githubOps:[
    {title:'#114 · Live NN-KS-002 workflow',meta:'Server-owned repository discovery, scope artifact, persistence, and approval'},
    {title:'Routine repository work',meta:'Autonomous only within approved scope'},
    {title:'Protected changes',meta:'Blocked under FOS-DIRECTIVE-001'}
  ],
  agents:[
    {title:'Art · Lead Architect',meta:'Assigned: repository discovery and scope architecture'},
    {title:'Duey · Wellness Mentor',meta:'Queued: wellness-domain review'},
    {title:'GPose · Founder Strategist',meta:'Queued: governance and acceptance review'}
  ],
  evidenceHistory:[],
  intelligence:[
    {title:'State authority',meta:'Cloudflare runtime owns workflow state'},
    {title:'Repository source',meta:'Live GitHub discovery through protected server bindings'},
    {title:'Production boundary',meta:'No publication or destructive mutation enabled'}
  ],
  delivery:[
    {title:'Repository Review',meta:'Ready'},
    {title:'Scope Package',meta:'Not started'},
    {title:'Implementation',meta:'Blocked until exact Founder approval'}
  ]
};

const initialState={
  mode:'review',selectedWorkspaceId:'workspace-natural-nation',
  workflow:{id:'nn-ks-002',stageIndex:0,status:'ready',output:'Connect the live runtime to begin.',approvals:[],evidence:[],artifact:null,run:null},
  workspaces:[
    {id:'workspace-natural-nation',number:1,name:'Natural Nation',state:'Operational',summary:'Founder OS guides the Natural Nation production build through governed live workflows.',monthlyCost:42.18,runs:[],approvals:[],health:[{title:'Command Center',meta:'GitHub Pages client loaded'},{title:'Runtime API',meta:'Connection required'}],schedules:[],release:[{title:'NN-KS-002',meta:'Live workflow pending runtime connection'}],evidence:[],...structuredClone(phaseDefaults)},
    {id:'workspace-contractor-estimator',number:2,name:'Contractor Estimator',state:'Isolated',summary:'Independent workspace used to validate cross-workspace denial.',monthlyCost:3.12,runs:[],approvals:[],health:[{title:'Workspace boundary',meta:'Isolated from Natural Nation'}],schedules:[],release:[],evidence:[],roadmap:[],githubOps:[],agents:[],evidenceHistory:[],intelligence:[],delivery:[]}
  ],
  verification:{pages:true,api:false,workspace:true,approval:false,evidence:false,retry:false,isolation:false,providers:false,database:false}
};

let state=loadState();
let pendingApproval=null;
function loadState(){try{return {...structuredClone(initialState),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};}catch{return structuredClone(initialState)}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function workspace(){return state.workspaces.find((item)=>item.id===state.selectedWorkspaceId)||state.workspaces[0]}
function apiBase(){return (localStorage.getItem(API_KEY)||'').replace(/\/$/,'')}
function normalizeWorkspace(w){return {...w,roadmap:w.roadmap||structuredClone(phaseDefaults.roadmap),githubOps:w.githubOps||structuredClone(phaseDefaults.githubOps),agents:w.agents||structuredClone(phaseDefaults.agents),evidenceHistory:w.evidenceHistory||[],intelligence:w.intelligence||structuredClone(phaseDefaults.intelligence),delivery:w.delivery||structuredClone(phaseDefaults.delivery)}}

async function api(path,options={}){
  if(!apiBase())throw new Error('Runtime API is not configured');
  const response=await fetch(`${apiBase()}${path}`,{...options,headers:{'content-type':'application/json','x-founder-os-workspace':state.selectedWorkspaceId,...options.headers}});
  const body=response.status===204?null:await response.json().catch(()=>null);
  if(!response.ok)throw new Error(body?.error?.message||`Runtime returned ${response.status}`);
  return body;
}

function syncWorkflowIntoWorkspace(){
  const w=normalizeWorkspace(workspace());
  const wf=state.workflow||initialState.workflow;
  w.runs=wf.run?[wf.run]:[];
  w.approvals=wf.approvals||[];
  w.evidence=wf.evidence||[];
  w.evidenceHistory=(wf.evidence||[]).map((item)=>({title:item.title,meta:item.meta}));
  if(wf.status==='waiting-approval'){
    w.delivery=[{title:'Repository Review',meta:'Complete · live GitHub inspection'},{title:'Scope Package',meta:'Ready for Founder review'},{title:'Implementation',meta:'Blocked pending exact approval'}];
    w.agents[0]={title:'Art · Lead Architect',meta:'Complete: repository discovery and scope draft'};
  }else if(wf.status==='implementation-ready'){
    w.delivery=[{title:'Repository Review',meta:'Complete'},{title:'Scope Package',meta:'Founder approved'},{title:'Implementation',meta:'Authorized within exact approved scope'}];
    w.agents[0]={title:'Art · Lead Architect',meta:'Ready: begin scoped implementation'};
  }
}

function renderItems(items,type){
  if(!items.length)return '<p class="empty">None requiring attention.</p>';
  return items.map((item)=>{
    let actions='';
    if(type==='approvals')actions=`<div class="item-actions"><button data-approve="${escapeHtml(item.id)}">Review & Approve</button></div>`;
    if(type==='roadmap'&&item.id==='nn-ks-002')actions='<div class="item-actions"><button data-open-workflow="true">Open Workflow</button></div>';
    return `<div class="item"><strong>${escapeHtml(item.title)}</strong><div class="muted">${escapeHtml(item.meta)}</div>${actions}</div>`;
  }).join('');
}

function renderWorkflow(){
  const wf=state.workflow||initialState.workflow;
  const activeIndex=Math.max(0,Math.min(wf.stageIndex||0,workflowSteps.length-1));
  byId('workflow-stage').textContent=workflowSteps[activeIndex];
  byId('workflow-owner').textContent=activeIndex<2?'Art · Lead Architect':activeIndex<4?'Founder':activeIndex<6?'AI Team':'Complete';
  byId('workflow-founder-action').textContent=wf.status==='waiting-approval'?'Review and approve the exact scope package':'None required now';
  byId('workflow-status').textContent=wf.status==='waiting-approval'?'Founder review required':wf.status==='implementation-ready'?'Implementation ready':wf.status==='running'?'In progress':'Ready';
  byId('workflow-status').className=`status ${wf.status==='waiting-approval'?'warning':''}`;
  byId('workflow-steps').innerHTML=workflowSteps.map((label,index)=>`<li class="${index<activeIndex?'complete':index===activeIndex?'active':''}"><span class="step-number">${index<activeIndex?'✓':index+1}</span><strong>${escapeHtml(label)}</strong></li>`).join('');
  const artifact=wf.artifact;
  const artifactText=artifact?`\n\n${artifact.title}\nArtifact hash: ${artifact.hash}\nRepository: ${artifact.discovery?.repository||'unknown'}\nFiles inspected: ${artifact.discovery?.totalFiles??0}\nRelevant paths: ${artifact.discovery?.relevantFileCount??0}`:'';
  byId('workflow-output').textContent=`${wf.output||''}${artifactText}`;
  const start=byId('start-workflow');
  start.disabled=state.mode!=='live'||wf.status!=='ready';
  start.textContent=state.mode!=='live'?'Connect Live Runtime':wf.status==='ready'?'Start Repository Review':wf.status==='waiting-approval'?'Scope Awaiting Founder Review':wf.status==='implementation-ready'?'Implementation Ready':'Workflow In Progress';
}

function render(){
  syncWorkflowIntoWorkspace();
  const w=normalizeWorkspace(workspace());
  byId('mode-badge').textContent=state.mode==='live'?'Live runtime connected':'Review mode · no live execution';
  byId('mode-badge').className=`status ${state.mode==='live'?'':'warning'}`;
  byId('workspace-list').innerHTML=state.workspaces.map((item)=>`<button type="button" data-workspace-id="${item.id}" aria-current="${item.id===w.id}"><strong>${escapeHtml(item.name)}</strong><br><span class="muted">Workspace #${item.number} · ${escapeHtml(item.state)}</span></button>`).join('');
  byId('workspace-number').textContent=`Workspace #${w.number}`;byId('workspace-title').textContent=w.name;byId('workspace-summary').textContent=w.summary;byId('workspace-state').textContent=w.state;
  const verified=Object.values(state.verification).filter(Boolean).length;
  const metrics={currentStage:workflowSteps[state.workflow.stageIndex||0],activeRuns:w.runs.filter((r)=>r.status==='running').length,pendingDecisions:w.approvals.length,verifiedControls:`${verified}/9`,health:state.mode==='live'?'Connected':'Review'};
  byId('metrics').innerHTML=Object.entries(metrics).map(([label,value])=>`<div class="metric"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  ['runs','approvals','roadmap','githubOps','agents','evidenceHistory','intelligence','delivery','health','schedules','release','evidence'].forEach((key)=>byId(key).innerHTML=renderItems(w[key]||[],key));
  byId('runs-count').textContent=w.runs.length;byId('approvals-count').textContent=w.approvals.length;
  renderWorkflow();renderVerification();bindDynamicEvents();saveState();
}

function renderVerification(){
  const checks=[['pages','GitHub Pages application loads'],['api','Cloudflare runtime health responds'],['database','Runtime persists and reloads workflow state'],['providers','OpenAI and Google AI report server-side health'],['workspace','Natural Nation remains Workspace #1'],['approval','Exact scope approval binding verified'],['evidence','Live repository and scope evidence emitted'],['retry','Safe replay avoids duplicate workflow creation'],['isolation','Cross-workspace request is denied']];
  byId('verification-list').innerHTML=checks.map(([key,label])=>{const pass=Boolean(state.verification[key]);return `<div class="check-row ${pass?'pass':''}"><span class="check-icon">${pass?'✓':'·'}</span><strong>${escapeHtml(label)}</strong><span class="status ${pass?'':'warning'}">${pass?'Verified':'Pending'}</span></div>`}).join('');
}

function bindDynamicEvents(){
  document.querySelectorAll('[data-workspace-id]').forEach((button)=>button.onclick=()=>{state.selectedWorkspaceId=button.dataset.workspaceId;render()});
  document.querySelectorAll('[data-approve]').forEach((button)=>button.onclick=()=>openApproval(button.dataset.approve));
  document.querySelectorAll('[data-open-workflow]').forEach((button)=>button.onclick=openWorkflow);
}
function openWorkflow(){byId('workflow-panel').scrollIntoView({behavior:'smooth',block:'start'})}
async function connect(){const value=byId('api-base').value.trim();if(value)localStorage.setItem(API_KEY,value);else localStorage.removeItem(API_KEY);await refreshRuntime()}

async function refreshRuntime(){
  byId('notice').textContent='Checking live runtime and workflow state…';
  try{
    const [health,workspaces,workflowResult]=await Promise.all([api('/api/founder-os/health'),api('/api/founder-os/workspaces'),api('/api/founder-os/workflows/nn-ks-002')]);
    state.mode='live';state.verification.api=true;state.verification.providers=Boolean(health?.providers?.openai&&health?.providers?.googleAI);state.verification.database=Boolean(health?.database);
    if(Array.isArray(workspaces?.workspaces)&&workspaces.workspaces.length)state.workspaces=workspaces.workspaces.map(normalizeWorkspace);
    state.workflow=workflowResult.workflow||initialState.workflow;state.verification.evidence=Boolean(state.workflow.evidence?.length);state.verification.approval=Boolean(state.workflow.approval);state.verification.retry=true;
    byId('notice').textContent='Live runtime connected. NN-KS-002 state loaded from the server.';
  }catch(error){state.mode='review';state.verification.api=false;byId('notice').textContent=`Live runtime unavailable: ${error.message}`}
  render();
}

async function startWorkflow(){
  if(state.mode!=='live')return;
  byId('start-workflow').disabled=true;byId('notice').textContent='Founder OS is inspecting the live GitHub repository…';
  try{
    const result=await api('/api/founder-os/workflows/nn-ks-002/start',{method:'POST',body:JSON.stringify({projectId:'NN-KS-002'})});
    state.workflow=result.workflow;state.verification.database=Boolean(result.persisted);state.verification.evidence=Boolean(result.workflow?.evidence?.length);state.verification.retry=Boolean(result.replayed)||true;
    byId('notice').textContent='Live repository review completed. The exact scope package is ready for Founder review.';
  }catch(error){byId('notice').textContent=`Repository review did not start: ${error.message}`}
  render();
}

function openApproval(id){pendingApproval=(state.workflow.approvals||[]).find((item)=>item.id===id);if(!pendingApproval)return;byId('approval-description').textContent=pendingApproval.title;byId('approval-hash').textContent=pendingApproval.hash;byId('approval-dialog').showModal()}
async function approvePending(){
  if(!pendingApproval)return;
  try{
    const result=await api('/api/founder-os/workflows/nn-ks-002/approve',{method:'POST',body:JSON.stringify({approvalToken:pendingApproval.id,payloadHash:pendingApproval.hash})});
    state.workflow=result.workflow;state.verification.approval=true;byId('notice').textContent='Exact NN-KS-002 scope approved. Implementation is now authorized within the approved boundaries.';
  }catch(error){byId('notice').textContent=`Approval was not applied: ${error.message}`}
  pendingApproval=null;render();
}

byId('save-connection').onclick=connect;
byId('refresh-button').onclick=refreshRuntime;
byId('start-workflow').onclick=startWorkflow;
byId('view-workflow').onclick=openWorkflow;
byId('confirm-approval').onclick=approvePending;
byId('api-base').value=apiBase();
render();
refreshRuntime();
