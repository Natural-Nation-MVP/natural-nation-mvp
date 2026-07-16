import { executeRepositoryPlan } from "./repository-execution.js";

function stripCodeFence(value) {
  return String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parsePlan(summary) {
  let plan;
  try {
    plan = JSON.parse(stripCodeFence(summary));
  } catch {
    throw new Error("Codex must return the repository execution plan as JSON, not a narrative response.");
  }

  if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
    throw new Error("Codex returned no real repository file changes.");
  }
  return plan;
}

export async function executeCodexRepositoryResult({ env, workspaceId, packageId, taskId, result, actor }) {
  if (taskId !== "AI-TASK-002") return result;

  const plan = parsePlan(result.summary);
  const execution = await executeRepositoryPlan({
    env,
    workspaceId,
    packageId,
    taskId,
    plan,
    actor
  });

  const pullRequestUrl = execution.pullRequest.url;
  const changedFiles = execution.pullRequest.changedFiles || [];
  const testFiles = changedFiles.filter((path) => /(?:test|spec|validation)/i.test(path));

  return {
    ...result,
    summary: [
      `Implementation created through the protected repository-execution adapter.`,
      `GitHub pull request: ${pullRequestUrl}`,
      `Changed files: ${changedFiles.join(", ")}`,
      testFiles.length
        ? `Test evidence included in: ${testFiles.join(", ")}. CI must pass before Founder merge approval.`
        : `Validation evidence: the pull request records a real branch and commit; CI must pass before Founder merge approval.`
    ].join("\n"),
    pullRequestUrl,
    repositoryEvidence: {
      pullRequestUrl,
      pullRequestNumber: execution.pullRequest.number,
      branch: execution.pullRequest.branch,
      headSha: execution.pullRequest.headSha,
      changedFiles,
      testFiles,
      ciRequiredBeforeMerge: true
    },
    repositoryExecution: execution
  };
}
