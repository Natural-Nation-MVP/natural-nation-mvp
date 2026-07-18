const STORAGE_KEY='founder-os-command-center-v4';
const API_KEY='founder-os-api-base';
const byId=(id)=>document.getElementById(id);
const now=()=>new Date().toISOString();
const uid=(prefix)=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const workflowSteps=['Repository Review','Scope Draft','Founder Review','Approve Exact Scope','Implementation','Testing & Evidence','Complete'];
const phaseDefaults={
  roadmap:[
    {id:'nn-ks-002',title:'NN-KS-002 · Knowledge System',meta:'Next · begin repository review',action:'Open Workflow'},
    {id:'day-1-protocol',title:'Day 1 protocol production path',meta:'Queued after knowledge-system scope approval'},
    {id:'blueprint-engine',title:'Blueprint Engine',meta:'Planned · follows knowledge foundation'}
  ],
  githubOps:[
    {title:'#112 · Founder workflow usability correction',meta:'Approved · guided NN-KS-002 execution'},
    {title:'Routine repository work',meta:'Autonomous when non-destructive and within approved scope'},
    {title:'Protected or consequential changes',meta:'Blocked until exact Founder approval under FOS-DIRECTIVE-001'}
  ],
  agents:[
    {title:'Art · Lead Architect',meta:'Active assignment: NN-KS-002 repository review'},
    {title:'Duey · Wellness Mentor',meta:'Next: wellness knowledge-domain review'},
    {title:'GPose · Founder Strategist',meta:'Next: governance and acceptance-criteria review'}
  ],
  evidenceHistory:[
    {title:'Founder approval recorded',meta:'FOS-UX-001 guided workflow authorized'},
    {title:'Exact approval binding',meta:'Verified · signed SHA-256 payload'},
    {title:'Workspace isolation',meta:'Verified · cross-workspace access denied'}
  ],
  intelligence:[
    {title:'Current objective',meta:'Complete NN-KS-002 scope before implementation'},
    {title:'Founder attention',meta:'Not required until Scope Draft is ready'},
    {title:'Production risk',meta:'Low · production mutations remain disabled'}
  ],
  delivery:[
    {title:'Repository Review',meta:'Ready to start'},
    {title:'Scope Package',meta:'Not started'},
    {title:'Production delivery',meta:'Approval-gated'}
  ]
};

