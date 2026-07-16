const INCOMPLETE_PATTERNS = [
  /awaiting (?:required )?input/i,
  /required input.{0,80}(?:was not|wasn't|not provided|missing)/i,
  /please provide/i,
  /cannot (?:perform|proceed|complete|review|implement)/i,
  /unable to (?:perform|proceed|complete|review|implement)/i,
  /placeholder/i,
  /simulated (?:pull request|implementation|result)/i,
  /once (?:the|this) input is provided/i
];

function summaryText(result) {
  return typeof result?.summary === "string" ? result.summary.trim() : "";
}

function genericFailure(summary) {
  if (summary.length < 80) return "The provider result is too short to verify as completed work.";
  const matched = INCOMPLETE_PATTERNS.find((pattern) => pattern.test(summary));
  return matched ? "The provider explicitly reported missing input, incomplete work, a placeholder, or a simulated result." : null;
}

function verifyImplementation(summary) {
  const pullRequest = /https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/pull\/\d+/i.test(summary);
  const testEvidence = /\b(test|tests|tested|validation|validated|ci|workflow)\b/i.test(summary);
  if (!pullRequest) return "Implementation completion requires a verifiable GitHub pull request URL.";
  if (!testEvidence) return "Implementation completion requires test or CI evidence.";
  return null;
}

function verifyDesignReview(summary) {
  const reviewEvidence = /\b(usability|responsive|accessibility|visual|interaction|viewport|mobile|tablet|desktop)\b/i.test(summary);
  const findings = /\b(finding|findings|passed|failed|issue|issues|recommendation|recommendations)\b/i.test(summary);
  if (!reviewEvidence || !findings) return "Design review completion requires concrete usability or responsive findings.";
  return null;
}

function verifyFounderSummary(summary) {
  const hasChanges = /what changed|changes? (?:made|implemented)|implementation results?/i.test(summary);
  const hasValidation = /what passed|tests? passed|validated|review findings?/i.test(summary);
  const hasDecision = /needs approval|approval required|recommend(?:ed|ation)/i.test(summary);
  if (!hasChanges || !hasValidation || !hasDecision) {
    return "Founder review completion requires populated change, validation, and approval sections.";
  }
  return null;
}

export function verifyTaskResult(task, result) {
  const summary = summaryText(result);
  const generalFailure = genericFailure(summary);
  if (generalFailure) return { ok: false, reason: generalFailure };

  let reason = null;
  if (task.id === "AI-TASK-002") reason = verifyImplementation(summary);
  if (task.id === "AI-TASK-003") reason = verifyDesignReview(summary);
  if (task.id === "AI-TASK-004") reason = verifyFounderSummary(summary);

  return reason ? { ok: false, reason } : { ok: true };
}
