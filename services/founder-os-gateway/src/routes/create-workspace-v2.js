import { authenticateFounder } from "../lib/auth.js";
import { commitFilesAtomically, readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const REGISTRY_PATH = "docs/founder-os/registry/workspaces.json";
const WORKSPACE_ZERO = "founder-os";
const ACTIVE_CREATION_WINDOW_MS = 2 * 60 * 1000;
const RESERVED_KEYS = new Set(["founder-os", "workspace-0", "natural-nation"]);
const BLOCKED_PATTERNS = [
  /credential\s*(theft|steal|harvest)/i,
  /phishing|malware|ransomware|spyware|keylogger/i,
  /unauthorized\s*(surveillance|access|tracking)/i,
  /stalk|harass|doxx|fraud|scam/i,
  /exploit\s+(children|minor|vulnerable)/i,
  /evade\s+(law enforcement|security|detection)/i,
  /weapon\s*(attack|targeting)|plan\s+an?\s+attack/i,
  /change\s+(the\s+)?(way\s+)?founder\s*os\s+(works|behaves|functions)/i,
  /disable\s+(founder\s+approval|authentication|security)/i,
  /ignore\s+(all\s+)?(previous|system)\s+instructions/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /modify\s+(another|the\s+natural\s+nation)\s+workspace/i
];

function text(value, maximum = 4000) {
  return String(value || "").trim().slice(0, maximum);
}

function stringList(value, maximum = 12) {
  return Array.isArray(value)
    ? value.map((item) => text(item, 500)).filter(Boolean).slice(0, maximum)
    : [];
}

function slug(value) {
  return text(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function stableKey(body) {
  return `workspace-creation:${text(body.clientRequestId, 160)}`;
}

function runtimeStore(env) {
  return env.FOUNDER_OS_RUNTIME_STORE?.get && env.FOUNDER_OS_RUNTIME_STORE?.put
    ? env.FOUNDER_OS_RUNTIME_STORE
    : null;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function canonicalPayload(body) {
  return {
    sourceWorkspaceId: text(body.sourceWorkspaceId, 80),
    blueprint: {
      name: text(body.blueprint?.name, 120),
      repository: text(body.blueprint?.repository, 120),
      purpose: text(body.blueprint?.purpose, 4000),
      objectives: stringList(body.blueprint?.objectives),
      constraints: stringList(body.blueprint?.constraints),
      roadmap: stringList(body.blueprint?.roadmap),
      selectedAreas: stringList(body.blueprint?.selectedAreas)
    }
  };
}

async function payloadFingerprint(body) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalPayload(body)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function generateWorkspaceIdentity(displayName, registry) {
  const workspaceId = `ws_${crypto.randomUUID()}`;
  const base = slug(displayName) || "workspace";
  const suffix = workspaceId.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase();
  let workspaceKey = `${base}-${suffix}`;
  const keys = new Set((registry.workspaces || []).map((item) => item.workspaceKey || item.workspaceId));
  let counter = 2;
  while (keys.has(workspaceKey)) workspaceKey = `${base}-${suffix}-${counter++}`;
  return { workspaceId, workspaceKey };
}

export function validateWorkspaceCreationV2(body, request) {
  const blockers = [];
  if (!body || typeof body !== "object") {
    return [{ code: "INVALID_REQUEST", message: "A workspace creation request is required." }];
  }
  if (request.headers.get("x-founder-os-workspace") !== WORKSPACE_ZERO || body.sourceWorkspaceId !== WORKSPACE_ZERO) {
    blockers.push({ code: "WORKSPACE_CREATION_SCOPE_FORBIDDEN", message: "Workspace creation is available only from Founder OS." });
  }
  if (body.confirmation?.approved !== true || body.confirmation?.effectAcknowledged !== true) {
    blockers.push({ code: "FOUNDER_CONFIRMATION_REQUIRED", message: "Explicit Founder confirmation is required before workspace creation." });
  }
  if (!text(body.clientRequestId, 160)) {
    blockers.push({ code: "IDEMPOTENCY_KEY_REQUIRED", message: "A client request ID is required for safe retry and recovery." });
  }
  const name = text(body.blueprint?.name, 120);
  const purpose = text(body.blueprint?.purpose, 4000);
  const proposedKey = slug(name);
  if (name.length < 3) blockers.push({ code: "WORKSPACE_NAME_REQUIRED", message: "The reviewed workspace name is required." });
  if (purpose.length < 10) blockers.push({ code: "WORKSPACE_PURPOSE_REQUIRED", message: "The reviewed workspace purpose is required." });
  if (!proposedKey || RESERVED_KEYS.has(proposedKey)) {
    blockers.push({ code: "PROTECTED_WORKSPACE_ID", message: "The proposed workspace name conflicts with a protected Founder OS identity." });
  }
  const safetyText = [name, purpose, ...stringList(body.blueprint?.constraints), ...stringList(body.blueprint?.objectives)].join(" ");
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(safetyText))) {
    blockers.push({ code: "WORKSPACE_SAFETY_GATE_BLOCKED", message: "The request conflicts with Founder OS safety, governance, or workspace-isolation boundaries." });
  }
  return blockers;
}

export function isActiveWorkspaceCreationV2(existing, now = Date.now()) {
  if (existing?.status !== "running") return false;
  const startedAt = Date.parse(existing.startedAt || "");
  return Number.isFinite(startedAt) && now - startedAt >= 0 && now - startedAt < ACTIVE_CREATION_WINDOW_MS;
}

function findRecovery(registry, requestId) {
  return (registry.workspaces || []).find((item) => text(item?.creationEvidence?.clientRequestId, 160) === requestId) || null;
}

function makeRecord(body, registry, now, fingerprint) {
  const displayName = text(body.blueprint.name, 120);
  const { workspaceId, workspaceKey } = generateWorkspaceIdentity(displayName, registry);
  const sequence = Math.max(0, ...(registry.workspaces || []).map((item) => Number(item.sequence) || 0)) + 1;
  const root = `workspaces/${workspaceKey}/`;
  return {
    workspaceId,
    workspaceKey,
    displayName,
    sequence,
    workspaceType: "founder_created_product",
    description: text(body.blueprint.purpose, 4000),
    status: "foundation",
    lifecycleStatus: "created",
    ownerType: "founder",
    objectives: stringList(body.blueprint.objectives),
    constraints: stringList(body.blueprint.constraints),
    roadmap: stringList(body.blueprint.roadmap),
    isolation: {
      namespace: `workspace:${workspaceId}`,
      dataBoundary: `${workspaceId}-owned application and product data`,
      assetBoundary: `${root}assets/`,
      executionBoundary: `${workspaceId}-scoped projects, packages, tasks, releases, and maintenance`,
      knowledgeBoundary: `${root}knowledge/`,
      deliverableBoundary: `workspace:${workspaceId}:deliverables`
    },
    locations: {
      source: `${root}app/`,
      knowledge: `${root}knowledge/`,
      assets: `${root}assets/`,
      deliverables: `workspace:${workspaceId}:deliverables`
    },
    governance: {
      approvalPolicyRef: "docs/founder-os/FOS-GOVERNANCE-001.md",
      protectedBoundaryRef: "docs/founder-os/FOS-FOUNDATION-001.md#protected-security-boundary",
      workflow: "Art → Codex → Gemini → GPose → Founder"
    },
    capabilities: ["project.create", "project.manage", "workflow.execute", "ai-team.configure", "approval.request", "deliverable.produce", "release.manage", "metrics.report"],
    health: { state: "foundation", summary: "Workspace created and awaiting its first approved build package." },
    repository: {
      strategy: "canonical-monorepo",
      name: text(body.blueprint.repository, 120) || `${workspaceKey}-mvp`,
      root
    },
    creationEvidence: {
      clientRequestId: text(body.clientRequestId, 160),
      payloadFingerprint: fingerprint,
      actor: "founder",
      sourceWorkspaceId: WORKSPACE_ZERO,
      recoveryMode: "canonical-repository",
      createdAt: now
    },
    createdAt: now,
    updatedAt: now
  };
}

function scaffoldFiles(record, body) {
  const root = record.repository.root;
  const blueprint = {
    schemaVersion: "2.0.0",
    workspaceId: record.workspaceId,
    workspaceKey: record.workspaceKey,
    name: record.displayName,
    purpose: record.description,
    objectives: record.objectives,
    constraints: record.constraints,
    roadmap: record.roadmap,
    selectedAreas: stringList(body.blueprint.selectedAreas),
    status: "Founder Approved",
    approvedAt: record.createdAt
  };
  const team = {
    schemaVersion: "1.0.0",
    workspaceId: record.workspaceId,
    workspaceKey: record.workspaceKey,
    workflow: ["Art", "Codex", "Gemini", "GPose", "Founder"],
    roles: {
      Art: "Lead architecture and system design",
      Codex: "Implementation and repository execution",
      Gemini: "Independent implementation review and testing",
      GPose: "Governance, product review, and Founder coordination",
      Founder: "Final approval for protected changes"
    },
    workspaceIsolation: true
  };
  return [
    { path: `${root}README.md`, content: `# ${record.displayName}\n\nWorkspace ID: \`${record.workspaceId}\`  \nWorkspace key: \`${record.workspaceKey}\`\n\n${record.description}\n\nCreated and governed by Founder OS.\n` },
    { path: `${root}config/workspace.json`, content: record },
    { path: `${root}governance/approved-blueprint.json`, content: blueprint },
    { path: `${root}governance/ai-team.json`, content: team },
    { path: `${root}knowledge/README.md`, content: `# ${record.displayName} Knowledge System\n\nStore approved decisions, plans, evidence, prompts, and assets here.\n` },
    { path: `${root}roadmap/initial-roadmap.json`, content: { workspaceId: record.workspaceId, workspaceKey: record.workspaceKey, milestones: record.roadmap } },
    { path: `${root}evidence/creation-record.json`, content: record.creationEvidence }
  ];
}

function resultPayload(record, commit = {}, duplicate = false) {
  const repositoryUrl = commit.owner && commit.repository ? `https://github.com/${commit.owner}/${commit.repository}` : null;
  return {
    ok: true,
    status: duplicate ? "already-created" : "created",
    duplicate,
    recoveryMode: "canonical-repository",
    workspace: record,
    registry: { status: "registered", path: REGISTRY_PATH },
    repository: {
      status: "initialized",
      strategy: record.repository.strategy,
      name: record.repository.name,
      root: record.repository.root,
      url: repositoryUrl,
      commitSha: commit.commitSha || null,
      commitUrl: commit.commitUrl || null
    },
    completion: {
      workspaceId: record.workspaceId,
      workspaceKey: record.workspaceKey,
      registryStatus: "registered",
      repositoryStatus: "initialized",
      aiTeamStatus: "initialized",
      knowledgeStatus: "initialized",
      createdAt: record.createdAt
    }
  };
}

export async function handleCreateWorkspaceV2(request, env, pathname) {
  if (pathname !== "/v2/workspaces") return null;
  if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to create a workspace.", { allowedMethods: ["POST"] });
  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);
  const body = await readJson(request);
  const blockers = validateWorkspaceCreationV2(body, request);
  if (blockers.length) return json(request, { ok: false, status: "blocked", blockers }, 422);
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) {
    return errorResponse(request, 503, "CANONICAL_REPOSITORY_NOT_CONFIGURED", "Canonical repository credentials are not configured.");
  }

  const store = runtimeStore(env);
  const key = stableKey(body);
  const existing = store ? await store.get(key, "json") : null;
  const fingerprint = await payloadFingerprint(body);
  if (existing?.status === "committed") {
    const priorFingerprint = existing.result?.workspace?.creationEvidence?.payloadFingerprint;
    if (priorFingerprint && priorFingerprint !== fingerprint) {
      return errorResponse(request, 409, "IDEMPOTENCY_PAYLOAD_MISMATCH", "This request ID was already used with a different approved workspace blueprint.");
    }
    return json(request, { ...existing.result, duplicate: true, status: "already-created" });
  }

  try {
    const { content: registry } = await readRepositoryJson(env, REGISTRY_PATH);
    if (!Array.isArray(registry.workspaces)) throw new Error("Canonical workspace registry is invalid.");
    const recoveredRecord = findRecovery(registry, text(body.clientRequestId, 160));
    if (recoveredRecord) {
      const priorFingerprint = recoveredRecord.creationEvidence?.payloadFingerprint;
      if (priorFingerprint && priorFingerprint !== fingerprint) {
        return errorResponse(request, 409, "IDEMPOTENCY_PAYLOAD_MISMATCH", "This request ID belongs to a different approved workspace blueprint.");
      }
      const recovered = resultPayload(recoveredRecord, { owner: env.GITHUB_OWNER, repository: env.GITHUB_REPOSITORY }, true);
      if (store) await store.put(key, JSON.stringify({ status: "committed", result: recovered }), { expirationTtl: 604800 });
      return json(request, recovered);
    }
    if (isActiveWorkspaceCreationV2(existing)) {
      return json(request, { ok: false, status: "in-progress", code: "WORKSPACE_CREATION_IN_PROGRESS", message: "Workspace creation is still active. Retry safely in a moment.", clientRequestId: body.clientRequestId }, 409);
    }
    if (store) await store.put(key, JSON.stringify({ status: "running", startedAt: new Date().toISOString(), payloadFingerprint: fingerprint }), { expirationTtl: 86400 });

    const now = new Date().toISOString();
    const record = makeRecord(body, registry, now, fingerprint);
    const keyCollision = registry.workspaces.find((item) => (item.workspaceKey || item.workspaceId) === record.workspaceKey);
    if (keyCollision) return errorResponse(request, 409, "WORKSPACE_KEY_COLLISION", "A generated workspace key collision occurred. Retry safely to generate a new identity.");
    const nextRegistry = { ...registry, schemaVersion: "2.0.0", updatedAt: now, workspaces: [...registry.workspaces, record] };
    const commit = await commitFilesAtomically(env, {
      message: `feat(founder-os): create workspace ${record.workspaceKey} (${record.workspaceId})`,
      files: [{ path: REGISTRY_PATH, content: nextRegistry }, ...scaffoldFiles(record, body)]
    });
    const result = resultPayload(record, { ...commit, owner: env.GITHUB_OWNER, repository: env.GITHUB_REPOSITORY });
    if (store) await store.put(key, JSON.stringify({ status: "committed", result }), { expirationTtl: 604800 });
    return json(request, result, 201);
  } catch (error) {
    if (store) await store.put(key, JSON.stringify({ status: "failed", failedAt: new Date().toISOString(), message: error.message, payloadFingerprint: fingerprint }), { expirationTtl: 86400 });
    return errorResponse(request, 502, "WORKSPACE_CREATION_FAILED", error.message || "Workspace creation failed safely. The same request can be retried.");
  }
}
