import { errorResponse, json } from "../lib/http.js";

const WORKSPACE_ID = "workspace-natural-nation";
const WORKFLOW_ID = "nn-ks-002";
const STATE_KEY = `founder-os:workflow:${WORKSPACE_ID}:${WORKFLOW_ID}`;
const TEXT_ENCODER = new TextEncoder();

function assertWorkspace(request) {
  return request.headers.get("x-founder-os-workspace") === WORKSPACE_ID;
}

function runtimeStore(env) {
  return env.FOUNDER_OS_RUNTIME_STORE?.get && env.FOUNDER_OS_RUNTIME_STORE?.put
    ? env.FOUNDER_OS_RUNTIME_STORE
    : null;
}

function initialState() {
  return {
    id: WORKFLOW_ID,
    workspaceId: WORKSPACE_ID,
    stageIndex: 0,
    status: "ready",
    startedAt: null,
    updatedAt: new Date().toISOString(),
    output: "No live repository review has started.",
    run: null,
    approvals: [],
    evidence: [],
    artifact: null
  };
}

async function readState(env) {
  const store = runtimeStore(env);
  if (!store) return initialState();
  const saved = await store.get(STATE_KEY, "json");
  return saved || initialState();
}

async function writeState(env, state) {
  const store = runtimeStore(env);
  if (!store) return false;
  await store.put(STATE_KEY, JSON.stringify(state));
  return true;
}

function base64UrlEncode(value) {
  const bytes = typeof value === "string" ? TEXT_ENCODER.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", TEXT_ENCODER.encode(value));
  return `sha256:${base64UrlEncode(new Uint8Array(digest))}`;
}

async function signClaim(env, claim) {
  if (!env.FOUNDER_API_KEY) return null;
  const payload = base64UrlEncode(JSON.stringify(claim));
  const key = await crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(env.FOUNDER_API_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, TEXT_ENCODER.encode(payload));
  return `${payload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function verifyClaim(env, token) {
  if (!env.FOUNDER_API_KEY || !token?.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const key = await crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(env.FOUNDER_API_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signature),
    TEXT_ENCODER.encode(payload)
  );
  if (!valid) return null;
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function githubJson(env, path) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPOSITORY) {
    throw Object.assign(new Error("GitHub repository bindings are incomplete."), { code: "GITHUB_NOT_CONFIGURED" });
  }
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPOSITORY)}${path}`, {
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "founder-os-gateway",
      "x-github-api-version": "2022-11-28"
    }
  });
  if (!response.ok) {
    throw Object.assign(new Error(`GitHub repository request returned ${response.status}.`), { code: "GITHUB_DISCOVERY_FAILED" });
  }
  return response.json();
}

function relevantPath(path) {
  return /(knowledge|duey|protocol|blueprint|memory|prompt|founder-os|natural-nation)/i.test(path);
}

async function inspectRepository(env) {
  const branch = env.GITHUB_BRANCH || "main";
  const [repository, tree] = await Promise.all([
    githubJson(env, ""),
    githubJson(env, `/git/trees/${encodeURIComponent(branch)}?recursive=1`)
  ]);
  const files = (tree.tree || []).filter((item) => item.type === "blob");
  const relevant = files.filter((item) => relevantPath(item.path));
  return {
    repository: repository.full_name,
    defaultBranch: repository.default_branch,
    inspectedBranch: branch,
    totalFiles: files.length,
    relevantFileCount: relevant.length,
    relevantPaths: relevant.slice(0, 80).map((item) => item.path),
    truncated: Boolean(tree.truncated),
    inspectedAt: new Date().toISOString()
  };
}

function buildScopeArtifact(discovery) {
  const hasKnowledgeFiles = discovery.relevantPaths.some((path) => /knowledge/i.test(path));
  const hasProtocolFiles = discovery.relevantPaths.some((path) => /protocol/i.test(path));
  const hasPromptFiles = discovery.relevantPaths.some((path) => /prompt/i.test(path));
  const gaps = [
    !hasKnowledgeFiles && "No clearly named production knowledge-system implementation was discovered.",
    !hasProtocolFiles && "Protocol knowledge assets were not clearly represented in discovered paths.",
    !hasPromptFiles && "Prompt orchestration assets were not clearly represented in discovered paths.",
    "A canonical source hierarchy and retrieval contract must be locked before implementation.",
    "Memory boundaries, evidence requirements, and Founder governance must be explicit."
  ].filter(Boolean);
  const markdown = `# NN-KS-002 Production Scope Package\n\nStatus: Founder review required\n\n## Repository discovery\n\n- Repository: ${discovery.repository}\n- Inspected branch: ${discovery.inspectedBranch}\n- Total files: ${discovery.totalFiles}\n- Relevant files: ${discovery.relevantFileCount}\n- Tree truncated: ${discovery.truncated}\n\n## Live findings\n\n${discovery.relevantPaths.length ? discovery.relevantPaths.map((path) => `- ${path}`).join("\n") : "- No relevant paths were found."}\n\n## Required production scope\n\n1. Canonical Duey knowledge domains and source hierarchy.\n2. Retrieval pipeline with workspace isolation and traceable citations.\n3. Prompt orchestration and role boundaries for Duey, Art, and GPose.\n4. User-memory hierarchy separated from governed product knowledge.\n5. Founder-controlled publishing, versioning, rollback, and audit evidence.\n6. Deterministic acceptance tests for retrieval, safety, and same-input consistency.\n7. Implementation sequence that does not alter protected authentication or security defaults.\n\n## Gaps to resolve\n\n${gaps.map((gap) => `- ${gap}`).join("\n")}\n\n## Approval boundary\n\nApproval authorizes routine NN-KS-002 implementation only within this scope. It does not authorize production publication, destructive changes, authentication changes, secret changes, or expansion of protected authority.\n`;
  return { title: "NN-KS-002 Production Scope Package", markdown, discovery, gaps };
}

