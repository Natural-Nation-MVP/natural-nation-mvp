const FAILOVER_CATEGORIES = new Set([
  "BILLING_NOT_ENABLED",
  "CONNECTION_ERROR",
  "PROVIDER_UNAVAILABLE",
  "QUOTA_EXCEEDED",
  "RATE_LIMITED",
  "TIMEOUT"
]);

class ProviderExecutionError extends Error {
  constructor(message, { category = "PROVIDER_UNAVAILABLE", code = null, httpStatus = null } = {}) {
    super(message);
    this.name = "ProviderExecutionError";
    this.category = category;
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function roleSnapshot(agent) {
  return {
    id: agent.id,
    name: agent.name || agent.id,
    role: agent.role || "Assigned AI role",
    purpose: agent.purpose || null,
    allowedActions: agent.allowedActions || [],
    requiresFounderApprovalFor: agent.requiresFounderApprovalFor || []
  };
}

function buildProviderPrompt(agent, dispatch, { executingProvider, temporaryRoleAssumption }) {
  const role = roleSnapshot(agent);

  return [
    `You are the ${executingProvider} provider temporarily executing the Founder OS role "${role.name}" (${role.role}).`,
    temporaryRoleAssumption
      ? `This is a temporary role assumption because the preferred provider could not complete the request.`
      : `You are the preferred provider for this request.`,
    "",
    "For this request, fully step into the assigned role. Preserve its identity, responsibilities, standards, and boundaries.",
    "When the request is complete, the temporary role assumption ends. Do not claim permanent ownership of the role.",
    "",
    `Assigned role ID: ${role.id}`,
    `Assigned role name: ${role.name}`,
    `Assigned role title: ${role.role}`,
    `Role purpose: ${role.purpose || "Complete the assigned task faithfully."}`,
    `Allowed actions: ${role.allowedActions.length ? role.allowedActions.join(", ") : "Complete the assigned task only."}`,
    `Founder approval required for: ${role.requiresFounderApprovalFor.length ? role.requiresFounderApprovalFor.join(", ") : "None specified."}`,
    "",
    "Complete the following Founder OS task.",
    "",
    `Task ID: ${dispatch.taskId}`,
    `Workspace ID: ${dispatch.workspaceId}`,
    `Package ID: ${dispatch.packageId}`,
    "",
    "Required input:",
    typeof dispatch.requiredInput === "string"
      ? dispatch.requiredInput
      : JSON.stringify(dispatch.requiredInput, null, 2),
    "",
    "Expected output:",
    typeof dispatch.expectedOutput === "string"
      ? dispatch.expectedOutput
      : JSON.stringify(dispatch.expectedOutput, null, 2),
    "",
    `Next role: ${dispatch.nextRole || "founder"}`,
    "",
    dispatch.taskId === "AI-TASK-002"
      ? "Return only the repository plan object required by the structured output schema. Do not add markdown fences, commentary, or explanatory text."
      : "Return a clear, complete result suitable for recording in the canonical repository."
  ].join("\n");
}

function repositoryPlanSchema({ strict = false } = {}) {
  const fileSchema = {
    type: "object",
    required: ["path", "content"],
    properties: {
      path: { type: "string", minLength: 1 },
      content: { type: "string", minLength: 1 }
    }
  };

  const schema = {
    type: "object",
    required: ["title", "summary", "files"],
    properties: {
      title: { type: "string", minLength: 1 },
      summary: { type: "string", minLength: 1 },
      files: {
        type: "array",
        minItems: 1,
        items: fileSchema
      }
    }
  };

  if (strict) {
    schema.additionalProperties = false;
    fileSchema.additionalProperties = false;
  }

  return schema;
}

function structuredOutputRequested(dispatch) {
  return dispatch?.taskId === "AI-TASK-002";
}

async function readProviderResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function classifyProviderError(providerId, response, data) {
  const code = data?.error?.code || data?.error?.status || null;
  const message = data?.error?.message || data?.message || `${providerId} request failed with status ${response.status}.`;
  const normalized = `${code || ""} ${message}`.toLowerCase();

  if (normalized.includes("insufficient_quota") || normalized.includes("quota") || normalized.includes("billing")) {
    return new ProviderExecutionError(message, {
      category: normalized.includes("billing") ? "BILLING_NOT_ENABLED" : "QUOTA_EXCEEDED",
      code,
      httpStatus: response.status
    });
  }
  if (response.status === 429 || normalized.includes("rate limit")) {
    return new ProviderExecutionError(message, { category: "RATE_LIMITED", code, httpStatus: response.status });
  }
  if (response.status === 401 || response.status === 403) {
    return new ProviderExecutionError(message, { category: "AUTHENTICATION_FAILED", code, httpStatus: response.status });
  }
  if (response.status === 400 || response.status === 422) {
    return new ProviderExecutionError(message, { category: "INVALID_REQUEST", code, httpStatus: response.status });
  }
  if (response.status >= 500) {
    return new ProviderExecutionError(message, { category: "PROVIDER_UNAVAILABLE", code, httpStatus: response.status });
  }

  return new ProviderExecutionError(message, { category: "PROVIDER_UNAVAILABLE", code, httpStatus: response.status });
}

async function callGoogleAI(env, prompt, dispatch) {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new ProviderExecutionError("GOOGLE_AI_API_KEY is not configured.", {
      category: "PROVIDER_UNAVAILABLE",
      code: "MISSING_SECRET"
    });
  }

  const generationConfig = structuredOutputRequested(dispatch)
    ? {
        responseMimeType: "application/json",
        responseSchema: repositoryPlanSchema()
      }
    : undefined;

  let response;
  try {
    response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": env.GOOGLE_AI_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(generationConfig ? { generationConfig } : {})
        })
      }
    );
  } catch (error) {
    throw new ProviderExecutionError(error.message || "Google AI connection failed.", {
      category: error?.name === "TimeoutError" ? "TIMEOUT" : "CONNECTION_ERROR"
    });
  }

  const data = await readProviderResponse(response);
  if (!response.ok) throw classifyProviderError("google", response, data);

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new ProviderExecutionError("Google AI returned an empty result.", { category: "INVALID_RESPONSE" });
  }

  return {
    provider: "google",
    model: data?.modelVersion || "gemini-2.5-flash",
    text,
    usage: data?.usageMetadata || null
  };
}

