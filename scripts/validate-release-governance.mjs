import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync('founder-os/releases/release-governance.json','utf8'));
const e=[];
if(r.package!=='FOS-FOUNDATION-017')e.push('wrong package');
if(r.constitutionalDirective!=='FOS-DIRECTIVE-001')e.push('missing directive');
for(const k of ['immutableCandidateHash','oneWorkspacePerRelease','productionRequiresFounderApproval','failedGateBlocksPromotion','rollbackPlanRequired','postDeployVerificationRequired','connectorMustBeRegistered'])if(r.rules?.[k]!==true)e.push(`rule disabled ${k}`);
const ids=new Set();
for(const x of r.fixtures??[]){if(ids.has(x.releaseId))e.push(`duplicate ${x.releaseId}`);ids.add(x.releaseId);for(const k of ['workspaceId','artifactHash','environment','status','gates','rollback','approvalClass'])if(x[k]===undefined)e.push(`${x.releaseId} missing ${k}`);if(x.environment==='production'&&x.approvalClass!=='founder-production')e.push(`${x.releaseId} weak production authority`);if(!x.rollback?.tested)e.push(`${x.releaseId} untested rollback`);if(!x.postDeployChecks?.length)e.push(`${x.releaseId} missing post checks`);}
if(e.length){console.error(e.join('\n'));process.exit(1);}console.log(`Release governance valid: ${ids.size} release fixtures.`);