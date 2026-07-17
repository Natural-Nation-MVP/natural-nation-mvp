import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('founder-os/costs/cost-engine.json','utf8'));
const e=[];
if(c.package!=='FOS-FOUNDATION-018')e.push('wrong package');
if(c.constitutionalDirective!=='FOS-DIRECTIVE-001')e.push('missing directive');
for(const k of ['workspaceAllocationRequired','pricingFreshnessRequired','estimatedAndActualSeparated','spendAboveThresholdRequiresFounderApproval','billingMutationProhibited','reservationsMustReconcile'])if(c.rules?.[k]!==true)e.push(`rule disabled ${k}`);
const ids=new Set();
for(const b of c.fixtures??[]){if(ids.has(b.budgetId))e.push(`duplicate ${b.budgetId}`);ids.add(b.budgetId);for(const k of ['workspaceId','period','currency','limit','spent','reserved','forecast','approvalThreshold'])if(b[k]===undefined)e.push(`${b.budgetId} missing ${k}`);if(b.limit<0||b.spent<0||b.reserved<0)e.push(`${b.budgetId} negative money`);if(b.approvalThreshold>b.limit)e.push(`${b.budgetId} threshold exceeds budget`);}
if(c.thresholds?.hardStopPercent!==100)e.push('hard stop must equal 100');
if(e.length){console.error(e.join('\n'));process.exit(1);}console.log(`Cost engine valid: ${ids.size} budgets.`);