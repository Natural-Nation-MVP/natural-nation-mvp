import fs from 'node:fs';
const file='founder-os/knowledge/artifact-registry.json';
const registry=JSON.parse(fs.readFileSync(file,'utf8'));
const errors=[];
if(registry.package!=='FOS-FOUNDATION-015') errors.push('wrong package');
if(registry.constitutionalDirective!=='FOS-DIRECTIVE-001') errors.push('directive missing');
const ids=new Set(); const truths=new Set();
for(const a of registry.fixtures??[]){
  if(ids.has(a.artifactId)) errors.push(`duplicate artifact ${a.artifactId}`); ids.add(a.artifactId);
  for(const key of ['artifactId','workspaceId','kind','version','status','contentHash','provenance','sensitivity']) if(a[key]===undefined) errors.push(`${a.artifactId} missing ${key}`);
  if(a.sourceOfTruth){const k=`${a.workspaceId}:${a.kind}:${a.title}`; if(truths.has(k)) errors.push(`duplicate source of truth ${k}`); truths.add(k);}
  if(a.supersedes && a.supersedes===a.artifactId) errors.push(`${a.artifactId} self-supersedes`);
  if(JSON.stringify(a).match(/api[_-]?key|access[_-]?token|password/i)) errors.push(`${a.artifactId} appears to contain secret field`);
}
for(const rule of ['oneWorkspaceContext','immutableArtifactIdentity','lockedChangesRequireFounderApproval','crossWorkspaceMutationBlocked','rawSecretsForbidden']) if(registry.rules?.[rule]!==true) errors.push(`rule disabled: ${rule}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1);} console.log(`Artifact registry valid: ${ids.size} fixtures, ${truths.size} sources of truth.`);