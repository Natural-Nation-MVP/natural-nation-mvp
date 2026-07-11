/**
 * Founder OS Gateway Worker v0.1.0
 *
 * Canonical source for the currently deployed Cloudflare Worker.
 * This preserves the live public behavior for /, /health, and /version.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const headers = {
      "content-type": "application/json",
      "access-control-allow-origin": "https://natural-nation-mvp.github.io"
    };

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          service: "Founder OS Gateway",
          status: "online",
          version: "0.1.0",
          time: new Date().toISOString()
        }),
        { headers }
      );
    }

    if (url.pathname === "/version") {
      return new Response(
        JSON.stringify({
          service: "Founder OS Gateway",
          version: "0.1.0",
          environment: "development"
        }),
        { headers }
      );
    }

    return new Response(
      JSON.stringify({
        service: "Founder OS Gateway",
        status: "online",
        version: "0.1.0",
        message: "Founder OS secure execution gateway is running."
      }),
      { headers }
    );
  }
};
