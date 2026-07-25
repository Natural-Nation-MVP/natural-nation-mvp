import { authenticateFounder } from "../lib/auth.js";
import { commitFilesAtomically, readRepositoryJson } from "../lib/github.js";
import { errorResponse, json } from "../lib/http.js";

const REGISTRY_PATH = "docs/founder-os/registry/workspaces.json";
const WORKSPACE_ZERO = "founder-os";
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

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function text(value, maximum = 4000) {
  return String(value || "").trim().slice(0, maximum);
}

function stringList(value, maximum = 12) {
  return Array.isArray(value)
    ? value.map((item) => text(item, 500)).filter(Boolean).slice(0, maximum)
    : [];
}

function stableKey(body) {
  return `workspace-creation:${text(body.clientRequestId, 160)}`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function validateWorkspaceCreation(body, request) {
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
  const workspaceId = slug(name);
  if (name.length < 3) blockers.push({ code: "WORKSPACE_NAME_REQUIRED", message: "The reviewed workspace name is required." });
  if (purpose.length < 10) blockers.push({ code: "WORKSPACE_PURPOSE_REQUIRED", message: "The reviewed workspace purpose is required." });
  if (!workspaceId || [WORKSPACE_ZERO, "workspace-0", "natural-nation"].includes(workspaceId)) {
    blockers.push({ code: "PROTECTED_WORKSPACE_ID", message: "The proposed workspace identity conflicts with a protected workspace." });
  }

  const safetyText = [name, purpose, ...stringList(body.blueprint?.constraints), ...stringList(body.blueprint?.objectives)].join(" ");
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(safetyText))) {
    blockers.push({ code: "WORKSPACE_SAFETY_GATE_BLOCKED", message: "The request conflicts with Founder OS safety, governance, or workspace-isolation boundaries." });
  }
  return blockers;
}

function makeRecord(body, registry, now) {
  const name = text(body.blueprint.name, 120);
  const workspaceId = slug(name);
  const sequence = Math.max(0, ...registry.workspaces.map((item) => Number(item.sequence) || 0)) + 1;
  return {
    workspaceId,
    displayName: name,
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
      assetBoundary: `workspaces/${workspaceId}/assets/`,
      executionBoundary: `${workspaceId}-scoped projects, packages, tasks, releases, and maintenance`,
      knowledgeBoundary: `workspaces/${workspaceId}/knowledge/`,
      deliverableBoundary: `workspace:${workspaceId}:deliverables`
    },
    locations: {
      source: `workspaces/${workspaceId}/app/`,
      knowledge: `workspaces/${workspaceId}/knowledge/`,
      assets: `workspaces/${workspaceId}/assets/`,
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
      name: text(body.blueprint.repository, 120) || `${workspaceId}-mvp`,
      root: `workspaces/${workspaceId}/`
    },
    creationEvidence: {
      clientRequestId: text(body.clientRequestId, 160),
      actor: "founder",
      sourceWorkspaceId: WORKSPACE_ZERO,
      createdAt: now
    },
    createdAt: now,
    updatedAt: now
  };
}

function scaffoldFiles(record, body) {
  const root = record.repository.root;
  const blueprint = {
    schemaVersion: "1.0.0",
    workspaceId: record.workspaceId,
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
    { path: `${root}README.md`, content: `# ${record.displayName}\n\n${record.description}\n\nCreated and governed by Founder OS.\n` },
    { path: `${root}config/workspace.json`, content: record },
    { path: `${root}governance/approved-blueprint.json`, content: blueprint },
    { path: `${root}governance/ai-team.json`, content: team },
    { path: `${root}knowledge/README.md`, content: `# ${record.displayName} Knowledge System\n\nStore approved decisions, plans, evidence, prompts, and assets here.\n` },
    { path: `${root}roadmap/initial-roadmap.json`, content: { workspaceId: record.workspaceId, milestones: record.roadmap } },
    { path: `${root}evidence/creation-record.json`, content: record.creationEvidence }
  ];
}

