import {
  commitRepositoryExecutionFiles,
  createRepositoryExecutionBranch,
  openRepositoryExecutionPullRequest,
  readRepositoryExecutionPullRequest
} from "./github.js";
import { structuredLog } from "./structured-log.js";

const ALLOWED_ROOTS = [
  "app/",
  "docs/",
  "knowledge/",
  "resources/",
  "scripts/",
  "services/"
];

// Post-beta policy: routine preparation may be delegated, while these areas
// still require the Founder because they can change access, money, or release behavior.
const SENSITIVE_PATH_PATTERNS = [
  /(^|\/)(auth|authentication|authorization|security|secrets?)([._\/-]|$)/i,
  /(^|\/)(billing|payments?|subscriptions?)([._\/-]|$)/i,
  /(^|\/)(deploy|deployment|release|production)([._\/-]|$)/i,
  /(^|\/)wrangler(?:\.|\/|$)/i
];

const FOUNDER_ONLY_CONSEQUENCES = new Set([
  "major",
  "security-sensitive",
  "destructive",
  "external",
  "production"
]);

// Visual work may be prepared by governed AI, but it must be shown to the
// Founder in desktop and mobile review before the pull request can advance.
const VISUAL_PATH_PATTERNS = [
  /\.(css|scss|sass|less|html?|svg)$/i,
  /(^|\/)(ui|components?|screens?|views?)(\/|$)/i,
  /^app\//i,
  /^docs\/founder-os\/(js|css)\//i
];

function safeSlug(value) {
  return String(value || "task")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "task";
}

function validateFile(file) {
  if (!file || typeof file.path !== "string" || !file.path.trim()) {
    throw new Error("Each repository change must include a file path.");
  }
  if (file.path.startsWith("/") || file.path.includes("..") || file.path.includes("\\")) {
    throw new Error(`Unsafe repository path rejected: ${file.path}`);
  }
  if (!ALLOWED_ROOTS.some((root) => file.path.startsWith(root))) {
    throw new Error(`Repository path is outside approved roots: ${file.path}`);
  }
  if (typeof file.content !== "string") {
    throw new Error(`Repository file content must be UTF-8 text: ${file.path}`);
  }
  return { path: file.path, content: file.content };
}

function validatePlan({ workspaceId, packageId, taskId, plan }) {
  if (workspaceId !== "natural-nation" || packageId !== "NN-BUILD-001") {
    throw new Error("Repository execution is limited to the approved Natural Nation build package.");
  }
  if (taskId !== "AI-TASK-002") {
    throw new Error("Only the approved Codex implementation task may use this adapter.");
  }
  if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
    throw new Error("A repository execution plan must include at least one real file change.");
  }
  if (!plan.title || !plan.summary) {
    throw new Error("The repository execution plan must include a title and summary.");
  }
  return {
    title: String(plan.title).trim(),
    summary: String(plan.summary).trim(),
    files: plan.files.map(validateFile)
  };
}

export function classifyRepositoryPlan({ workspaceId, packageId, taskId, plan }) {
  const approvedPlan = validatePlan({ workspaceId, packageId, taskId, plan });
  const consequence = String(plan.consequence || "routine").trim().toLowerCase();
  const sensitivePaths = approvedPlan.files
    .map((file) => file.path)
    .filter((path) => SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(path)));
  const visualPaths = approvedPlan.files
    .map((file) => file.path)
    .filter((path) => VISUAL_PATH_PATTERNS.some((pattern) => pattern.test(path)));
  const visualReviewRequired = Boolean(plan.visualChange) || visualPaths.length > 0;
  const founderRequired = consequence !== "routine"
    || FOUNDER_ONLY_CONSEQUENCES.has(consequence)
    || sensitivePaths.length > 0;

  return {
    actionId: "github.prepare-pull-request",
    policyMode: "post-beta-lightweight",
    consequence,
    approvalClass: founderRequired ? "founder-required" : "delegated-routine",
    founderRequired,
    sensitivePaths,
    visualPaths,
    visualReviewRequired,
    visualReviewEvidence: visualReviewRequired ? ["desktop", "mobile"] : [],
    allowedActions: ["branch:create", "commit:create", "pull-request:create"],
    founderOnlyActions: ["pull-request:merge", "deployment:production", "release:publish", "repository:delete"]
  };
}

export async function executeRepositoryPlan({ env, workspaceId, packageId, taskId, plan, actor }) {
  const approvedPlan = validatePlan({ workspaceId, packageId, taskId, plan });
  const governance = classifyRepositoryPlan({ workspaceId, packageId, taskId, plan });
  if (governance.founderRequired && actor?.role !== "founder" && actor?.id !== "founder") {
    const error = new Error("This repository plan affects a consequential or sensitive area and requires Founder approval.");
    error.status = 403;
    throw error;
  }
  const branch = `codex/${safeSlug(taskId)}-${crypto.randomUUID().slice(0, 8)}`;

  structuredLog("repository_execution.started", {
    workspaceId,
    packageId,
    taskId,
    requestedBy: actor.id,
    approvalClass: governance.approvalClass,
    branch,
    changedFiles: approvedPlan.files.map((file) => file.path)
  });

  const branchRecord = await createRepositoryExecutionBranch(env, branch);
  const commit = await commitRepositoryExecutionFiles(env, {
    branch,
    message: `codex: implement ${taskId}`,
    files: approvedPlan.files
  });
  const pullRequest = await openRepositoryExecutionPullRequest(env, {
    branch,
    title: approvedPlan.title,
    body: [
      `## Canonical task`,
      `- Workspace: \`${workspaceId}\``,
      `- Package: \`${packageId}\``,
      `- Task: \`${taskId}\``,
      `- Requested by: \`${actor.id}\``,
      `- Action class: \`${governance.approvalClass}\``,
      `- Consequence: \`${governance.consequence}\``,
      `- Founder visual review required: \`${governance.visualReviewRequired ? "yes" : "no"}\``,
      "",
      "## Implementation summary",
      approvedPlan.summary,
      "",
      "## Verification",
      "- Real repository branch created",
      "- Real commit recorded",
      "- CI must pass before Founder approval",
      ...(governance.visualReviewRequired ? ["- Desktop and mobile visual evidence must be presented for Founder approval"] : []),
      "- Merge and deployment remain Founder-controlled"
    ].join("\n")
  });
  const evidence = await readRepositoryExecutionPullRequest(env, pullRequest.number);

  if (!evidence.url || !evidence.headSha || evidence.changedFiles.length === 0) {
    throw new Error("GitHub did not return complete pull request evidence.");
  }

  structuredLog("repository_execution.pull_request_created", {
    workspaceId,
    packageId,
    taskId,
    requestedBy: actor.id,
    approvalClass: governance.approvalClass,
    pullRequestNumber: evidence.number,
    pullRequestUrl: evidence.url,
    branch: evidence.branch,
    headSha: evidence.headSha,
    changedFiles: evidence.changedFiles
  });

  return {
    executionVersion: "1.1.0",
    workspaceId,
    packageId,
    taskId,
    requestedBy: actor.id,
    governance,
    branch: branchRecord,
    commit,
    pullRequest: evidence,
    verification: {
      realBranch: true,
      realCommit: true,
      realPullRequest: true,
      changedFilesRecorded: true,
      founderMergeRequired: true,
      founderVisualReviewRequired: governance.visualReviewRequired,
      productionDeploymentAuthorized: false
    }
  };
}
