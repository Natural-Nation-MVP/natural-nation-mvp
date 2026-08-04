import fs from 'node:fs';

const files = {
  rootIndex: 'docs/index.html',
  canonicalIndex: 'docs/founder-os/index.html',
  registry: 'docs/founder-os/js/workspace-registry.js',
  creation: 'docs/founder-os/js/workspace-creation.js',
  styles: 'docs/founder-os/css/workspace-creation.css'
};

for (const path of Object.values(files)) {
  if (!fs.existsSync(path)) throw new Error(`FOUNDER-UX-001 missing required file: ${path}`);
}

const rootIndex = fs.readFileSync(files.rootIndex, 'utf8');
const canonicalIndex = fs.readFileSync(files.canonicalIndex, 'utf8');
const registry = fs.readFileSync(files.registry, 'utf8');
const creation = fs.readFileSync(files.creation, 'utf8');
const styles = fs.readFileSync(files.styles, 'utf8');

for (const contract of [
  'founder-os-entry',
  'canonical-redirect',
  "new URL('./founder-os/', window.location.href)",
  'window.location.replace(destination.href)'
]) {
  if (!rootIndex.includes(contract)) throw new Error(`Founder OS root redirect contract missing: ${contract}`);
}
if (rootIndex.includes('workspace-registry.js') || rootIndex.includes('workspace-manager.js')) {
  throw new Error('The root redirect must not load a second Founder OS runtime.');
}

for (const contract of [
  'data-create-workspace',
  'workspace-creation.js',
  'workspace-registry.js',
  'founder-home-functionality.css',
  'workspace-launch-center.css',
  'founder-home-functionality.js',
  'navigation-manager-035.js'
]) {
  if (!canonicalIndex.includes(contract)) throw new Error(`FOUNDER-UX-001 canonical index contract missing: ${contract}`);
}

for (const contract of ['data-open-workspace', 'workspace-card-action', 'founder-os:workspace-registry-rendered']) {
  if (!registry.includes(contract)) throw new Error(`Control Center registry contract missing: ${contract}`);
}
if (registry.includes('data-workspace-link')) throw new Error('Retired clickable workspace-card links remain in the registry runtime.');

for (const contract of [
  'Workspace Discovery', 'Founder OS is listening', 'One answer at a time.', 'QUESTION_FLOW',
  'AI-generated workspace names', 'generateNameSuggestions',
  'AI-drafted constraints and boundaries', 'Review, remove, or add boundaries',
  'AI-generated project options', 'Vision Score', 'Challenge My Idea', 'Run Challenge', 'Skip',
  'BLOCKED_PATTERNS', 'UNSUPPORTED_PATTERNS', 'assessRequest',
  'change\\s+(the\\s+)?(way\\s+)?founder\\s*os',
  'Founder approval required for protected changes', 'Workspace remains isolated from all other workspaces',
  'The Gateway will authenticate the Founder', 'window.NNOSWorkspaceCreation'
]) {
  if (!creation.includes(contract)) throw new Error(`Workspace Discovery contract missing: ${contract}`);
}

for (const contract of [
  "localStorage.setItem(DRAFT_KEY, JSON.stringify(state))",
  "localStorage.getItem(DRAFT_KEY)",
  'normalizeState', 'persistState', 'clearDraft',
  'step: Math.min(6', 'questionIndex: Math.min',
  'nameSuggestions:', 'selected:', 'challenge:', 'creation:',
  'It will recover after refresh or browser restart.'
]) {
  if (!creation.includes(contract)) throw new Error(`Workspace Discovery persistence contract missing: ${contract}`);
}

for (const contract of [
  'aria-modal="true"', 'aria-labelledby="workspace-creation-title"',
  'aria-describedby="workspace-creation-description"', 'aria-live="polite"',
  'aria-current', 'aria-pressed', 'role="alert"',
  "event.key === 'Escape'", "event.key === 'Tab'", 'returnFocus'
]) {
  if (!creation.includes(contract)) throw new Error(`Workspace Discovery accessibility contract missing: ${contract}`);
}

if (!creation.includes('return options.slice(0, 5)')) throw new Error('AI-generated project options are not limited to five.');
if (!creation.includes('slice(0, 5)')) throw new Error('AI-generated workspace names are not limited to five.');

for (const contract of ['recommendation-chip', 'incomplete-list', 'optional-challenge', 'workspace-gate-block', '@media(max-width:760px)', '.sr-only', ':focus-visible', 'min-height:44px', 'prefers-reduced-motion']) {
  if (!styles.includes(contract)) throw new Error(`Workspace Discovery style/accessibility contract missing: ${contract}`);
}

if (creation.includes('no repository action was performed')) throw new Error('The retired placeholder-only creation alert remains in Workspace Discovery.');

console.log('FOUNDER-UX-001 canonical entry, persistence, accessibility, and protected handoff contracts passed.');
