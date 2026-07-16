const INCOMPLETE_PATTERNS = [
  /awaiting (?:required )?input/i,
  /required input.{0,80}(?:was not|wasn't|not provided|missing)/i,
  /please provide/i,
  /cannot (?:perform|proceed|complete|review|implement)/i,
  /unable to (?:perform|proceed|complete|review|implement)/i,
  /once (?:the|this) input is provided/i
];

const ALLOWED_REVIEW_PATHS = new Set([
  "app/frontend/index.html",
  "app/frontend/styles.css",
  "app/frontend/app.js",
  "app/frontend/README.md",
  "app/frontend/tests/validate-foundation.mjs"
]);

function summaryText(result) {
  return typeof result?.summary === "string" ? result.summary.trim() : "";
}

function parseStructuredSummary(result, type) {
  if (result?.structured && typeof result.structured === "object") return result.structured;
  const summary = summaryText(result).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(summary);
    if (parsed?.type !== type) throw new Error(`Expected contract type ${type}.`);
    return parsed;
  } catch (error) {
    throw new Error(`Provider output must be valid ${type} JSON: ${error.message}`);
  }
}

function genericFailure(summary) {
  if (summary.length < 40) return "The provider result is too short to verify as completed work.";
  const matched = INCOMPLETE_PATTERNS.find((pattern) => pattern.test(summary));
  return matched ? "The provider explicitly reported missing input or inability to complete the assigned work." : null;
}

function verifyImplementation(summary) {
  const pullRequest = /https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/pull\/\d+/i.test(summary);
  const testEvidence = /\b(test|tests|tested|validation|validated|ci|workflow)\b/i.test(summary);
  if (!pullRequest) return "Implementation completion requires a verifiable GitHub pull request URL.";
  if (!testEvidence) return "Implementation completion requires test or CI evidence.";
  return null;
}

function verifyExperienceReview(result) {
  let review;
  try {
    review = parseStructuredSummary(result, "experience_review");
  } catch (error) {
    return error.message;
  }

  for (const key of ["summary", "passes", "issues", "mergeBlockers", "recommendation", "evidence"]) {
    if (!(key in review)) return `Experience review is missing required field: ${key}.`;
  }
  if (!Array.isArray(review.passes) || !Array.isArray(review.issues) || !Array.isArray(review.mergeBlockers) || !Array.isArray(review.evidence)) {
    return "Experience review arrays are malformed.";
  }
  if (!["approve", "changes_required"].includes(review.recommendation)) {
    return "Experience review recommendation must be approve or changes_required.";
  }
  if (review.evidence.length === 0) return "Experience review requires file-based evidence.";

  for (const evidence of review.evidence) {
    const path = typeof evidence === "string" ? evidence : evidence?.path;
    const finding = typeof evidence === "string" ? evidence : evidence?.finding;
    if (!ALLOWED_REVIEW_PATHS.has(path)) return `Experience review cited an unapproved path: ${path || "missing path"}.`;
    if (!String(finding || "").trim()) return `Experience review evidence for ${path} is missing a concrete finding.`;
  }

  const serialized = JSON.stringify(review);
  if (/src\/|react|screenshot|simulated|hypothetical/i.test(serialized)) {
    return "Experience review contains invented framework, screenshot, or simulated evidence.";
  }
  return null;
}

function verifyFounderReview(result) {
  let review;
  try {
    review = parseStructuredSummary(result, "founder_review");
  } catch (error) {
    return error.message;
  }

  for (const key of ["decision", "comments", "risks", "nextAction"]) {
    if (!(key in review)) return `Founder review is missing required field: ${key}.`;
  }
  if (!["approve", "request_changes", "reject"].includes(review.decision)) {
    return "Founder review decision must be approve, request_changes, or reject.";
  }
  if (!Array.isArray(review.comments) || !Array.isArray(review.risks) || !String(review.nextAction || "").trim()) {
    return "Founder review must include populated comments, risks, and nextAction fields.";
  }
  return null;
}

export function verifyTaskResult(task, result) {
  const summary = summaryText(result);

  // Structured contracts must be parsed and validated before any narrative heuristics.
  // Words such as "placeholder" or "incomplete" can be legitimate findings inside a review.
  if (task.id === "AI-TASK-003") {
    const reason = verifyExperienceReview(result);
    return reason ? { ok: false, reason } : { ok: true };
  }
  if (task.id === "AI-TASK-004") {
    const reason = verifyFounderReview(result);
    return reason ? { ok: false, reason } : { ok: true };
  }

  const generalFailure = genericFailure(summary);
  if (generalFailure) return { ok: false, reason: generalFailure };

  let reason = null;
  if (task.id === "AI-TASK-002") reason = verifyImplementation(summary);
  return reason ? { ok: false, reason } : { ok: true };
}
