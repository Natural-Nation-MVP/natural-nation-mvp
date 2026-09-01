import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const execution = read('services/founder-os-gateway/src/lib/repository-execution.js');
const route = read('services/founder-os-gateway/src/routes/ai-orchestration.js');
const auth = read('services/founder-os-gateway/src/lib/auth.js');
const tests = read('services/founder-os-gateway/test/repository-execution.test.mjs');
const release = read('docs/releases/FOS-PHASE-007-GOVERNED-REPOSITORY-ACTIONS.md');

assert.match(execution, /post-beta-lightweight/);
assert.match(execution, /delegated-routine/);
assert.match(execution, /founder-required/);
assert.match(execution, /pull-request:merge/);
assert.match(execution, /deployment:production/);
assert.match(execution, /repository:delete/);
assert.match(execution, /SENSITIVE_PATH_PATTERNS/);
assert.match(route, /authenticateRepositoryPreparation/);
assert.match(route, /authenticateAgentCallback/);
assert.match(route, /FOUNDER_APPROVAL_REQUIRED/);
assert.match(auth, /repository:prepare/);
assert.match(tests, /may prepare routine work but cannot authorize protected work/);
assert.match(tests, /stops for Founder approval before GitHub writes/);
assert.match(release, /post-beta operating model/);
assert.match(release, /Merge and production deployment remain Founder-controlled/);

console.log('FOS-PHASE-7-GOVERNED-REPOSITORY-ACTIONS validation passed');
