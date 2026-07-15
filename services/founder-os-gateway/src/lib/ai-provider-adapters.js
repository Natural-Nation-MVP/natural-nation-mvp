function adapterConfig(env, provider) {
  const configs = {
    openai: {
      endpoint: env.OPENAI_AGENT_ENDPOINT,
      token: env.OPENAI_AGENT_TOKEN
    },
    google: {
      endpoint: env.GOOGLE_AGENT_ENDPOINT,
      token: env.GOOGLE_AGENT_TOKEN
    }
  };
  return configs[provider] || null;
}

export function providerReadiness(env) {
  return {
    openai: Boolean(env.OPENAI_AGENT_ENDPOINT && env.OPENAI_AGENT_TOKEN),
    google: Boolean(env.GOOGLE_AGENT_ENDPOINT && env.GOOGLE_AGENT_TOKEN),
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
      message: "This step requires direct Founder action."
    };
  }

  const config = adapterConfig(env, provider);
  if (!config?.endpoint || !config?.token) {
    return {
      provider,
      status: "awaiting-configuration",
      delivered: false,
      message: `${provider} delivery is not configured on the Gateway.`
    };
  }

  const callbackUrl = env.GATEWAY_PUBLIC_URL
    ? `${env.GATEWAY_PUBLIC_URL}/v1/workspaces/${encodeURIComponent(dispatch.workspaceId)}/packages/${encodeURIComponent(dispatch.packageId)}/tasks/${encodeURIComponent(dispatch.taskId)}/result`
    : null;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      dispatchId: dispatch.dispatchId,
      workspaceId: dispatch.workspaceId,
      packageId: dispatch.packageId,
      taskId: dispatch.taskId,
      agentId: dispatch.agentId,
      requiredInput: dispatch.requiredInput,
      expectedOutput: dispatch.expectedOutput,
      nextRole: dispatch.nextRole,
      callbackUrl
    })
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: text };
  }

  if (!response.ok) {
    return {
      provider,
      status: "delivery-failed",
      delivered: false,
      httpStatus: response.status,
      message: body?.message || `${provider} rejected the task.`
    };
  }

  return {
    provider,
    status: "delivered",
    delivered: true,
    providerJobId: body?.jobId || body?.id || null,
    deliveredAt: new Date().toISOString()
  };
}
