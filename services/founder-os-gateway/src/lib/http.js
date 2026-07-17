const ALLOWED_ORIGINS = new Set([
  "https://natural-nation-mvp.github.io",
  "https://www.natural-nation-mvp.github.io"
]);

export function corsHeaders(request) {
  const origin = request.headers.get("origin");
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://natural-nation-mvp.github.io";

  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    // Permit the public client to pass only its non-secret workspace context.
    "access-control-allow-headers": "authorization,content-type,x-client-request-id,x-founder-os-workspace",
    "access-control-max-age": "86400",
    vary: "Origin"
  };
}

export function emptyResponse(request, status = 204, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: {
      ...corsHeaders(request),
      ...extraHeaders
    }
  });
}

export function json(request, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      ...extraHeaders
    }
  });
}

export function errorResponse(request, status, code, message, details = undefined) {
  return json(
    request,
    {
      ok: false,
      error: {
        code,
        message,
        ...(details ? { details } : {})
      }
    },
    status
  );
}
