import fs from 'node:fs';

const requiredFiles=[
  'founder-os/app/index.html',
  'founder-os/app/styles.css',
  'founder-os/app/app.mjs',
  '.github/workflows/deploy-founder-os-pilot.yml',
  'docs/founder-os/FOS-LIVE-PILOT-001-USER-VALIDATION.md'
];
for(const file of requiredFiles){if(!fs.existsSync(file))throw new Error(`Missing ${file}`)}

const html=fs.readFileSync('founder-os/app/index.html','utf8');
const app=fs.readFileSync('founder-os/app/app.mjs','utf8');
const workflow=fs.readFileSync('.github/workflows/deploy-founder-os-pilot.yml','utf8');

const assertions=[
  [html.includes('Live Founder Review Pilot'),'live pilot title'],
  [html.includes('approval-dialog'),'approval review dialog'],
  [html.includes('Founder Verification Checklist'),'verification checklist'],
  [app.includes('/api/founder-os/health'),'runtime health endpoint'],
  [app.includes('/api/founder-os/pilot/run'),'pilot execution endpoint'],
  [app.includes('x-founder-os-workspace'),'workspace context header'],
  [app.includes('local review evidence only'),'evidence classification'],
  [app.includes('testIsolation'),'workspace isolation test'],
  [!app.includes('OPENAI_API_KEY')&&!app.includes('GOOGLE_AI_API_KEY'),'no provider secrets in browser'],
  [workflow.includes('actions/deploy-pages@v4'),'GitHub Pages deployment']
];
for(const [pass,label] of assertions){if(!pass)throw new Error(`Validation failed: ${label}`)}
console.log(`Founder OS live pilot validation passed (${assertions.length} checks).`);
