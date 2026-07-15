function bearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

export function authenticateFounder(request, env) {
  if (!env.FOUNDER_API_KEY) {
    return { ok: false, status: 503, code: "AUTH_NOT_CONFIGURED", message: "Founder authentication is not configured on the Gateway." };
  }

  const token = bearerToken(request);
  if (!token) {
    return { ok: false, status: 401, code: "AUTH_REQUIRED", message: "A Founder bearer token is required." };
  }

  if (token !== env.FOUNDER_API_KEY) {
    return { ok: false, status: 403, code: "AUTH_FORBIDDEN", message: "The supplied credential is not authorized for Founder actions." };
  }

  return {
    ok: true,
    actor: {
      id: "founder",
      role: "founder",
      permissions: ["blueprint:approve", "ai:dispatch", "ai:review"]
    }
  };
}

export function authenticateAgentCallback(request, env) {
  if (!env.AI_CALLBACK_TOKEN) {
    return { ok: false, status: 503, code: "AI_CALLBACK_NOT_CONFIGURED", message: "AI callback authentication is not configured." };
  }

  const token = bearerToken(request);
  if (!token) {
    return { ok: false, status: 401, code: "AI_CALLBACK_AUTH_REQUIRED", message: "An AI callback bearer token is required." };
  }

  if (token !== env.AI_CALLBACK_TOKEN) {
    return { ok: false, status: 403, code: "AI_CALLBACK_FORBIDDEN", message: "The callback credential is not authorized." };
  }

  return {
    ok: true,
    actor: {
      id: "ai-provider",
      role: "provider-callback",
      permissions: ["ai:result:create"]
    }
  };
}
