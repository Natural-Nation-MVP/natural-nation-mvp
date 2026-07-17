import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('founder-os/policy/policy-engine.json','utf8'));
const e=[];
if(p.package!=='FOS-FOUNDATION-016')e.push('wrong package');
if(p.constitutionalDirective!=='FOS-DIRECTIVE-001')e.push('missing directive');
for(const r of ['denyByDefault','exactWorkspaceBinding','exactPayloadHashBinding','changedPayloadInvalidatesApproval','securitySensitiveAlwaysFounderRequired','secretsNeverIncluded','delegationCannotExceedFounderGrant'])if(p.rules?.[r]!==true)e.push(`rule disabled ${r}`);
const ids=new Set();
for(const f of p.fixtures??[]){if(ids.has(f.policyId))e.push(`duplicate ${f.policyId}`);ids.add(f.policyId);for(const k of ['workspaceId','action','actionClass','authority','requiredEvidence','expiresMinutes'])if(f[k]===undefined)e.push(`${f.policyId} missing ${k}`);if(f.actionClass==='security-sensitive'&&f.authority!=='founder-required')e.push(`${f.policyId} weak security authority`);}
if(!p.blockingCases?.includes('payload-hash-mismatch'))e.push('payload mismatch not blocked');
if(e.length){console.error(e.join('\n'));process.exit(1);}console.log(`Policy engine valid: ${ids.size} policies.`);