async function handleStart(request, env) {
  const store = runtimeStore(env);
  if (!store) return errorResponse(request, 503, "RUNTIME_STORE_REQUIRED", "Durable Founder OS runtime storage is not configured.");
  if (!env.FOUNDER_API_KEY) return errorResponse(request, 503, "FOUNDER_APPROVAL_REQUIRED", "Protected Founder approval signing is not configured.");

  const current = await readState(env);
  if (current.status === "waiting-approval" || current.status === "implementation-ready") {
    return json(request, { workflow: current, persisted: true, replayed: true });
  }

  const startedAt = new Date().toISOString();
  const runId = `run-nn-ks-002-${crypto.randomUUID()}`;
  const discovery = await inspectRepository(env);
  const artifact = buildScopeArtifact(discovery);
  const artifactHash = await sha256(artifact.markdown);
  const approvalToken = await signClaim(env, {
    workflowId: WORKFLOW_ID,
    workspaceId: WORKSPACE_ID,
    artifactHash,
    action: "approve-nn-ks-002-scope",
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  });
  const approval = {
    id: approvalToken,
    title: "Approve NN-KS-002 Production Scope Package",
    meta: "Founder approval required · exact scope artifact hash bound",
    hash: artifactHash
  };
  const state = {
    id: WORKFLOW_ID,
    workspaceId: WORKSPACE_ID,
    stageIndex: 2,
    status: "waiting-approval",
    startedAt,
    updatedAt: new Date().toISOString(),
    output: `Live repository review completed for ${discovery.repository}. Review the exact scope package before implementation begins.`,
    run: {
      id: runId,
      title: "NN-KS-002 · Live Repository Review",
      status: "completed",
      meta: `${discovery.totalFiles} files inspected · ${discovery.relevantFileCount} relevant paths found`
    },
    approvals: [approval],
    evidence: [
      { title: `${runId}:repository`, meta: `${discovery.repository}@${discovery.inspectedBranch} · live GitHub discovery` },
      { title: `${runId}:scope`, meta: `${artifact.title} · ${artifactHash}` },
      { title: `${runId}:persistence`, meta: "Server-owned workflow state stored in Cloudflare runtime storage" }
    ],
    artifact: { ...artifact, hash: artifactHash }
  };
  await writeState(env, state);
  console.log(JSON.stringify({ service: "founder-os-gateway", type: "nn_ks_002_scope_ready", runId, workspaceId: WORKSPACE_ID }));
  return json(request, { workflow: state, persisted: true, productionMutationPerformed: false });
}

async function handleApprove(request, env) {
  const body = await readJson(request);
  const state = await readState(env);
  const claim = await verifyClaim(env, body.approvalToken);
  if (!claim) return errorResponse(request, 403, "INVALID_APPROVAL_BINDING", "The approval token is invalid or unsigned.");
  if (claim.expiresAt < Date.now()) return errorResponse(request, 410, "APPROVAL_EXPIRED", "The scope approval binding has expired.");
  if (claim.workspaceId !== WORKSPACE_ID || claim.workflowId !== WORKFLOW_ID) {
    return errorResponse(request, 403, "WORKSPACE_ACCESS_DENIED", "The approval belongs to another workflow or workspace.");
  }
  if (!body.payloadHash || body.payloadHash !== claim.artifactHash || body.payloadHash !== state.artifact?.hash) {
    return errorResponse(request, 409, "PAYLOAD_HASH_MISMATCH", "The scope artifact no longer matches the approved payload.");
  }
  const approved = {
    ...state,
    stageIndex: 4,
    status: "implementation-ready",
    updatedAt: new Date().toISOString(),
    output: "Exact NN-KS-002 scope approved. Routine implementation may begin within the approved boundaries.",
    approvals: [],
    approval: {
      artifactHash: claim.artifactHash,
      approvedAt: new Date().toISOString(),
      effect: "authorize-routine-nn-ks-002-implementation"
    }
  };
  await writeState(env, approved);
  return json(request, { workflow: approved, persisted: true, productionMutationPerformed: false });
}

export async function handleNnKs002(request, env, pathname) {
  const base = "/api/founder-os/workflows/nn-ks-002";
  if (!pathname.startsWith(base)) return null;
  if (!assertWorkspace(request)) {
    return errorResponse(request, 403, "WORKSPACE_ACCESS_DENIED", "NN-KS-002 requires the exact Natural Nation workspace context.");
  }
  if (request.method === "GET" && pathname === base) {
    return json(request, { workflow: await readState(env), persisted: Boolean(runtimeStore(env)) });
  }
  if (request.method === "POST" && pathname === `${base}/start`) {
    return handleStart(request, env);
  }
  if (request.method === "POST" && pathname === `${base}/approve`) {
    return handleApprove(request, env);
  }
  return errorResponse(request, 404, "WORKFLOW_ROUTE_NOT_FOUND", "The requested NN-KS-002 workflow route does not exist.");
}
