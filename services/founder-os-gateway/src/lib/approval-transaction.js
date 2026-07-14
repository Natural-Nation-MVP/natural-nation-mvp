import {
  commitFilesAtomically,
  findRepositoryCommitForPath,
  readRepositoryJson,
  repositoryFileExists
} from "./github.js";

const BLUEPRINT_PATH = "docs/founder-os/config/natural-nation-blueprint.json";
const WORKSPACE_REGISTRY_PATH = "docs/founder-os/config/workspace-registry.json";

function safeSegment(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function shortHash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function updateWorkspaceRegistry(registry, timestamp) {
  const next = structuredClone(registry);
  const workspace = next.workspaces.find((item) => item.id === "natural-nation");

  if (!workspace) {
    throw new Error("Natural Nation workspace is missing from the canonical registry.");
  }

  workspace.stage = "Build Ready";
  workspace.health = "Blueprint approved";
  workspace.progress = Math.max(Number(workspace.progress || 0), 52);
  workspace.lastActivity = timestamp;
  workspace.pendingApprovals = Math.max(Number(workspace.pendingApprovals || 0) - 1, 0);
  workspace.nextAction = "Open Build Studio";
  workspace.resumeWorkspace = "build";
  workspace.activePackageId = "NN-BUILD-001";

  next.commandCenterMetrics.approvalsWaiting = Math.max(
    Number(next.commandCenterMetrics.approvalsWaiting || 0) - 1,
    0
  );
  next.commandCenterMetrics.blockedItems = 0;

  return next;
}

function updateBlueprint(blueprint, body, transactionId, timestamp) {
  return {
    ...blueprint,
    status: "Approved",
    locked: true,
    approvedAt: timestamp,
    approvalTransactionId: transactionId,
    decisionResolutions: body.decisionResolutions,
    openDecisions: [],
    snapshot: {
      ...blueprint.snapshot,
      openDecisions: 0
    }
  };
}

async function prepareApprovalTransaction({ env, body, actor }) {
  const transactionHash = await shortHash(body.clientRequestId);
  const transactionId = `TX-NN-BP-${transactionHash.toUpperCase()}`;
  const transactionPath = `docs/transactions/${transactionId}.json`;

  if (await repositoryFileExists(env, transactionPath)) {
    const existing = await readRepositoryJson(env, transactionPath);
    const repository = await findRepositoryCommitForPath(env, transactionPath);
    return {
      duplicate: true,
      transaction: {
        ...existing.content,
        repository
      }
    };
  }

  const [blueprintFile, registryFile] = await Promise.all([
    readRepositoryJson(env, BLUEPRINT_PATH),
    readRepositoryJson(env, WORKSPACE_REGISTRY_PATH)
  ]);

  const blueprint = blueprintFile.content;
  if (blueprint.workspaceId !== body.workspaceId) {
    throw new Error("Canonical Blueprint workspace does not match the approval request.");
  }
  if (blueprint.blueprintVersion !== body.blueprintVersion) {
    throw new Error("Canonical Blueprint version does not match the approval request.");
  }
  if (blueprint.locked === true || blueprint.status === "Approved") {
    throw new Error("This Blueprint version is already approved and locked.");
  }

  const timestamp = new Date().toISOString();
  const approvalPath = `docs/approvals/workspaces/natural-nation/blueprints/${safeSegment(body.blueprintVersion)}.json`;
  const auditPath = `docs/audit/${timestamp.slice(0, 4)}/${transactionId}.json`;
  const packagePath = "docs/execution-packages/NN-BUILD-001.json";

  const approvalRecord = {
    approvalId: `APR-${transactionHash.toUpperCase()}`,
    transactionId,
    type: "blueprint-approval",
    workspaceId: body.workspaceId,
    blueprintVersion: body.blueprintVersion,
    actor,
    decisionResolutions: body.decisionResolutions,
    approvedAt: timestamp,
    status: "approved"
  };

  const auditEvent = {
    eventId: `AUD-${transactionHash.toUpperCase()}`,
    transactionId,
    eventType: "blueprint.approved",
    workspaceId: body.workspaceId,
    blueprintVersion: body.blueprintVersion,
    actor,
    occurredAt: timestamp,
    source: "founder-os-gateway",
    clientRequestId: body.clientRequestId
  };

  const executionPackage = {
    packageId: "NN-BUILD-001",
    sourceTransactionId: transactionId,
    workspaceId: body.workspaceId,
    blueprintVersion: body.blueprintVersion,
    title: "Natural Nation Blueprint Implementation",
    objective: "Implement the Founder-approved Natural Nation Workspace Blueprint.",
    repositoryTarget: `${env.GITHUB_OWNER}/${env.GITHUB_REPOSITORY}`,
    assignedTo: "Codex",
    architectureReview: "Art",
    designReview: "Gemini",
    finalApproval: "Founder",
    status: "ready",
    createdAt: timestamp,
    acceptanceCriteria: [
      "Implementation follows the approved Blueprint.",
      "Protected changes remain traceable to this package.",
      "Validation results are recorded before completion."
    ],
    validationChecklist: [
      "Repository changes match approved scope.",
      "Required documentation is synchronized.",
      "Workspace state reflects verified implementation status."
    ],
    rollbackGuidance: "Revert the implementation commit and restore the prior workspace state if validation fails."
  };

  const transaction = {
    transactionId,
    type: "blueprint-approval",
    workspaceId: body.workspaceId,
    blueprintVersion: body.blueprintVersion,
    status: "committed",
    actor,
    clientRequestId: body.clientRequestId,
    createdAt: timestamp,
    committedAt: timestamp,
    executionPackageId: "NN-BUILD-001"
  };

  const files = [
    { path: approvalPath, content: approvalRecord },
    { path: auditPath, content: auditEvent },
    { path: packagePath, content: executionPackage },
    { path: transactionPath, content: transaction },
    { path: BLUEPRINT_PATH, content: updateBlueprint(blueprint, body, transactionId, timestamp) },
    { path: WORKSPACE_REGISTRY_PATH, content: updateWorkspaceRegistry(registryFile.content, timestamp) }
  ];

  return {
    duplicate: false,
    transaction,
    files,
    verification: {
      githubAccess: true,
      blueprintReadable: true,
      workspaceRegistryReadable: true,
      blueprintVersionMatches: true,
      blueprintUnlocked: true,
      plannedFileCount: files.length
    }
  };
}

export async function dryRunApprovalTransaction({ env, body, actor }) {
  const prepared = await prepareApprovalTransaction({ env, body, actor });

  if (prepared.duplicate) {
    return prepared;
  }

  return {
    duplicate: false,
    transaction: {
      ...prepared.transaction,
      status: "dry-run-passed",
      committedAt: null
    },
    verification: prepared.verification,
    plannedWrites: prepared.files.map((file) => file.path)
  };
}

export async function executeApprovalTransaction({ env, body, actor }) {
  const prepared = await prepareApprovalTransaction({ env, body, actor });

  if (prepared.duplicate) {
    return prepared;
  }

  const result = await commitFilesAtomically(env, {
    message: `approve: Natural Nation Blueprint ${body.blueprintVersion}`,
    files: prepared.files
  });

  return {
    duplicate: false,
    transaction: {
      ...prepared.transaction,
      repository: {
        synchronized: true,
        commitSha: result.commitSha,
        commitUrl: result.commitUrl,
        branch: result.branch
      }
    }
  };
}
