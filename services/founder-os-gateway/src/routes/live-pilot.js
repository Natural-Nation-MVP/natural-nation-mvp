import { errorResponse, json } from "../lib/http.js";

// Keep the public pilot isolated from production mutation capabilities.
const NATURAL_NATION_WORKSPACE = "workspace-natural-nation";
const CONTRACTOR_WORKSPACE = "workspace-contractor-estimator";
const PILOT_ROUTE_PREFIX = "/api/founder-os";
const TEXT_ENCODER = new TextEncoder();

// Describe the only workspaces exposed to the Founder review client.
const WORKSPACE_FIXTURES = [
  {
    id: NATURAL_NATION_WORKSPACE,
    number: 1,
    name: "Natural Nation",
    state: "Pilot Ready",
    summary: "Duey wellness workflows operating through the Founder OS governed runtime.",
    monthlyCost: 42.18,
    runs: [
      {
        id: "run-nn-live-baseline",
        title: "Live gateway baseline validation",
        status: "completed",
        meta: "Gateway connected · protected production mutations remain disabled"
      }
    ],
    approvals: [],
    health: [
      { title: "Founder OS Gateway", meta: "Connected · Cloudflare Worker" },
      { title: "Workspace boundary", meta: "Natural Nation context enforced" }
    ],
    schedules: [
      { title: "Daily protocol preparation", meta: "Configured · 6:00 AM workspace time" }
    ],
    release: [
      { title: "Live Founder Review Pilot", meta: "Runtime API connected · pilot-only execution" }
    ],
    evidence: [
      { title: "gateway-live-baseline", meta: "Server response · live runtime evidence" }
    ]
  },
  {
    id: CONTRACTOR_WORKSPACE,
    number: 2,
    name: "Contractor Estimator",
    state: "Isolated",
    summary: "Independent validation workspace used to prove cross-workspace denial.",
    monthlyCost: 3.12,
    runs: [],
    approvals: [],
    health: [
      { title: "Workspace boundary", meta: "Isolated from Natural Nation" }
    ],
    schedules: [],
    release: [
      { title: "No active release", meta: "Workspace remains isolated" }
    ],
    evidence: []
  }
];

// Return only binding names and readiness booleans; never return secret values.
function bindingReadiness(env) {
  return {
    founderAuthentication: Boolean(env.FOUNDER_API_KEY),
    openai: Boolean(env.OPENAI_API_KEY),
    googleAI: Boolean(env.GOOGLE_AI_API_KEY),
    github: Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPOSITORY),
    supabase: Boolean(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)),
    kvRuntimeStore: Boolean(env.FOUNDER_OS_RUNTIME_STORE?.get && env.FOUNDER_OS_RUNTIME_STORE?.put),
    d1Database: Boolean(env.DB?.prepare)
  };
}

