const INCOMPLETE_PATTERNS = [
  /awaiting (?:required )?input/i,
  /required input.{0,80}(?:was not|wasn't|not provided|missing)/i,
  /please provide/i,
  /cannot (?:perform|proceed|complete|review|implement)/i,
  /unable to (?:perform|proceed|complete|review|implement)/i,
  /once (?:the|this) input is provided/i
];

function summaryText(result) {
  return typeof result?.summary === "string" ? result.summary.trim() : "";
}

function structuredCandidates(summary) {
  const candidates = [];
  for (const match of summary.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) candidates.push(match[1].trim());
  const firstBrace = summary.indexOf("{");
  const lastBrace = summary.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(summary.slice(firstBrace, lastBrace + 1).trim());
  candidates.push(summary.trim());
  return [...new Set(candidates.filter(Boolean))];
}

function parseStructuredSummary(result, type) {
  if (result?.structured && typeof result.structured === "object") {
    if (result.structured.type !== type) throw new Error(`Expected contract type ${type}.`);
    return result.structured;
  }
  const summary = summaryText(result);
  let lastError = null;
  for (const candidate of structuredCandidates(summary)) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed?.type !== type) throw new Error(`Expected contract type ${type}.`);
      return parsed;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Provider output must contain valid ${type} JSON: ${lastError?.message || "no JSON object found"}`);
}

function genericFailure(summary) {
  if (summary.length < 40) return "The provider result is too short to verify as completed work.";
  const matched = INCOMPLETE_PATTERNS.find((pattern) => pattern.test(summary));
  return matched ? "The provider explicitly reported missing input or inability to complete the assigned work." : null;
}

function verifyImplementation(summary) {
  if (!/https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/pull\/\d+/i.test(summary)) return "Implementation completion requires a verifiable GitHub pull request URL.";
  if (!/\b(test|tests|tested|validation|validated|ci|workflow)\b/i.test(summary)) return "Implementation completion requires test or CI evidence.";
  return null;
}

function evidenceMap(result) {
  const entries = result?.evidenceContract?.items;
  if (!Array.isArray(entries)) return new Map();
  return new Map(entries.map((item) => [item.fileId, item]));
}

function verifyExperienceReview(result) {
  let review;
  try { review = parseStructuredSummary(result, "experience_review"); }
  catch (error) { return error.message; }

  for (const key of ["summary", "passes", "issues", "mergeBlockers", "recommendation", "evidence"]) {
    if (!(key in review)) return `Experience review is missing required field: ${key}.`;
  }
  if (!Array.isArray(review.passes) || !Array.isArray(review.issues) || !Array.isArray(review.mergeBlockers) || !Array.isArray(review.evidence)) return "Experience review arrays are malformed.";
  if (!["approve", "changes_required"].includes(review.recommendation)) return "Experience review recommendation must be approve or changes_required.";
  if (review.evidence.length === 0) return "Experience review requires file-based evidence.";

  const allowedEvidence = evidenceMap(result);
  if (allowedEvidence.size === 0) return "Experience review result does not include a valid evidence ID contract.";
  for (const evidence of review.evidence) {
    const fileId = evidence?.fileId;
    const fingerprint = evidence?.fingerprint;
    const finding = evidence?.finding;
    const contracted = allowedEvidence.get(fileId);
    if (!contracted) return `Experience review cited an unknown evidence ID: ${fileId || "missing fileId"}.`;
    if (fingerprint !== contracted.fingerprint) return `Experience review fingerprint mismatch for ${fileId}.`;
    if (!String(finding || "").trim()) return `Experience review evidence for ${fileId} is missing a concrete finding.`;
  }
  if (/screenshot|simulated|hypothetical/i.test(JSON.stringify(review))) return "Experience review contains screenshot or simulated evidence.";
  return null;
}

function verifyFounderReview(result) {
  let review;
  try { review = parseStructuredSummary(result, "founder_review"); }
  catch (error) { return error.message; }
  for (const key of ["decision", "comments", "risks", "nextAction"]) if (!(key in review)) return `Founder review is missing required field: ${key}.`;
  if (!["approve", "request_changes", "reject"].includes(review.decision)) return "Founder review decision must be approve, request_changes, or reject.";
  if (!Array.isArray(review.comments) || review.comments.length === 0 || !Array.isArray(review.risks) || review.risks.length === 0 || !String(review.nextAction || "").trim()) return "Founder review must include populated comments, risks, and nextAction fields.";
  return null;
}

export function verifyTaskResult(task, result) {
  const summary = summaryText(result);
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
  const reason = task.id === "AI-TASK-002" ? verifyImplementation(summary) : null;
  return reason ? { ok: false, reason } : { ok: true };
}
