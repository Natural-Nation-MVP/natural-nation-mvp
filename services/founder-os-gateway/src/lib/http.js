const ALLOWED_ORIGIN = "https://natural-nation-mvp.github.io";

export function corsHeaders(request) {
  const origin = request.headers.get("origin");
  const allowOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;

  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-client-request-id",
    "access-control-max-age": "86400",
    vary: "Origin"
  };
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
