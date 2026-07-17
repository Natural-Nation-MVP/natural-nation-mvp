function objectSchema(properties, required, { strict = false } = {}) {
  return {
    type: "object",
    properties,
    required,
    ...(strict ? { additionalProperties: false } : {})
  };
}

function stringArray() {
  return { type: "array", items: { type: "string" } };
}

function repositoryPlanSchema({ strict = false } = {}) {
  const file = objectSchema({
    path: { type: "string", minLength: 1 },
    content: { type: "string", minLength: 1 }
  }, ["path", "content"], { strict });

  return objectSchema({
    title: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
    files: { type: "array", minItems: 1, items: file }
  }, ["title", "summary", "files"], { strict });
}

function evidenceItems(dispatch) {
  const items = dispatch?.requiredInput?.pullRequestEvidence?.files;
  return Array.isArray(items)
    ? items.filter((item) => item?.fileId && item?.fingerprint)
    : [];
}

function experienceReviewSchema(dispatch, { strict = false } = {}) {
  const evidenceItemsForTask = evidenceItems(dispatch);
  const fileIds = evidenceItemsForTask.map((item) => item.fileId);
  const fingerprints = evidenceItemsForTask.map((item) => item.fingerprint);

  const evidence = objectSchema({
    fileId: fileIds.length
      ? { type: "string", enum: fileIds }
      : { type: "string", pattern: "^FILE-[0-9]{3}$" },
    fingerprint: fingerprints.length
      ? { type: "string", enum: fingerprints }
      : { type: "string", minLength: 16 },
    finding: { type: "string", minLength: 1 }
  }, ["fileId", "fingerprint", "finding"], { strict });

  return objectSchema({
    type: { type: "string", enum: ["experience_review"] },
    summary: { type: "string", minLength: 1 },
    passes: stringArray(),
    issues: stringArray(),
    mergeBlockers: stringArray(),
    recommendation: { type: "string", enum: ["approve", "changes_required"] },
    evidence: { type: "array", minItems: 1, items: evidence }
  }, ["type", "summary", "passes", "issues", "mergeBlockers", "recommendation", "evidence"], { strict });
}

function founderReviewSchema({ strict = false } = {}) {
  return objectSchema({
    type: { type: "string", enum: ["founder_review"] },
    decision: { type: "string", enum: ["approve", "request_changes", "reject"] },
    comments: { type: "array", minItems: 1, items: { type: "string" } },
    risks: { type: "array", minItems: 1, items: { type: "string" } },
    nextAction: { type: "string", minLength: 1 }
  }, ["type", "decision", "comments", "risks", "nextAction"], { strict });
}

const CONTRACTS = {
  "AI-TASK-002": {
    name: "repository_execution_plan",
    instruction: "Return only the repository execution plan JSON object. Do not add markdown fences or commentary.",
    schema: (_dispatch, options) => repositoryPlanSchema(options)
  },
  "AI-TASK-003": {
    name: "experience_review",
    instruction: "Return only the experience_review JSON object. Cite supplied evidence by fileId and echo its fingerprint exactly. Never return repository paths in evidence. Use camelCase field names exactly as defined. Do not add markdown fences, prose, snake_case aliases, or full file contents.",
    schema: (dispatch, options) => experienceReviewSchema(dispatch, options)
  },
  "AI-TASK-004": {
    name: "founder_review",
    instruction: "Return only the founder_review JSON object. Use field names exactly as defined. Do not add markdown fences or commentary.",
    schema: (_dispatch, options) => founderReviewSchema(options)
  }
};

export function providerContract(dispatch, { strict = false } = {}) {
  const contract = CONTRACTS[dispatch?.taskId];
  if (!contract) return null;
  return {
    name: contract.name,
    instruction: contract.instruction,
    schema: contract.schema(dispatch, { strict })
  };
}

export function parseStructuredProviderOutput(text, contractName) {
  const source = String(text || "").trim();
  const candidates = [];
  for (const match of source.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) candidates.push(match[1].trim());
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(source.slice(first, last + 1));
  candidates.push(source);

  let lastError = null;
  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    try {
      const parsed = JSON.parse(candidate);
      if (contractName === "experience_review" && parsed.type !== "experience_review") throw new Error("Missing experience_review type discriminator.");
      if (contractName === "founder_review" && parsed.type !== "founder_review") throw new Error("Missing founder_review type discriminator.");
      return parsed;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Provider returned invalid ${contractName} JSON: ${lastError?.message || "no JSON object found"}`);
}
