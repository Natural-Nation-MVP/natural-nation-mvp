/**
 * Founder OS Gateway Worker v0.2.0
 *
 * Canonical source for the Cloudflare Worker.
 * v0.2.0 marks the transition to GitHub-managed Cloudflare deployment.
 * Public behavior remains unchanged for /, /health, and /version.
 */

const VERSION = "0.2.0";

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
          version: VERSION,
          time: new Date().toISOString()
        }),
        { headers }
      );
    }

    if (url.pathname === "/version") {
      return new Response(
        JSON.stringify({
          service: "Founder OS Gateway",
          version: VERSION,
          environment: "development",
          deployment: "github-managed"
        }),
        { headers }
      );
    }

    return new Response(
      JSON.stringify({
        service: "Founder OS Gateway",
        status: "online",
        version: VERSION,
        message: "Founder OS secure execution gateway is running."
      }),
      { headers }
    );
  }
};