async function callOpenAI(env, prompt, dispatch) {
  if (!env.OPENAI_API_KEY) {
    throw new ProviderExecutionError("OPENAI_API_KEY is not configured.", {
      category: "PROVIDER_UNAVAILABLE",
      code: "MISSING_SECRET"
    });
  }

  const text = structuredOutputRequested(dispatch)
    ? {
        format: {
          type: "json_schema",
          name: "repository_execution_plan",
          strict: true,
          schema: repositoryPlanSchema({ strict: true })
        }
      }
    : undefined;

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: prompt,
        ...(text ? { text } : {})
      })
    });
  } catch (error) {
    throw new ProviderExecutionError(error.message || "OpenAI connection failed.", {
      category: error?.name === "TimeoutError" ? "TIMEOUT" : "CONNECTION_ERROR"
    });
  }

  const data = await readProviderResponse(response);
  if (!response.ok) throw classifyProviderError("openai", response, data);

  const outputText = data?.output_text || data?.output
    ?.flatMap((item) => item.content || [])
    .map((item) => item.text || "")
    .join("")
    .trim();

  if (!outputText) {
    throw new ProviderExecutionError("OpenAI returned an empty result.", { category: "INVALID_RESPONSE" });
  }

  return {
    provider: "openai",
    model: data?.model || "gpt-5",
    text: outputText,
    usage: data?.usage || null
  };
}

const PROVIDER_REGISTRY = {
  openai: {
    id: "openai",
    priority: 10,
    capabilities: ["architecture", "coding", "documentation", "reasoning"],
    configured: (env) => Boolean(env.OPENAI_API_KEY),
    execute: callOpenAI
  },
  google: {
    id: "google",
    priority: 20,
    capabilities: ["design-review", "documentation", "reasoning"],
    configured: (env) => Boolean(env.GOOGLE_AI_API_KEY),
    execute: callGoogleAI
  }
};

function providerOrder(preferredProvider) {
  return Object.values(PROVIDER_REGISTRY)
    .sort((a, b) => a.priority - b.priority)
    .sort((a, b) => Number(b.id === preferredProvider) - Number(a.id === preferredProvider));
}

