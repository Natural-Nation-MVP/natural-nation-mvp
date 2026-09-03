import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ledger = read("services/founder-os-gateway/src/lib/execution-ledger.js");
const route = read("services/founder-os-gateway/src/routes/execution-ledger.js");
const orchestration = read("services/founder-os-gateway/src/lib/ai-orchestration.js");
const orchestrationRoute = read("services/founder-os-gateway/src/routes/ai-orchestration.js");
const gateway = read("services/founder-os-gateway/src/index.js");
const tests = read("services/founder-os-gateway/test/execution-ledger.test.mjs");
const release = read("docs/releases/FOS-PHASE-008-PERSISTENT-EXECUTION-LEDGER.md");

assert.match(ledger, /FOUNDER_OS_RUNTIME_STORE/);
assert.match(ledger, /MAX_RECORDS = 500/);
assert.match(ledger, /SENSITIVE_KEY/);
assert.match(ledger, /appendExecutionLedgerRecord/);
assert.doesNotMatch(ledger, /sha256|payloadHash|artifactHash/);
assert.match(route, /execution-ledger/);
assert.match(route, /authenticateFounder/);
assert.match(route, /readOnly: true/);
assert.match(orchestration, /type: "governed-run"/);
assert.match(orchestrationRoute, /type: "founder-decision"/);
assert.match(orchestrationRoute, /type: "repository-action"/);
assert.match(gateway, /persistentExecutionLedger/);
assert.match(tests, /persists lightweight execution history across reads/);
assert.match(tests, /keeps execution history isolated by workspace/);
assert.match(release, /lightweight post-beta ledger/);
assert.match(release, /No payload hashes/);

console.log("FOS-PHASE-8-PERSISTENT-EXECUTION-LEDGER validation passed");