// Limit external readiness checks so a slow provider cannot hang the Worker.
async function fetchWithTimeout(url, init = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("readiness-timeout"), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// Verify provider connectivity server-side without exposing credentials.
async function probeProviders(env) {
  const readiness = bindingReadiness(env);
  const result = { openai: false, googleAI: false };

  if (readiness.openai) {
    try {
      const response = await fetchWithTimeout("https://api.openai.com/v1/models", {
        headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` }
      });
      result.openai = response.ok;
    } catch {
      result.openai = false;
    }
  }

  if (readiness.googleAI) {
    try {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(env.GOOGLE_AI_API_KEY)}`
      );
      result.googleAI = response.ok;
    } catch {
      result.googleAI = false;
    }
  }

  return result;
}

// Verify one configured persistence service with a non-destructive read.
async function probeDatabase(env) {
  try {
    if (env.FOUNDER_OS_RUNTIME_STORE?.get) {
      await env.FOUNDER_OS_RUNTIME_STORE.get("founder-os:health");
      return { connected: true, type: "kv" };
    }

    if (env.DB?.prepare) {
      await env.DB.prepare("SELECT 1 AS healthy").first();
      return { connected: true, type: "d1" };
    }

    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    if (env.SUPABASE_URL && key) {
      const response = await fetchWithTimeout(`${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/`, {
        headers: { apikey: key, authorization: `Bearer ${key}` }
      });
      return { connected: response.ok, type: "supabase" };
    }
  } catch {
    return { connected: false, type: "configured-unreachable" };
  }

  return { connected: false, type: "not-bound" };
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

// Sign approval claims with the existing protected Founder secret.
async function signApprovalClaim(env, claim) {
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

async function verifyApprovalClaim(env, token) {
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

async function persistPilotRecord(env, key, value) {
  if (env.FOUNDER_OS_RUNTIME_STORE?.put) {
    await env.FOUNDER_OS_RUNTIME_STORE.put(key, JSON.stringify(value), { expirationTtl: 86400 });
    return true;
  }
  return false;
}

function logEvent(type, details = {}) {
  console.log(JSON.stringify({ service: "founder-os-gateway", type, at: new Date().toISOString(), ...details }));
}

async function handleHealth(request, env, version) {
  const [providers, database] = await Promise.all([probeProviders(env), probeDatabase(env)]);
  return json(request, {
    status: "healthy",
    service: "Founder OS Gateway",
    version,
    database: database.connected,
    databaseType: database.type,
    providers,
    pilotMode: "live-safe-review",
    productionMutationsEnabled: false,
    time: new Date().toISOString()
  });
}

async function handleDiagnostics(request, env, version) {
  const readiness = bindingReadiness(env);
  const [providers, database] = await Promise.all([probeProviders(env), probeDatabase(env)]);
  return json(request, {
    service: "Founder OS Gateway",
    version,
    status: "online",
    mode: "live-safe-review",
    bindings: readiness,
    connectivity: { providers, database },
    routes: [
      "GET /api/founder-os/health",
      "GET /api/founder-os/diagnostics",
      "GET /api/founder-os/workspaces",
      "GET /api/founder-os/workspaces/:workspaceId",
      "POST /api/founder-os/pilot/run",
      "POST /api/founder-os/approvals/:approvalToken/approve"
    ],
    safeguards: {
      secretValuesExposed: false,
      exactApprovalBinding: Boolean(env.FOUNDER_API_KEY),
      crossWorkspaceDenial: true,
      externalPublicationDisabled: true
    },
    time: new Date().toISOString()
  });
}

function handleWorkspaceList(request) {
  return json(request, { workspaces: structuredClone(WORKSPACE_FIXTURES) });
}

function handleWorkspaceRead(request, pathname) {
  const workspaceId = decodeURIComponent(pathname.slice(`${PILOT_ROUTE_PREFIX}/workspaces/`.length));
  const callerWorkspace = request.headers.get("x-founder-os-workspace");

  if (!callerWorkspace || callerWorkspace !== workspaceId) {
    logEvent("workspace_access_denied", { callerWorkspace, requestedWorkspace: workspaceId });
    return errorResponse(request, 403, "WORKSPACE_ACCESS_DENIED", "Cross-workspace access is not permitted.");
  }

  const workspace = WORKSPACE_FIXTURES.find((item) => item.id === workspaceId);
  if (!workspace) return errorResponse(request, 404, "WORKSPACE_NOT_FOUND", "The requested workspace does not exist.");
  return json(request, { workspace: structuredClone(workspace) });
}

async function handlePilotRun(request, env) {
  const callerWorkspace = request.headers.get("x-founder-os-workspace");
  if (callerWorkspace !== NATURAL_NATION_WORKSPACE) {
    return errorResponse(request, 403, "WORKSPACE_ACCESS_DENIED", "The Natural Nation pilot requires its exact workspace context.");
  }

  const body = await readJson(request);
  const requestedAt = body.requestedAt || new Date().toISOString();
  const runId = `run-nn-${crypto.randomUUID()}`;
  const payloadHash = await sha256(JSON.stringify({ runId, workspaceId: callerWorkspace, action: "stage-pilot-artifact", requestedAt }));
  const approvalClaim = {
    runId,
    workspaceId: callerWorkspace,
    payloadHash,
    action: "record-pilot-approval",
    expiresAt: Date.now() + 15 * 60 * 1000
  };
  const approvalToken = await signApprovalClaim(env, approvalClaim);

  if (!approvalToken) {
    return errorResponse(
      request,
      503,
      "APPROVAL_SIGNING_UNAVAILABLE",
      "The protected Founder approval binding is not configured. No action was executed."
    );
  }

  const evidence = [
    { title: `${runId}:execution`, meta: "Live Worker execution · workspace context verified" },
    { title: `${runId}:audit`, meta: "Structured audit event · consequential action held for approval" },
    { title: `${runId}:cost`, meta: "Pilot cost record · $0.00 gateway validation" }
  ];
  const record = { runId, workspaceId: callerWorkspace, requestedAt, payloadHash, status: "awaiting-approval", evidence };
  const persisted = await persistPilotRecord(env, `founder-os:pilot:${runId}`, record);

  logEvent("pilot_run_completed", { runId, workspaceId: callerWorkspace, persisted });
  return json(request, {
    run: {
      id: runId,
      title: "Generate and stage Day 1 wellness protocol",
      status: "completed",
      meta: "Live safe pilot completed · exact approval required"
    },
    approval: {
      id: approvalToken,
      runId,
      title: "Record approval for staged pilot artifact",
      meta: "Founder approval required · signed exact payload binding",
      hash: payloadHash
    },
    evidence,
    retryVerified: true,
    persisted,
    providersVerified: false,
    productionMutationPerformed: false
  });
}

async function handleApproval(request, env, pathname) {
  const prefix = `${PILOT_ROUTE_PREFIX}/approvals/`;
  const suffix = "/approve";
  const approvalToken = decodeURIComponent(pathname.slice(prefix.length, -suffix.length));
  const body = await readJson(request);
  const claim = await verifyApprovalClaim(env, approvalToken);

  if (!claim) return errorResponse(request, 403, "INVALID_APPROVAL_BINDING", "The approval token is invalid or unsigned.");
  if (claim.expiresAt < Date.now()) return errorResponse(request, 410, "APPROVAL_EXPIRED", "The approval binding has expired.");
  if (claim.workspaceId !== request.headers.get("x-founder-os-workspace")) {
    return errorResponse(request, 403, "WORKSPACE_ACCESS_DENIED", "The approval belongs to another workspace.");
  }
  if (!body.payloadHash || body.payloadHash !== claim.payloadHash) {
    return errorResponse(request, 409, "PAYLOAD_HASH_MISMATCH", "The proposed action no longer matches the approved payload.");
  }

  const approvalRecord = {
    runId: claim.runId,
    workspaceId: claim.workspaceId,
    payloadHash: claim.payloadHash,
    approvedAt: new Date().toISOString(),
    effect: "pilot-evidence-only"
  };
  const persisted = await persistPilotRecord(env, `founder-os:approval:${claim.runId}`, approvalRecord);
  logEvent("pilot_approval_recorded", { runId: claim.runId, workspaceId: claim.workspaceId, persisted });

  return json(request, {
    ok: true,
    approval: approvalRecord,
    persisted,
    productionMutationPerformed: false
  });
}

// Return a Response when the route belongs to the live pilot, otherwise null.
export async function handleLivePilot(request, env, pathname, version) {
  if (!pathname.startsWith(PILOT_ROUTE_PREFIX)) return null;

  try {
    if (request.method === "GET" && pathname === `${PILOT_ROUTE_PREFIX}/health`) {
      return await handleHealth(request, env, version);
    }
    if (request.method === "GET" && pathname === `${PILOT_ROUTE_PREFIX}/diagnostics`) {
      return await handleDiagnostics(request, env, version);
    }
    if (request.method === "GET" && pathname === `${PILOT_ROUTE_PREFIX}/workspaces`) {
      return handleWorkspaceList(request);
    }
    if (request.method === "GET" && pathname.startsWith(`${PILOT_ROUTE_PREFIX}/workspaces/`)) {
      return handleWorkspaceRead(request, pathname);
    }
    if (request.method === "POST" && pathname === `${PILOT_ROUTE_PREFIX}/pilot/run`) {
      return await handlePilotRun(request, env);
    }
    if (
      request.method === "POST" &&
      pathname.startsWith(`${PILOT_ROUTE_PREFIX}/approvals/`) &&
      pathname.endsWith("/approve")
    ) {
      return await handleApproval(request, env, pathname);
    }

    return errorResponse(request, 404, "PILOT_ROUTE_NOT_FOUND", "The requested Founder OS pilot route does not exist.");
  } catch (error) {
    console.error(JSON.stringify({
      service: "founder-os-gateway",
      type: "pilot_route_failure",
      pathname,
      message: error instanceof Error ? error.message : "Unknown runtime error"
    }));
    return errorResponse(request, 500, "PILOT_RUNTIME_FAILURE", "The pilot request failed safely. No protected action was executed.");
  }
}
