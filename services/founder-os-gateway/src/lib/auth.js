export function authenticateFounder(request, env) {
  if (!env.FOUNDER_API_KEY) {
    return {
      ok: false,
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
      message: "Founder authentication is not configured on the Gateway."
    };
  }

  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return {
      ok: false,
      status: 401,
      code: "AUTH_REQUIRED",
      message: "A Founder bearer token is required."
    };
  }

  if (token !== env.FOUNDER_API_KEY) {
    return {
      ok: false,
      status: 403,
      code: "AUTH_FORBIDDEN",
      message: "The supplied credential is not authorized for Founder approval."
    };
  }

  return {
    ok: true,
    actor: {
      id: "founder",
      role: "founder",
      permissions: ["blueprint:approve"]
    }
  };
}