export function providerReadiness(env) {
  return {
    ...Object.fromEntries(
      Object.values(PROVIDER_REGISTRY).map((provider) => [provider.id, provider.configured(env)])
    ),
    callbackAuthentication: Boolean(env.AI_CALLBACK_TOKEN),
    publicGatewayUrl: Boolean(env.GATEWAY_PUBLIC_URL)
  };
}

export async function deliverToProvider({ env, agent, dispatch }) {
  const preferredProvider = agent.provider || "manual";
  const assignedRole = roleSnapshot(agent);

  if (preferredProvider === "manual") {
    return {
      provider: "manual",
      assignedRole,
      preferredProvider,
      status: "manual-review-required",
      delivered: false,
      synchronous: false,
      fallbackUsed: false,
      temporaryRoleAssumption: false,
      attempts: [],
      message: "This step requires direct Founder action."
    };
  }

  const attempts = [];

  for (const provider of providerOrder(preferredProvider)) {
    const temporaryRoleAssumption = provider.id !== preferredProvider;

    if (!provider.configured(env)) {
      attempts.push({
        provider: provider.id,
        assignedRole: assignedRole.id,
        temporaryRoleAssumption,
        status: "skipped",
        errorCategory: "PROVIDER_UNAVAILABLE",
        errorCode: "MISSING_SECRET"
      });
      continue;
    }

    const prompt = buildProviderPrompt(agent, dispatch, {
      executingProvider: provider.id,
      temporaryRoleAssumption
    });

    try {
      const result = await provider.execute(env, prompt, dispatch);
      const fallbackUsed = temporaryRoleAssumption;

      attempts.push({
        provider: provider.id,
        assignedRole: assignedRole.id,
        temporaryRoleAssumption,
        status: "completed",
        model: result.model
      });

      return {
        provider: provider.id,
        assignedRole,
        preferredProvider,
        executingProvider: provider.id,
        status: "delivered",
        delivered: true,
        synchronous: true,
        fallbackUsed,
        temporaryRoleAssumption,
        roleRelinquishedAfterCompletion: temporaryRoleAssumption,
        fallbackReason: fallbackUsed
          ? attempts.find((attempt) => attempt.provider === preferredProvider)?.errorCategory || "PREFERRED_PROVIDER_UNAVAILABLE"
          : null,
        attempts,
        completedResult: {
          dispatchId: dispatch.dispatchId,
          summary: result.text,
          provider: result.provider,
          model: result.model,
          usage: result.usage,
          routing: {
            assignedRole,
            preferredProvider,
            executingProvider: provider.id,
            fallbackUsed,
            temporaryRoleAssumption,
            roleRelinquishedAfterCompletion: temporaryRoleAssumption,
            attempts
          }
        },
        deliveredAt: new Date().toISOString()
      };
    } catch (error) {
      const category = error.category || "PROVIDER_UNAVAILABLE";
      attempts.push({
        provider: provider.id,
        assignedRole: assignedRole.id,
        temporaryRoleAssumption,
        status: "failed",
        errorCategory: category,
        errorCode: error.code || null,
        httpStatus: error.httpStatus || null,
        message: error.message
      });

      if (!FAILOVER_CATEGORIES.has(category)) {
        return {
          provider: provider.id,
          assignedRole,
          preferredProvider,
          executingProvider: null,
          status: category === "AUTHENTICATION_FAILED" ? "authentication-failed" : "delivery-failed",
          delivered: false,
          synchronous: true,
          fallbackUsed: temporaryRoleAssumption,
          temporaryRoleAssumption,
          attempts,
          message: error.message
        };
      }
    }
  }

  const finalAttempt = attempts.at(-1);
  return {
    provider: preferredProvider,
    assignedRole,
    preferredProvider,
    executingProvider: null,
    status: "delivery-failed",
    delivered: false,
    synchronous: true,
    fallbackUsed: attempts.some((attempt) => attempt.provider !== preferredProvider && attempt.status !== "skipped"),
    temporaryRoleAssumption: false,
    attempts,
    message: finalAttempt?.message || "No configured AI provider could complete the task."
  };
}