function resultPayload(record, commit, duplicate = false) {
  const repositoryUrl = `https://github.com/${commit.owner}/${commit.repository}`;
  return {
    ok: true,
    status: duplicate ? "already-created" : "created",
    duplicate,
    workspace: record,
    registry: { status: "registered", path: REGISTRY_PATH },
    repository: {
      status: "initialized",
      strategy: record.repository.strategy,
      name: record.repository.name,
      root: record.repository.root,
      url: repositoryUrl,
      commitSha: commit.commitSha,
      commitUrl: commit.commitUrl
    },
    completion: {
      workspaceId: record.workspaceId,
      registryStatus: "registered",
      repositoryStatus: "initialized",
      aiTeamStatus: "initialized",
      knowledgeStatus: "initialized",
      createdAt: record.createdAt
    }
  };
}

export async function handleCreateWorkspace(request, env, pathname) {
  if (pathname !== "/v2/workspaces") return null;
  if (request.method !== "POST") return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "Use POST to create a workspace.", { allowedMethods: ["POST"] });

  const auth = authenticateFounder(request, env);
  if (!auth.ok) return errorResponse(request, auth.status, auth.code, auth.message);

  const body = await readJson(request);
  const blockers = validateWorkspaceCreation(body, request);
  if (blockers.length) return json(request, { ok: false, status: "blocked", blockers }, 422);
  if (!env.FOUNDER_OS_RUNTIME_STORE?.get || !env.FOUNDER_OS_RUNTIME_STORE?.put) {
    return errorResponse(request, 503, "RUNTIME_STORE_REQUIRED", "Durable workspace creation recovery is not configured.");
  }
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) {
    return errorResponse(request, 503, "CANONICAL_REPOSITORY_NOT_CONFIGURED", "Canonical repository credentials are not configured.");
  }

  const key = stableKey(body);
  const existing = await env.FOUNDER_OS_RUNTIME_STORE.get(key, "json");
  if (existing?.status === "committed") return json(request, { ...existing.result, duplicate: true, status: "already-created" });
  if (existing?.status === "running") return json(request, { ok: false, status: "in-progress", clientRequestId: body.clientRequestId }, 409);

  await env.FOUNDER_OS_RUNTIME_STORE.put(key, JSON.stringify({ status: "running", startedAt: new Date().toISOString() }), { expirationTtl: 86400 });
  try {
    const { content: registry } = await readRepositoryJson(env, REGISTRY_PATH);
    if (!Array.isArray(registry.workspaces)) throw new Error("Canonical workspace registry is invalid.");
    const proposedId = slug(body.blueprint.name);
    const duplicateRecord = registry.workspaces.find((item) => item.workspaceId === proposedId || String(item.displayName).toLowerCase() === String(body.blueprint.name).toLowerCase());
    if (duplicateRecord) {
      return json(request, { ok: false, status: "blocked", blockers: [{ code: "WORKSPACE_ALREADY_EXISTS", message: "A workspace with this name or canonical ID already exists." }] }, 409);
    }

    const now = new Date().toISOString();
    const record = makeRecord(body, registry, now);
    const nextRegistry = { ...registry, updatedAt: now, workspaces: [...registry.workspaces, record] };
    const commit = await commitFilesAtomically(env, {
      message: `feat(founder-os): create workspace ${record.workspaceId}`,
      files: [{ path: REGISTRY_PATH, content: nextRegistry }, ...scaffoldFiles(record, body)]
    });
    const result = resultPayload(record, { ...commit, owner: env.GITHUB_OWNER, repository: env.GITHUB_REPOSITORY });
    await env.FOUNDER_OS_RUNTIME_STORE.put(key, JSON.stringify({ status: "committed", result }), { expirationTtl: 604800 });
    return json(request, result, 201);
  } catch (error) {
    await env.FOUNDER_OS_RUNTIME_STORE.put(key, JSON.stringify({ status: "failed", failedAt: new Date().toISOString(), message: error.message }), { expirationTtl: 86400 });
    return errorResponse(request, 502, "WORKSPACE_CREATION_FAILED", error.message || "Workspace creation failed safely. The same request can be retried.");
  }
}