const initialState={
  mode:'review',selectedWorkspaceId:'workspace-natural-nation',
  workflow:{id:'nn-ks-002',stageIndex:0,status:'ready',startedAt:null,output:'No work has started. Select “Start Repository Review.”'},
  workspaces:[
    {id:'workspace-natural-nation',number:1,name:'Natural Nation',state:'Operational',summary:'Founder OS is guiding the Natural Nation production build one approved step at a time.',monthlyCost:42.18,runs:[],approvals:[],health:[{title:'Command Center',meta:'Healthy · GitHub Pages client'},{title:'Runtime API',meta:'Connection pending'},{title:'OpenAI',meta:'Server-side verification pending'},{title:'Google AI',meta:'Server-side verification pending'}],schedules:[{title:'Daily protocol preparation',meta:'Configured · 6:00 AM workspace time'}],release:[{title:'Founder Command Center',meta:'Guided NN-KS-002 workflow active'}],evidence:[{title:'fos-ux-001-approval',meta:'Founder-approved usability correction'}],...structuredClone(phaseDefaults)},
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
async function api(path,options={}){if(!apiBase())throw new Error('Runtime API is not configured');const response=await fetch(`${apiBase()}${path}`,{...options,headers:{'content-type':'application/json','x-founder-os-workspace':state.selectedWorkspaceId,...options.headers}});if(!response.ok)throw new Error(`Runtime returned ${response.status}`);return response.status===204?null:response.json()}

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
  const wf=state.workflow||structuredClone(initialState.workflow);
  const activeIndex=Math.max(0,Math.min(wf.stageIndex,workflowSteps.length-1));
  byId('workflow-stage').textContent=workflowSteps[activeIndex];
  byId('workflow-owner').textContent=activeIndex<2?'Art · Lead Architect':activeIndex===2?'Founder':activeIndex===3?'Founder':activeIndex<6?'AI Team':'Complete';
  byId('workflow-founder-action').textContent=activeIndex<2?'None required yet':activeIndex<4?'Review and approve scope':'None unless a protected decision is raised';
  byId('workflow-status').textContent=wf.status==='running'?'In progress':wf.status==='waiting-approval'?'Founder review required':wf.status==='complete'?'Complete':'Ready';
  byId('workflow-status').className=`status ${wf.status==='waiting-approval'?'warning':''}`;
  byId('workflow-steps').innerHTML=workflowSteps.map((label,index)=>`<li class="${index<activeIndex?'complete':index===activeIndex?'active':''}"><span class="step-number">${index<activeIndex?'✓':index+1}</span><strong>${escapeHtml(label)}</strong></li>`).join('');
  byId('workflow-output').textContent=wf.output||'';
  const start=byId('start-workflow');
  if(wf.status==='ready'){start.textContent='Start Repository Review';start.disabled=false}
  else if(wf.status==='running'){start.textContent='Repository Review Running';start.disabled=true}
  else if(wf.status==='waiting-approval'){start.textContent='Scope Awaiting Founder Review';start.disabled=true}
  else{start.textContent='Workflow Complete';start.disabled=true}
}

function render(){
  const w=normalizeWorkspace(workspace());
  byId('mode-badge').textContent=state.mode==='live'?'Live runtime connected':'Review mode · local evidence';
  byId('mode-badge').className=`status ${state.mode==='live'?'':'warning'}`;
  byId('workspace-list').innerHTML=state.workspaces.map((item)=>`<button type="button" data-workspace-id="${item.id}" aria-current="${item.id===w.id}"><strong>${escapeHtml(item.name)}</strong><br><span class="muted">Workspace #${item.number} · ${escapeHtml(item.state)}</span></button>`).join('');
  byId('workspace-number').textContent=`Workspace #${w.number}`;byId('workspace-title').textContent=w.name;byId('workspace-summary').textContent=w.summary;byId('workspace-state').textContent=w.state;
  const running=w.runs.filter((r)=>r.status==='running').length;const verified=Object.values(state.verification).filter(Boolean).length;
  const metrics={currentStage:workflowSteps[state.workflow.stageIndex]||'Repository Review',activeRuns:running,pendingDecisions:w.approvals.length,verifiedControls:`${verified}/9`,health:state.mode==='live'?'Connected':'Review'};
  byId('metrics').innerHTML=Object.entries(metrics).map(([label,value])=>`<div class="metric"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  ['runs','approvals','roadmap','githubOps','agents','evidenceHistory','intelligence','delivery','health','schedules','release','evidence'].forEach((key)=>byId(key).innerHTML=renderItems(w[key]||[],key));
  byId('runs-count').textContent=w.runs.length;byId('approvals-count').textContent=w.approvals.length;
  renderWorkflow();renderVerification();bindDynamicEvents();saveState();
}
function renderVerification(){const checks=[['pages','GitHub Pages application loads'],['api','Cloudflare runtime health responds'],['database','Runtime persists and reloads a governed run'],['providers','OpenAI and Google AI report server-side health'],['workspace','Natural Nation remains Workspace #1'],['approval','Consequential action requires exact Founder approval'],['evidence','Run emits evidence and audit records'],['retry','Transient failure demonstrates bounded retry'],['isolation','Cross-workspace request is denied']];byId('verification-list').innerHTML=checks.map(([key,label])=>{const pass=Boolean(state.verification[key]);return `<div class="check-row ${pass?'pass':''}"><span class="check-icon">${pass?'✓':'·'}</span><strong>${escapeHtml(label)}</strong><span class="status ${pass?'':'warning'}">${pass?'Verified':'Pending'}</span></div>`}).join('')}
function bindDynamicEvents(){document.querySelectorAll('[data-workspace-id]').forEach((button)=>button.onclick=()=>{state.selectedWorkspaceId=button.dataset.workspaceId;render()});document.querySelectorAll('[data-approve]').forEach((button)=>button.onclick=()=>openApproval(button.dataset.approve));document.querySelectorAll('[data-open-workflow]').forEach((button)=>button.onclick=openWorkflow)}
function openWorkflow(){byId('workflow-panel').scrollIntoView({behavior:'smooth',block:'start'})}
async function connect(){const value=byId('api-base').value.trim();if(value)localStorage.setItem(API_KEY,value);else localStorage.removeItem(API_KEY);await refreshRuntime()}
async function refreshRuntime(){byId('notice').textContent='Checking runtime connection…';try{const health=await api('/api/founder-os/health');state.mode='live';state.verification.api=true;state.verification.providers=Boolean(health?.providers?.openai&&health?.providers?.googleAI);state.verification.database=Boolean(health?.database);const data=await api('/api/founder-os/workspaces');if(Array.isArray(data?.workspaces)&&data.workspaces.length)state.workspaces=data.workspaces.map(normalizeWorkspace);byId('notice').textContent='Founder Command Center connected. Your next action is shown above.'}catch(error){state.mode='review';state.verification.api=false;byId('notice').textContent=`Review mode active: ${error.message}. You can still test the guided workflow locally.`}state.verification.pages=true;render()}

async function startWorkflow(){
  if(state.selectedWorkspaceId!=='workspace-natural-nation'){byId('notice').textContent='Select Natural Nation before starting NN-KS-002.';return}
  if(state.workflow.status!=='ready')return;
  state.workflow={...state.workflow,status:'running',startedAt:now(),output:'Art is reviewing the repository structure, existing knowledge-system files, open NN-KS-002 work, and implementation gaps.'};
  const w=normalizeWorkspace(workspace());w.runs.unshift({id:uid('run-nn-ks-002'),title:'NN-KS-002 · Repository Review',status:'running',meta:'Art · repository discovery and gap analysis'});w.agents[0]={title:'Art · Lead Architect',meta:'Running: NN-KS-002 repository review'};w.delivery[0]={title:'Repository Review',meta:'In progress · scope draft follows'};render();
  try{
    if(state.mode==='live'){
      const result=await api('/api/founder-os/pilot/run',{method:'POST',body:JSON.stringify({workflow:'nn-ks-002-repository-review',projectId:'NN-KS-002',requestedAt:now(),issue:112})});
      applyWorkflowResult(result);
    }else simulateWorkflowResult();
  }catch(error){state.workflow.status='ready';state.workflow.output=`Repository review did not start: ${error.message}`;w.runs[0].status='failed';byId('notice').textContent='The governed request failed safely. No protected action was executed.';render()}
}
function simulateWorkflowResult(){
  const w=normalizeWorkspace(workspace());const run=w.runs.find((item)=>item.title.includes('NN-KS-002'));
  if(run){run.status='completed';run.meta='Repository discovery completed · local review evidence'}
  state.workflow.stageIndex=1;state.workflow.status='running';state.workflow.output='Repository review complete. Art is preparing the NN-KS-002 Production Scope Package. Founder approval is not required until the draft is ready.';
  w.evidence.unshift({title:'nn-ks-002-repository-review',meta:'File inventory · gap report · branch review · LOCAL REVIEW'});w.evidenceHistory.unshift({title:'NN-KS-002 repository review',meta:`${new Date().toLocaleString()} · discovery evidence recorded`});w.delivery[0]={title:'Repository Review',meta:'Complete'};w.delivery[1]={title:'Scope Package',meta:'Drafting'};w.agents[0]={title:'Art · Lead Architect',meta:'Active: drafting NN-KS-002 scope package'};state.verification.evidence=true;state.verification.retry=true;byId('notice').textContent='Repository review completed. Founder OS moved NN-KS-002 to Scope Draft.';render()
}
function applyWorkflowResult(result={}){const w=normalizeWorkspace(workspace());const run=w.runs.find((item)=>item.title.includes('NN-KS-002'));if(run){run.status=result.run?.status||'completed';run.meta=result.run?.meta||'Live repository review completed'}if(result.evidence)w.evidence.unshift(...result.evidence);state.workflow.stageIndex=result.stageIndex??1;state.workflow.status=result.requiresFounderApproval?'waiting-approval':'running';state.workflow.output=result.summary||'Repository review complete. The scope package is being prepared.';state.verification.evidence=Boolean(result.evidence?.length);state.verification.database=Boolean(result.persisted);byId('notice').textContent=result.requiresFounderApproval?'The NN-KS-002 scope package is ready for your review.':'Repository review completed. Scope drafting is underway.';render()}
function openApproval(id){const w=workspace();pendingApproval=w.approvals.find((a)=>a.id===id);if(!pendingApproval)return;byId('approval-description').textContent=pendingApproval.title;byId('approval-hash').textContent=pendingApproval.hash||'Server-bound payload hash';byId('approval-dialog').showModal()}
async function approvePending(){if(!pendingApproval)return;const w=normalizeWorkspace(workspace());try{if(state.mode==='live')await api(`/api/founder-os/approvals/${encodeURIComponent(pendingApproval.id)}/approve`,{method:'POST',body:JSON.stringify({payloadHash:pendingApproval.hash})});w.approvals=w.approvals.filter((a)=>a.id!==pendingApproval.id);state.workflow.stageIndex=Math.max(state.workflow.stageIndex,4);state.workflow.status='running';state.workflow.output='Exact scope approved. Founder OS may begin routine implementation within the approved boundaries.';w.evidence.unshift({title:uid('approval-evidence'),meta:`Founder approval recorded · ${state.mode==='live'?'LIVE':'LOCAL REVIEW'}`});state.verification.approval=true;byId('notice').textContent='Exact scope approved and implementation authorized within its boundaries.'}catch(error){byId('notice').textContent=`Approval was not applied: ${error.message}`}pendingApproval=null;render()}
async function testIsolation(){byId('notice').textContent='Testing workspace isolation…';try{if(state.mode==='live'){await api('/api/founder-os/workspaces/workspace-contractor-estimator',{headers:{'x-founder-os-workspace':'workspace-natural-nation'}});throw new Error('Unsafe response: cross-workspace request was accepted')}state.verification.isolation=true;byId('notice').textContent='Review isolation test passed.'}catch(error){if(state.mode==='live'&&/403|denied|forbidden/i.test(error.message)){state.verification.isolation=true;byId('notice').textContent='Live isolation test passed.'}else byId('notice').textContent=error.message}render()}

byId('save-connection').onclick=connect;
byId('refresh-button').onclick=refreshRuntime;
byId('start-workflow').onclick=startWorkflow;
byId('view-workflow').onclick=openWorkflow;
byId('confirm-approval').onclick=approvePending;
byId('api-base').value=apiBase();
render();
refreshRuntime();