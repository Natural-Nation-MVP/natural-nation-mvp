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
  release,
  composer,
  composerCss,
  gatewayClient,
  workspaceRegistry
] = await Promise.all([
  read("services/founder-os-gateway/src/lib/ai-work-queue.js"),
  read("services/founder-os-gateway/src/routes/ai-work-queue.js"),
  read("services/founder-os-gateway/src/index.js"),
  read("docs/founder-os/js/ai-work-queue.js"),
  read("docs/founder-os/css/ai-work-queue.css"),
  read("docs/founder-os/index.html"),
  read("services/founder-os-gateway/test/ai-work-queue.test.mjs"),
  read("docs/releases/FOS-PHASE-009-GOVERNED-AI-WORK-QUEUE.md"),
  read("docs/founder-os/js/build-request-composer.js"),
  read("docs/founder-os/css/build-request-composer.css"),
  read("docs/founder-os/js/gateway-client-v2.js"),
  read("docs/founder-os/js/workspace-registry.js")
]);

assert.match(queue, /founder-os:ai-work-queue/, "Queue must use a workspace-scoped durable key.");
assert.match(queue, /MAX_ITEMS\s*=\s*200/, "Queue must enforce a bounded history.");
assert.match(queue, /expectedRevision/, "Queue must enforce optimistic concurrency.");
assert.match(queue, /ownerRole/, "Queue must enforce role ownership.");
assert.match(queue, /ROLE_CAPABILITIES/, "Queue must enforce registered role capabilities.");
assert.match(queue, /requiredAction/, "Queue assignments must declare the required capability.");
assert.match(queue, /submitQueueEvidence/, "Queue must accept governed evidence.");
assert.match(queue, /appendExecutionLedgerRecord/, "Queue events must feed the Phase 8 ledger.");
assert.match(queue, /normalizeWorkOrder/, "Founder-created assignments must carry a normalized work order.");
assert.match(queue, /Workspace Readiness must be ready/, "The gateway must enforce Workspace Readiness.");
assert.match(queue, /Package Readiness must be ready/, "The gateway must enforce Package Readiness.");

for (const action of ["claim", "progress", "evidence", "request-approval", "complete", "decision"]) {
  assert.ok(route.includes(action), `Queue route must expose ${action}.`);
}
assert.match(route, /x-founder-os-agent/i, "Agent callbacks must identify their governed role.");
assert.match(route, /authenticateFounder/, "Founder decisions must remain authenticated.");
assert.match(gateway, /governedAiWorkQueue:\s*"runtime-store-backed"/, "Gateway must advertise the durable queue.");
assert.match(gateway, /handleAiWorkQueue/, "Gateway must route queue requests.");

for (const marker of [
  "AI Work Queue",
  "What Needs Your Attention",
  "Active assignments",
  "Up next",
  "Open Build Work",
  "Create Build",
  "data-create-build",
  "data-ai-queue-feedback",
  "data-ai-queue-filter",
  "queue history is preserved"
]) {
  assert.ok(ui.includes(marker), `Queue UI is missing: ${marker}`);
}
assert.match(ui, /workspaceId !== workspace\.id/, "UI must reject cross-workspace responses.");
assert.match(ui, /filterCount/, "Empty filters must expose a disabled state instead of appearing unresponsive.");
assert.match(css, /grid-template-columns:\s*repeat\(5/, "Desktop must show the four queue metrics and Gateway health.");
assert.match(css, /@media \(min-width: 761px\) and \(max-width: 1600px\)/, "Queue must define the approved iPad landscape range.");
assert.match(css, /\.ai-work-queue\s*\{[\s\S]*grid-template-areas:/, "The approved iPad composition must use one explicit queue and Team canvas.");
assert.match(css, /@media \(max-width: 760px\)/, "Queue must define the approved mobile layout.");
assert.match(css, /overflow-x:\s*clip/, "Mobile queue must prevent page overflow.");
assert.match(index, /ai-work-queue\.css\?v=fos-actions-015/, "Queue stylesheet must use the current build marker.");
assert.match(index, /ai-work-queue\.js\?v=fos-actions-015/, "Queue controller must use the current build marker.");
assert.match(index, /build-request-composer\.css\?v=fos-actions-015/, "Build composer styles must be cache-versioned.");
assert.match(index, /build-request-composer\.js\?v=fos-actions-015/, "Build composer controller must be cache-versioned.");

for (const marker of ["Workspace Readiness", "Package Readiness", "Needs clarification", "Review Work Order", "Approve Work Order and Start Build", "draft-preview"]) {
  assert.ok(composer.includes(marker), `Build request composer is missing: ${marker}`);
}
assert.match(composerCss, /build-readiness-grid/, "Build readiness must have a responsive visual layout.");
assert.match(gatewayClient, /createAiWorkItem/, "The protected browser client must create governed AI work.");
for (const module of ["discovery", "blueprint", "build", "ai", "repo", "knowledge"]) {
  assert.ok(workspaceRegistry.includes(`target: '${module}'`), `New workspaces must include the ${module} area.`);
}

assert.match(tests, /isolated by workspace|workspace isolation/i, "Queue tests must cover workspace isolation.");
assert.match(tests, /duplicate claim/i, "Queue tests must cover duplicate claims.");
assert.match(tests, /evidence/i, "Queue tests must cover evidence.");
assert.match(tests, /Founder/i, "Queue tests must cover Founder decisions.");
assert.match(tests, /outside a role capability/i, "Queue tests must cover capability escalation.");
assert.match(tests, /readiness-complete Founder work orders/i, "Queue tests must cover readiness-gated work orders.");
assert.match(release, /sanitized read-only/i, "Release boundary must describe queue read access.");
assert.match(release, /authenticated mutations/i, "Release boundary must describe mutation authentication.");

console.log("Governed AI work queue validation passed.");
