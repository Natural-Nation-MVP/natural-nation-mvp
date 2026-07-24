import fs from 'node:fs';

const files = {
  rootIndex: 'docs/index.html',
  compatibilityIndex: 'docs/founder-os/index.html',
  registry: 'docs/founder-os/js/workspace-registry.js',
  creation: 'docs/founder-os/js/workspace-creation.js',
  styles: 'docs/founder-os/css/workspace-creation.css'
};

for (const path of Object.values(files)) {
  if (!fs.existsSync(path)) throw new Error(`FOUNDER-UX-001 missing required file: ${path}`);
}

const rootIndex = fs.readFileSync(files.rootIndex, 'utf8');
const compatibilityIndex = fs.readFileSync(files.compatibilityIndex, 'utf8');
const registry = fs.readFileSync(files.registry, 'utf8');
const creation = fs.readFileSync(files.creation, 'utf8');
const styles = fs.readFileSync(files.styles, 'utf8');

for (const [label, index] of [['root', rootIndex], ['compatibility', compatibilityIndex]]) {
  for (const contract of ['data-create-workspace', 'workspace-creation.js', 'workspace-registry.js']) {
    if (!index.includes(contract)) throw new Error(`FOUNDER-UX-001 ${label} index contract missing: ${contract}`);
  }
}

for (const contract of [
  'enableControlCenterCreation',
  'window.NNOSActiveWorkspace = null',
  'data-workspace="registry"',
  'createButton.disabled = false'
]) {
  if (!registry.includes(contract)) throw new Error(`Control Center registry contract missing: ${contract}`);
}

for (const contract of [
  'Workspace Discovery',
  'What do you want to create?',
  'Why does this need to exist?',
  'Who is it for first?',
  'AI-generated project options',
  'Vision Score',
  'Only incomplete areas are shown below.',
  'Improve This Section',
  'Challenge My Idea',
  'Run Challenge',
  'Skip',
  'BLOCKED_PATTERNS',
  'UNSUPPORTED_PATTERNS',
  'assessRequest',
  'This workspace cannot be created as described.',
  'Safer direction',
  'Protected Gateway feasibility and safety checks will run again',
  'no repository action was performed',
  'window.NNOSWorkspaceCreation'
]) {
  if (!creation.includes(contract)) throw new Error(`Workspace Discovery contract missing: ${contract}`);
}

const optionLimit = creation.match(/return options\.slice\(0, 5\)/);
if (!optionLimit) throw new Error('AI-generated project options are not limited to five.');

for (const contract of ['recommendation-chip', 'incomplete-list', 'optional-challenge', 'workspace-gate-block', '@media(max-width:760px)']) {
  if (!styles.includes(contract)) throw new Error(`Workspace Discovery style contract missing: ${contract}`);
}

if (registry.includes('New workspace — coming later')) {
  throw new Error('Workspace creation remains disabled in the Founder OS Control Center.');
}

console.log('FOUNDER-UX-001 Workspace Discovery v1.1 contracts passed.');