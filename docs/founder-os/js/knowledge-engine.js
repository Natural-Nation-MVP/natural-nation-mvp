(() => {
  'use strict';

  const repositoryKnowledge = [
    { id:'KB-INDEX-001',title:'Knowledge Base Index',category:'Core',path:'docs/knowledge/INDEX.md',summary:'Master entry point for canonical project knowledge.',related:['PROJECT_STATE','SYNC-STANDARD','AI Context'],workspaces:['founder-os','natural-nation'] },
    { id:'KB-FOUNDER-001',title:'Founder OS',category:'Founder OS',path:'docs/knowledge/founder-os/README.md',summary:'Operating layer for project state, releases, AI handoffs, and repository intelligence.',related:['Release 3','Build Studio','Mission Control'],workspaces:['founder-os'] },
    { id:'KB-FOUNDER-002',title:'Founder OS Architecture',category:'Founder OS',path:'docs/knowledge/founder-os/architecture.md',summary:'Approved runtime, workspace model, and production layout standard.',related:['ADR-001','Release 3','Knowledge Graph'],workspaces:['founder-os'] },
    { id:'KB-FOUNDER-003',title:'Repository Intelligence',category:'Founder OS',path:'docs/knowledge/founder-os/repository-intelligence.md',summary:'Repository health, structure, verification, and release intelligence.',related:['GitHub','Sync','Mission Control'],workspaces:['founder-os'] },
    { id:'KB-FOUNDER-004',title:'Mission Control',category:'Founder OS',path:'docs/knowledge/founder-os/mission-control.md',summary:'Executive dashboard for founder priorities, project health, risks, and current initiative.',related:['Founder OS','Repository Intelligence','AI Operations'],workspaces:['founder-os'] },
    { id:'KB-FOUNDER-005',title:'Founder OS Operating Model',category:'Founder OS',path:'docs/knowledge/founder-os/operating-model-v1.md',summary:'Approved operating loop connecting the Founder OS systems.',related:['Mission Control','Build Studio','AI Operations'],workspaces:['founder-os'] },
    { id:'KB-FOUNDER-006',title:'AI Operations',category:'Founder OS',path:'docs/knowledge/founder-os/ai-operations.md',summary:'AI workforce coordination, handoffs, approvals, and synchronization.',related:['Art','Codex','Gemini','GPose'],workspaces:['founder-os'] },
    { id:'KB-FOUNDER-007',title:'Single Source of Truth Standard',category:'Founder OS',path:'docs/knowledge/founder-os/source-of-truth.md',summary:'Standard for canonical ownership and reference-based records.',related:['Decision Ledger','Validation Center','Sync'],workspaces:['founder-os'] },
    { id:'KB-DECISION-002',title:'Decision Ledger',category:'Decisions',path:'docs/decisions/DECISION-LEDGER.md',summary:'Founder approval history referencing canonical records.',related:['SSOT','Founder Approval','ADR'],workspaces:['founder-os','natural-nation'] },
    { id:'KB-RELEASE-002',title:'Validation Center',category:'Releases',path:'docs/releases/VALIDATION-CENTER.md',summary:'Release validation, fix, and retest status.',related:['Release 3','Validation','SSOT'],workspaces:['founder-os','natural-nation'] },
    { id:'KB-PRODUCT-001',title:'Natural Nation Product Overview',category:'Product',path:'docs/knowledge/product/README.md',summary:'Canonical product vision, MVP areas, and approved principles.',related:['Duey','Protocols','MVP'],workspaces:['natural-nation'] },
    { id:'KB-PRODUCT-002',title:'MVP Principles',category:'Product',path:'docs/knowledge/product/mvp-principles.md',summary:'Natural Nation MVP rules, value focus, and locked principles.',related:['Guest First','Duey','Scores'],workspaces:['natural-nation'] },
    { id:'KB-PRODUCT-003',title:'Onboarding Direction',category:'Product',path:'docs/knowledge/product/onboarding.md',summary:'Approved onboarding flow and first-session breakthrough.',related:['Duey Summary','Blueprint','Day 1'],workspaces:['natural-nation'] },
    { id:'KB-PRODUCT-004',title:'Feature Registry',category:'Product',path:'docs/knowledge/product/feature-registry-v1.md',summary:'Natural Nation and Founder OS feature areas.',related:['MVP','Phase 2','Release 3'],workspaces:['founder-os','natural-nation'] },
    { id:'KB-DUEY-001',title:'Duey Mentor System',category:'Duey',path:'docs/knowledge/duey/README.md',summary:'Duey identity, role, and mentor behavior.',related:['Personality','Protocols','Product'],workspaces:['natural-nation'] },
    { id:'KB-DUEY-002',title:'Duey Personality',category:'Duey',path:'docs/knowledge/duey/personality.md',summary:'Approved tone, response priorities, and safety boundaries.',related:['Mentor','Safety','Recognition'],workspaces:['natural-nation'] },
    { id:'KB-PROTOCOL-002',title:'Protocol Library v1',category:'Protocols',path:'docs/knowledge/protocols/library-v1.md',summary:'Approved Natural Nation wellness protocol categories.',related:['Daily Foundations','Duey','Matrix'],workspaces:['natural-nation'] },
    { id:'KB-PROTOCOL-003',title:'Assignment Matrix v1',category:'Protocols',path:'docs/knowledge/protocols/assignment-matrix-v1.md',summary:'Deterministic protocol assignment and priority rules.',related:['Safety','Sleep','Recovery'],workspaces:['natural-nation'] },
    { id:'KB-DESIGN-002',title:'Design System v1',category:'Design',path:'docs/knowledge/design/system-v1.md',summary:'Natural Nation and Founder OS interface direction.',related:['Build Studio','iPad','Components'],workspaces:['founder-os','natural-nation'] },
    { id:'KB-DESIGN-003',title:'Design Assets',category:'Design',path:'docs/knowledge/design/assets.md',summary:'Approved asset areas and Duey asset rules.',related:['Duey Robot','Icons','Images'],workspaces:['natural-nation'] },
    { id:'KB-AI-002',title:'AI Context Loading',category:'AI',path:'docs/knowledge/ai/context-loading-standard.md',summary:'Required startup context for major AI work.',related:['Art','Codex','Gemini'],workspaces:['founder-os','natural-nation'] },
    { id:'KB-API-002',title:'API Catalog v1',category:'API',path:'docs/knowledge/api/catalog-v1.md',summary:'API groups, authentication context, and isolation standards.',related:['Auth','Protocols','Dashboard'],workspaces:['natural-nation'] },
    { id:'KB-QA-002',title:'QA Standard v1',category:'Testing',path:'docs/knowledge/testing/qa-standard-v1.md',summary:'Validation and definition-of-done checks.',related:['Definition of Done','Validation','Sync'],workspaces:['founder-os','natural-nation'] }
  ];

  const state = { records:[], selectedId:null, filter:'all', query:'', live:false };
  const repositoryRoot = 'https://github.com/Natural-Nation-MVP/natural-nation-mvp/blob/main/';

  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function workspaceId(){return window.NNOSKnowledgeScope?.activeWorkspaceId?.()||window.NNOSActiveWorkspace?.id||'founder-os';}
  function workspaceName(){return window.NNOSActiveWorkspace?.name||'Founder OS';}
  function belongs(item,id){const fn=window.NNOSKnowledgeScope?.recordBelongsToWorkspace;return typeof fn==='function'?fn(item,id):item.workspaces?.includes(id);}
  function fallbackRecords(){
    return repositoryKnowledge.filter((item)=>belongs(item,workspaceId())).map((item,index)=>({
      recordId:item.id,workspaceId:workspaceId(),title:item.title,summary:item.summary,category:item.category,path:item.path,
      links:item.related.map((label)=>({type:'reference',targetId:label,label})),version:1,status:'current',
      state:'current',updatedAt:null,source:'repository',changes:['Canonical repository record is synchronized.'],index
    }));
  }
  function endpoint(recordId=''){return `/v1/workspaces/${encodeURIComponent(workspaceId())}/knowledge-records${recordId?'/'+encodeURIComponent(recordId):''}`;}
  async function gateway(path,options={}){
    const protectedAction=options.method&&options.method!=='GET';
    const requestKey=window.FounderOSGateway?.requestFounderKey;
    if(protectedAction&&!requestKey)throw new Error('Protected gateway client is unavailable.');
    const authorization=protectedAction?{authorization:`Bearer ${requestKey()}`}:{ };
    const response=await fetch(`https://founder-os-gateway.dmoseley1024.workers.dev${path}`,{
      ...options,headers:{'content-type':'application/json',...authorization,...(options.headers||{})}
    });
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||payload.ok===false)throw new Error(payload.error?.message||`Gateway returned ${response.status}.`);
    return payload;
  }
  function relativeTime(value){
    if(!value)return 'Synchronized';
    const ms=Date.now()-new Date(value).getTime(); if(!Number.isFinite(ms)||ms<0)return 'Recently';
    const hours=Math.floor(ms/3600000); if(hours<1)return 'Just now'; if(hours<24)return `${hours}h ago`; return `${Math.floor(hours/24)}d ago`;
  }
  function normalizedState(record){return record.state||(record.lockedAt?'locked':record.approvalRequired?'approval-required':record.status||'draft');}
  function stateLabel(record){const s=normalizedState(record);return ({'approval-required':'Needs Your Review',draft:'AI Draft',locked:'Current · Locked',current:'Current',superseded:'History'})[s]||s;}
  function filtered(){
    const q=state.query.toLowerCase();
    return state.records.filter((r)=>{
      const s=normalizedState(r);
      const filter=state.filter==='all'||(state.filter==='review'&&s==='approval-required')||(state.filter==='drafts'&&s==='draft')||(state.filter==='locked'&&s==='locked')||(state.filter==='history'&&s==='superseded');
      return filter&&`${r.title} ${r.summary} ${r.category||''}`.toLowerCase().includes(q);
    });
  }
  function count(predicate){return state.records.filter(predicate).length;}
  function detail(record){
    if(!record)return '<div class="knowledge-empty">Select a record to see its summary and available actions.</div>';
    const s=normalizedState(record);
    const links=(record.links||[]).slice(0,5).map((link)=>`<div class="knowledge-link"><span>${escapeHtml(link.label||link.targetId)}</span><span>${escapeHtml(link.type==='reference'?'Connected':'Aligned')}</span></div>`).join('')||'<p class="muted">No connected work is recorded yet.</p>';
    const changes=(record.changes||record.history?.slice(-3).map((h)=>`Version ${h.version} preserved in history.`)||[]).map((change)=>`<li>${escapeHtml(change)}</li>`).join('')||'<li>No recent changes recorded.</li>';
    const primary=s==='approval-required'?'<button class="btn primary" data-knowledge-action="approve">Approve</button><button class="btn secondary" data-knowledge-action="request-changes">Request changes</button>':s==='draft'?'<button class="btn primary" data-knowledge-action="review-draft">Review draft</button>':`<a class="btn primary" href="${escapeHtml(record.path?'../'+record.path.replace('docs/',''):repositoryRoot)}" target="_blank" rel="noopener">Open Record</a>`;
    return `<button class="btn secondary knowledge-mobile-detail-close" type="button" data-knowledge-action="close-detail">← Back to records</button>
      <div class="knowledge-detail-header"><div class="knowledge-detail-icon" aria-hidden="true">${s==='locked'?'🔒':'●'}</div><div><h3>${escapeHtml(record.title)}</h3><div class="knowledge-state">${escapeHtml(stateLabel(record))} · Version ${escapeHtml(record.version||1)}</div></div></div>
      <div class="knowledge-detail-section"><h4>Plain-Language Summary</h4><p>${escapeHtml(record.summary||'No summary has been recorded.')}</p></div>
      <div class="knowledge-detail-section"><h4>Linked Work</h4><div class="knowledge-links">${links}</div></div>
      <div class="knowledge-detail-section"><h4>What Changed</h4><ul class="knowledge-changes">${changes}</ul></div>
      <div class="knowledge-actions">${primary}<button class="btn secondary" data-knowledge-action="export">Export</button><button class="btn secondary" data-knowledge-action="more">More</button></div>
      <details class="knowledge-technical"><summary>Technical details</summary><dl><dt>Record ID</dt><dd>${escapeHtml(record.recordId)}</dd><dt>Workspace</dt><dd>${escapeHtml(record.workspaceId)}</dd><dt>Repository path</dt><dd>${escapeHtml(record.path||'Canonical registry')}</dd><dt>Updated</dt><dd>${escapeHtml(relativeTime(record.updatedAt))}</dd></dl></details>`;
  }
  function render(){
    if(document.body.dataset.activeView!=='knowledge')return;
    const root=document.querySelector('[data-knowledge-app]'); if(!root)return;
    const matches=filtered(); if(!state.selectedId||!state.records.some((r)=>r.recordId===state.selectedId))state.selectedId=matches[0]?.recordId||state.records[0]?.recordId||null;
    const selected=state.records.find((r)=>r.recordId===state.selectedId);
    root.innerHTML=`<div class="knowledge-shell">
      <section class="glass-panel knowledge-command"><div><div class="eyebrow">Workspace Knowledge</div><h2>Knowledge Records</h2><p class="muted">Approved information and AI-prepared drafts for ${escapeHtml(workspaceName())}.</p></div><div class="knowledge-command-actions"><input class="knowledge-search" type="search" placeholder="Search records" value="${escapeHtml(state.query)}" data-knowledge-search><button class="generate" type="button" data-knowledge-action="new-draft">New Draft +</button></div></section>
      <section class="knowledge-summary"><div class="knowledge-summary-card"><div><strong>${count((r)=>['current','locked'].includes(normalizedState(r)))}</strong><span>Current</span></div></div><div class="knowledge-summary-card attention"><div><strong>${count((r)=>normalizedState(r)==='approval-required')}</strong><span>Need Review</span></div></div><div class="knowledge-summary-card synced"><div><strong>✓ Repository</strong><span>${state.live?'Connected':'Synchronized'}</span></div></div></section>
      <div class="knowledge-filters" role="tablist" aria-label="Knowledge record filters">${[['all','All'],['review','Needs Review'],['drafts','Drafts'],['locked','Locked'],['history','History']].map(([id,label])=>`<button class="knowledge-filter${state.filter===id?' active':''}" type="button" data-knowledge-filter="${id}">${label}</button>`).join('')}</div>
      <div class="knowledge-feedback" data-knowledge-feedback aria-live="polite"></div>
      <section class="knowledge-browser"><div class="knowledge-list">${matches.map((record)=>`<button class="knowledge-row${record.recordId===state.selectedId?' selected':''}" type="button" data-knowledge-record="${escapeHtml(record.recordId)}" data-state="${escapeHtml(normalizedState(record))}"><span class="knowledge-row-status">${escapeHtml(stateLabel(record))}</span><span class="knowledge-row-title">${escapeHtml(record.title)}</span><span class="knowledge-row-summary">${escapeHtml(record.summary)}</span><span class="knowledge-row-time">${escapeHtml(relativeTime(record.updatedAt))} ›</span></button>`).join('')||'<div class="knowledge-empty">No records match this view.</div>'}</div><article class="knowledge-detail" data-knowledge-detail>${detail(selected)}</article></section>
    </div>`;
  }
  async function load(){
    state.records=fallbackRecords(); state.live=false; render();
    try{
      const payload=await gateway(endpoint(),{method:'GET'});
      if(Array.isArray(payload.records)&&payload.records.length){state.records=payload.records.map((record)=>({...record,changes:(record.history||[]).slice(-3).map((item)=>`Version ${item.version} preserved in history.`)}));state.live=true;state.selectedId=state.records[0]?.recordId||null;render();}
    }catch(error){const feedback=document.querySelector('[data-knowledge-feedback]');if(feedback)feedback.textContent='Showing synchronized repository records. Live protected actions will request your Founder key when used.';}
  }
  function selected(){return state.records.find((r)=>r.recordId===state.selectedId);}
  async function act(action){
    const record=selected(); const feedback=document.querySelector('[data-knowledge-feedback]');
    if(action==='close-detail'){document.querySelector('[data-knowledge-detail]')?.classList.remove('mobile-open');return;}
    if(action==='export'){const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${record.recordId}.json`;link.click();URL.revokeObjectURL(link.href);return;}
    if(action==='more'){document.querySelector('.knowledge-technical')?.setAttribute('open','');return;}
    if(action==='request-changes'){if(feedback)feedback.textContent='Request changes will be added when an approval-required record is selected.';return;}
    if(action==='review-draft'){document.querySelector('.knowledge-technical')?.setAttribute('open','');return;}
    if(action==='new-draft'){if(feedback)feedback.textContent='AI creates drafts in the background. Founder creation controls remain intentionally secondary.';return;}
    if(action==='approve'&&record){
      if(!window.confirm(`Approve ${record.title} as the current workspace record?`))return;
      try{if(feedback)feedback.textContent='Recording Founder approval…';await gateway(endpoint(record.recordId),{method:'POST',body:JSON.stringify({action:'approve'})});window.FounderOSGateway?.clearSessionCredential?.();await load();}catch(error){if(feedback)feedback.textContent=error.message;}
    }
  }
  document.addEventListener('input',(event)=>{if(event.target.matches('[data-knowledge-search]')){state.query=event.target.value;render();}});
  document.addEventListener('click',(event)=>{
    const filter=event.target.closest('[data-knowledge-filter]');if(filter){state.filter=filter.dataset.knowledgeFilter;render();return;}
    const row=event.target.closest('[data-knowledge-record]');if(row){state.selectedId=row.dataset.knowledgeRecord;render();document.querySelector('[data-knowledge-detail]')?.classList.add('mobile-open');return;}
    const action=event.target.closest('[data-knowledge-action]');if(action){event.preventDefault();act(action.dataset.knowledgeAction);}
  });
  window.addEventListener('founder-os:workspace-view-changed',(event)=>{if(event.detail?.target==='knowledge')load();});
  document.addEventListener('DOMContentLoaded',()=>{if(document.body.dataset.activeView==='knowledge')load();},{once:true});
})();
