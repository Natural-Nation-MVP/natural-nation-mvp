import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  queue,
  route,
  gateway,
  ui,
  css,
  index,
  tests,
  release
] = await Promise.all([
  read("services/founder-os-gateway/src/lib/ai-work-queue.js"),
  read("services/founder-os-gateway/src/routes/ai-work-queue.js"),
  read("services/founder-os-gateway/src/index.js"),
  read("docs/founder-os/js/ai-work-queue.js"),
  read("docs/founder-os/css/ai-work-queue.css"),
  read("docs/founder-os/index.html"),
  read("services/founder-os-gateway/test/ai-work-queue.test.mjs"),
  read("docs/releases/FOS-PHASE-009-GOVERNED-AI-WORK-QUEUE.md")
]);

assert.match(queue, /founder-os:ai-work-queue/, "Queue must use a workspace-scoped durable key.");
assert.match(queue, /MAX_ITEMS\s*=\s*200/, "Queue must enforce a bounded history.");
assert.match(queue, /expectedRevision/, "Queue must enforce optimistic concurrency.");
assert.match(queue, /ownerRole/, "Queue must enforce role ownership.");
assert.match(queue, /submitQueueEvidence/, "Queue must accept governed evidence.");
assert.match(queue, /appendExecutionLedgerRecord/, "Queue events must feed the Phase 8 ledger.");

for (const action of ["claim", "progress", "evidence", "request-approval", "complete", "decision"]) {
  assert.match(route, new RegExp(`/${action}`), `Queue route must expose ${action}.`);
}
assert.match(route, /x-founder-os-agent/i, "Agent callbacks must identify their governed role.");
assert.match(route, /requireFounderAuth|isFounder/i, "Founder decisions must remain authenticated.");
assert.match(gateway, /governedAiWorkQueue:\s*"runtime-store-backed"/, "Gateway must advertise the durable queue.");
assert.match(gateway, /handleAiWorkQueue/, "Gateway must route queue requests.");

for (const marker of [
  "AI Work Queue",
  "What Needs Your Attention",
  "Active assignments",
  "Up next",
  "data-ai-queue-filter",
  "queue history is preserved"
]) {
  assert.ok(ui.includes(marker), `Queue UI is missing: ${marker}`);
}
assert.match(ui, /workspaceId !== workspace\.id/, "UI must reject cross-workspace responses.");
assert.match(css, /grid-template-columns:\s*repeat\(4/, "Desktop must show four queue metrics.");
assert.match(css, /@media \(max-width: 760px\)/, "Queue must define the approved mobile layout.");
assert.match(css, /overflow-x:\s*clip/, "Mobile queue must prevent page overflow.");
assert.match(index, /ai-work-queue\.css\?v=fos-actions-014/, "Queue stylesheet must use the canonical build marker.");
assert.match(index, /ai-work-queue\.js\?v=fos-actions-014/, "Queue controller must use the canonical build marker.");

for (const marker of ["workspace isolation", "duplicate claim", "evidence", "Founder"]) {
  assert.match(tests, new RegExp(marker, "i"), `Queue tests must cover ${marker}.`);
}
assert.match(release, /sanitized read-only/i, "Release boundary must describe queue read access.");
assert.match(release, /authenticated mutations/i, "Release boundary must describe mutation authentication.");

console.log("Governed AI work queue validation passed.");
