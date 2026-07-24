import fs from 'node:fs';

const files = {
  index: 'docs/founder-os/index.html',
  registry: 'docs/founder-os/js/workspace-registry.js',
  creation: 'docs/founder-os/js/workspace-creation.js',
  styles: 'docs/founder-os/css/workspace-creation.css'
};

for (const path of Object.values(files)) {
  if (!fs.existsSync(path)) throw new Error(`FOUNDER-UX-001 missing required file: ${path}`);
}

const index = fs.readFileSync(files.index, 'utf8');
const registry = fs.readFileSync(files.registry, 'utf8');
const creation = fs.readFileSync(files.creation, 'utf8');
const styles = fs.readFileSync(files.styles, 'utf8');

for (const contract of [
  'data-create-workspace',
  'workspace-creation.js?v=founder-ux-001',
  'workspace-registry.js?v=founder-ux-001'
]) {
  if (!index.includes(contract)) throw new Error(`FOUNDER-UX-001 index contract missing: ${contract}`);
}

for (const contract of [
  'enableControlCenterCreation',
  "window.NNOSActiveWorkspace = null",
  "data-workspace=\"registry\"",
  "createButton.disabled = false"
]) {
  if (!registry.includes(contract)) throw new Error(`Control Center registry contract missing: ${contract}`);
}

for (const contract of [
  "if (window.NNOSActiveWorkspace)",
  'Workspace creation is available only from Founder OS Home.',
  'What are we building?',
  'What does success look like?',
  'Constraints and boundaries',
  'Auto-prepared · editable before protected creation',
  'Protected workspace creation is not enabled yet.',
  'no repository action was performed',
  'window.NNOSWorkspaceCreation'
]) {
  if (!creation.includes(contract)) throw new Error(`Workspace creation contract missing: ${contract}`);
}

if (!styles.includes('@media(max-width:760px)')) {
  throw new Error('Workspace creation responsive contract missing.');
}

if (registry.includes('New workspace — coming later')) {
  throw new Error('Workspace creation remains disabled in the Founder OS Control Center.');
}

console.log('FOUNDER-UX-001 Control Center and smart intake contracts passed.');
