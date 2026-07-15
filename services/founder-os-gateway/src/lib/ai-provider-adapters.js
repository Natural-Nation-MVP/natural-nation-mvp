function buildProviderPrompt(agent, dispatch) {
  return [
    `You are operating as the ${agent.name || agent.id || "assigned AI agent"}.`,
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
    "Return a clear, complete result suitable for recording in the canonical repository."
  ].join("\n");
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

async function callGoogleAI(env, prompt) {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is not configured.");
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": env.GOOGLE_AI_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  const data = await readProviderResponse(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || `Google AI request failed with status ${response.status}.`);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Google AI returned an empty result.");

  return {
    provider: "google",
    model: data?.modelVersion || "gemini-2.5-flash",
    text,
    usage: data?.usageMetadata || null
  };
}

async function callOpenAI(env, prompt) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: prompt
    })
  });

  const data = await readProviderResponse(response);
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI request failed with status ${response.status}.`);
  }

  const text = data?.output_text || data?.output
    ?.flatMap((item) => item.content || [])
    .map((item) => item.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("OpenAI returned an empty result.");

  return {
    provider: "openai",
    model: data?.model || "gpt-5",
    text,
    usage: data?.usage || null
  };
}

export function providerReadiness(env) {
  return {
    openai: Boolean(env.OPENAI_API_KEY),
    google: Boolean(env.GOOGLE_AI_API_KEY),
    callbackAuthentication: Boolean(env.AI_CALLBACK_TOKEN),
    publicGatewayUrl: Boolean(env.GATEWAY_PUBLIC_URL)
  };
}

export async function deliverToProvider({ env, agent, dispatch }) {
  const provider = agent.provider || "manual";

  if (provider === "manual") {
    return {
      provider,
      status: "manual-review-required",
      delivered: false,
      synchronous: false,
      message: "This step requires direct Founder action."
    };
  }

  const prompt = buildProviderPrompt(agent, dispatch);

  try {
    const result = provider === "google"
      ? await callGoogleAI(env, prompt)
      : provider === "openai"
        ? await callOpenAI(env, prompt)
        : null;

    if (!result) {
      return {
        provider,
        status: "unsupported-provider",
        delivered: false,
        synchronous: false,
        message: `The provider "${provider}" is not supported.`
      };
    }

    return {
      provider,
      status: "delivered",
      delivered: true,
      synchronous: true,
      completedResult: {
        dispatchId: dispatch.dispatchId,
        summary: result.text,
        provider: result.provider,
        model: result.model,
        usage: result.usage
      },
      deliveredAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      provider,
      status: "delivery-failed",
      delivered: false,
      synchronous: true,
      message: error.message || `${provider} could not complete the task.`
    };
  }
}
