const COMMAND_CENTER_ENDPOINT = 'https://founder-os-gateway.dmoseley1024.workers.dev/v1/public/command-center';
const NATURAL_NATION_BACKLOG_ENDPOINT = 'https://founder-os-gateway.dmoseley1024.workers.dev/v1/public/workspaces/natural-nation/backlog';
const REFRESH_MS = 30000;
let commandCenterTimer = null;
let commandCenterLoading = false;

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
}
function openView(target) { return window.NNOSNavigationManager?.openView?.(target, 'founder-command-center') || false; }
function ensureMissionSurface() {
  const view = document.querySelector('[data-workspace="mission"]');
  if (!view) return null;
  let cards = view.querySelector('[data-mission-cards]');
  let queue = view.querySelector('[data-action-queue]');
  if (cards && queue) return { view, cards, queue };
  const runtime = document.createElement('section');
  runtime.className = 'glass-panel command-center-runtime';
  runtime.setAttribute('aria-label', 'Founder Command Center');
  runtime.innerHTML = '<div class="command-center-summary" data-mission-cards></div><div data-action-queue></div>';
  view.appendChild(runtime);
  return { view, cards:runtime.querySelector('[data-mission-cards]'), queue:runtime.querySelector('[data-action-queue]') };
}
function snapshotFallback() {
  return { ok:true, readOnly:true, live:false, generatedAt:null,
    summary:{workspaces:2,activeWork:0,pendingApprovals:0,blockingRisks:0,providersReady:0,providersTotal:2,verifiedEvidence:2,recordedCost:.12,currency:'USD'},
    workspaces:[
      {workspaceId:'founder-os',name:'Founder OS',status:'active',health:'Core system online',currentMilestone:'Phase 5 audit',progress:54,nextAction:'Review live operational intelligence'},
      {workspaceId:'natural-nation',name:'Natural Nation',status:'active',health:'Approved plan; product incomplete',currentMilestone:'Build Foundation',progress:52,nextAction:'Review product status before the next build package'}],
    activeWork:[],approvals:[],risks:[],providers:[{name:'OpenAI',ready:false},{name:'Google AI',ready:false}],
    repository:{status:'repository snapshot',latestCommit:'380559b',latestRef:'main',updatedAt:'2026-08-24T17:00:00.000Z'},
    evidence:{verified:2,needsReview:0,exceptions:0,recent:[]},usage:{requests:0,tokens:0,retries:0,cacheRate:0,recordedCost:.12,currency:'USD',alerts:[]} };
}
function summaryCard(label,value,detail,target) {
  return `<button class="command-center-stat" type="button" data-mission-view="${target}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></button>`;
}
function statusRow(title,detail,status,target) {
  return `<button class="command-center-row" type="button" data-mission-view="${target}"><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span><span class="status">${escapeHtml(status)}</span></button>`;
}
function backlogLabel(value){return String(value||'').replace(/-/g,' ').replace(/\b\w/g,(letter)=>letter.toUpperCase());}
function renderBacklog(data,errorMessage){
  const surface=ensureMissionSurface();if(!surface)return;
  const summaryPanel=surface.cards.closest('.glass-panel');
  if(summaryPanel){const eyebrow=summaryPanel.querySelector('.eyebrow');const title=summaryPanel.querySelector('.section-title');if(eyebrow)eyebrow.textContent='Workspace #1';if(title)title.textContent='Live Natural Nation backlog';}
  const summary=data.summary||{};
  surface.cards.className='command-center-summary backlog-summary';
  surface.cards.innerHTML=[
    summaryCard('Ready',summary.ready||0,'Approved scope ready to package','build'),
    summaryCard('In progress',summary.inProgress||0,'Work with an active owner','build'),
    summaryCard('Needs reconciliation',summary.needsReconciliation||0,'Conflicting canonical records','repo'),
    summaryCard('Founder decisions',summary.founderDecisions||0,'Protected decisions waiting','approvals')].join('');
  const items=(data.items||[]).map((item,index)=>`<article class="backlog-item backlog-status-${escapeHtml(item.status)}"><div class="backlog-index">${index+1}</div><div class="backlog-main"><div class="backlog-heading"><div><span class="eyebrow">${escapeHtml(item.backlogId)}</span><h3>${escapeHtml(item.title)}</h3></div><span class="status">${escapeHtml(backlogLabel(item.status))}</span></div><dl class="backlog-fields"><div><dt>GitHub issue</dt><dd>#${escapeHtml(item.issueNumber)}</dd></div><div><dt>Owner role</dt><dd>${escapeHtml(backlogLabel(item.ownerRole))}</dd></div><div><dt>Approval class</dt><dd>${escapeHtml(backlogLabel(item.approvalClass))}</dd></div><div><dt>Release target</dt><dd>${escapeHtml(item.release?.target)} · ${escapeHtml(item.release?.phase)}</dd></div><div class="backlog-next"><dt>Next action</dt><dd>${escapeHtml(item.nextAction)}</dd></div></dl></div><a class="btn small backlog-issue-link" href="${escapeHtml(item.issueUrl)}" target="_blank" rel="noopener noreferrer">Open issue</a></article>`).join('');
  surface.queue.innerHTML=`<section class="command-center-header backlog-header"><div><div class="eyebrow">Natural Nation</div><h2>Live Natural Nation Backlog</h2><p>Repository-backed implementation status, ownership, approval boundaries, release linkage, and next actions.</p></div><div class="command-center-live"><span>${data.live?'Live · Workspace #1 only':'Repository snapshot'}</span><button class="btn small" type="button" data-command-center-refresh>Refresh now</button></div></section>${errorMessage?`<p class="command-center-notice" role="status">Live backlog data is unavailable. ${escapeHtml(errorMessage)}</p>`:''}<div class="backlog-list">${items||'<div class="command-center-empty"><strong>No backlog items recorded</strong><span>The registry contains no current work.</span></div>'}</div>`;
}
function renderCommandCenter(data,errorMessage) {
  const surface=ensureMissionSurface(); if(!surface)return;
  const summaryPanel=surface.cards.closest('.glass-panel');
  if(summaryPanel){const eyebrow=summaryPanel.querySelector('.eyebrow');const title=summaryPanel.querySelector('.section-title');if(eyebrow)eyebrow.textContent='Live Portfolio';if(title)title.textContent='Current operational summary';}
  const summary=data.summary||{};
  const liveLabel=data.live?`Live · updated ${new Date(data.generatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'})}`:'Repository snapshot';
  surface.cards.className='command-center-summary';
  surface.cards.innerHTML=[
    summaryCard('Active work',summary.activeWork||0,'Governed tasks running now','ai'),
    summaryCard('Needs approval',summary.pendingApprovals||0,'Founder decisions waiting','approvals'),
    summaryCard('Blocking risks',summary.blockingRisks||0,'Problems requiring attention','repo'),
    summaryCard('Providers ready',`${summary.providersReady||0}/${summary.providersTotal||0}`,'Configured AI providers','ai'),
    summaryCard('Verified evidence',summary.verifiedEvidence||0,'Recorded outcomes','knowledge'),
    summaryCard('Recorded cost',`$${Number(summary.recordedCost||0).toFixed(2)}`,summary.currency||'USD','analytics')].join('');
  const attention=[
    ...(data.approvals||[]).map((item)=>({title:item.title,detail:`${item.workspaceId} · approval required`,status:'Approval',target:'approvals'})),
    ...(data.risks||[]).map((item)=>({title:item.title,detail:item.reason,status:'Blocked',target:'repo'})),
    ...((data.usage&&data.usage.alerts)||[]).map((item)=>({title:item.title,detail:item.message,status:item.severity,target:'analytics'}))];
  const attentionRows=attention.length?attention.slice(0,6).map((item)=>statusRow(item.title,item.detail,item.status,item.target)).join(''):'<div class="command-center-empty"><strong>No current exceptions</strong><span>Approvals, blockers, and usage alerts are within measured limits.</span></div>';
  const nameCounts=(data.workspaces||[]).reduce((counts,item)=>{counts[item.name]=(counts[item.name]||0)+1;return counts;},{});
  const roadmapRows=(data.workspaces||[]).map((item)=>{const label=nameCounts[item.name]>1?`${item.name} · ${item.workspaceKey||item.workspaceId}`:item.name;return statusRow(label,`${item.currentMilestone} · ${item.progress||0}% · Next: ${item.nextAction}`,item.status,item.workspaceId==='founder-os'?'mission':'build');}).join('');
  const recentRows=(data.evidence?.recent||[]).map((item)=>statusRow(item.title,`${item.workspaceId} · ${item.summary||item.eventType}`,item.status,'knowledge')).join('')||'<div class="command-center-empty"><strong>No recent evidence in this response</strong><span>Open System Records for repository-backed history.</span></div>';
  const repo=data.repository||{}; const providerReady=(data.providers||[]).filter((item)=>item.ready).length;
  surface.queue.innerHTML=`<section class="command-center-header"><div><div class="eyebrow">Founder OS</div><h2>Founder Command Center</h2><p>Current work, decisions, risk, roadmap, providers, repository evidence, and cost in one read-only overview.</p></div><div class="command-center-live"><span>${escapeHtml(liveLabel)}</span><button class="btn small" type="button" data-command-center-refresh>Refresh now</button></div></section>
    ${errorMessage?`<p class="command-center-notice" role="status">Live Gateway data is unavailable. Showing a safe repository snapshot. ${escapeHtml(errorMessage)}</p>`:''}
    <div class="command-center-grid"><section class="module-card"><div class="eyebrow">Attention</div><h3>What needs a decision</h3>${attentionRows}</section><section class="module-card"><div class="eyebrow">Roadmap</div><h3>Workspace progress</h3>${roadmapRows}</section><section class="module-card"><div class="eyebrow">Operations</div><h3>Live system status</h3>
    ${statusRow('AI providers',`${providerReady} of ${(data.providers||[]).length} ready`,providerReady?'Available':'Review','ai')}${statusRow('Repository',`${repo.latestRef||'No ref'} · ${repo.latestCommit||'No commit recorded'}`,repo.status||'Unknown','repo')}${statusRow('Usage',`${data.usage?.tokens||0} tokens · $${Number(data.usage?.recordedCost||0).toFixed(2)} recorded`,(data.usage?.alerts||[]).length?'Attention':'Measured','analytics')}${statusRow('Evidence',`${data.evidence?.verified||0} verified · ${data.evidence?.exceptions||0} exceptions`,'Recorded','knowledge')}</section><section class="module-card"><div class="eyebrow">Evidence</div><h3>Recent verified activity</h3>${recentRows}</section></div>`;
}
function missionIsVisible(){const view=document.querySelector('[data-workspace="mission"]');return Boolean(view&&!view.hidden&&document.visibilityState!=='hidden');}
function currentWorkspaceId(){return window.NNOSActiveWorkspace?.id||document.body.getAttribute('data-active-workspace')||'founder-os';}
async function refreshCommandCenter(){if(commandCenterLoading||!missionIsVisible())return;commandCenterLoading=true;try{const response=await fetch(COMMAND_CENTER_ENDPOINT,{cache:'no-store'});if(!response.ok)throw new Error(`Gateway returned ${response.status}.`);renderCommandCenter(await response.json());}catch(error){renderCommandCenter(snapshotFallback(),error.message);}finally{commandCenterLoading=false;}}
async function refreshBacklog(){if(commandCenterLoading||!missionIsVisible())return;commandCenterLoading=true;try{const response=await fetch(NATURAL_NATION_BACKLOG_ENDPOINT,{cache:'no-store'});if(!response.ok)throw new Error(`Gateway returned ${response.status}.`);renderBacklog(await response.json());}catch(error){renderBacklog({live:false,summary:{},items:[]},error.message);}finally{commandCenterLoading=false;}}
function refreshMissionData(){return currentWorkspaceId()==='natural-nation'?refreshBacklog():refreshCommandCenter();}
function scheduleRefresh(){window.clearInterval(commandCenterTimer);commandCenterTimer=window.setInterval(()=>{if(missionIsVisible())refreshMissionData();},REFRESH_MS);}
document.addEventListener('click',(event)=>{const refresh=event.target.closest('[data-command-center-refresh]');if(refresh){event.preventDefault();refreshMissionData();return;}const view=event.target.closest('[data-mission-view]');if(view){event.preventDefault();openView(view.dataset.missionView);}});
window.addEventListener('founder-os:workspace-view-changed',(event)=>{if(event.detail?.target==='mission')refreshMissionData();});
document.addEventListener('visibilitychange',()=>{if(missionIsVisible())refreshMissionData();});
document.addEventListener('DOMContentLoaded',()=>{refreshMissionData();scheduleRefresh();},{once:true});
