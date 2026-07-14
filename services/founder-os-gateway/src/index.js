/**
 * Founder OS Gateway Worker v0.4.3
 *
 * Canonical source for the Cloudflare Worker.
 * v0.4.3 preserves dashboard-managed runtime secrets across GitHub deployments
 * and exposes safe binding-status verification without returning secret values.
 */

import { json } from "./lib/http.js";
import { handleApproveBlueprint } from "./routes/approve-blueprint.js";

const VERSION = "0.4.3";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json(request, { ok: true }, 204);
    }

    const approvalResponse = await handleApproveBlueprint(request, env, url.pathname);
    if (approvalResponse) return approvalResponse;

    if (url.pathname === "/health") {
      return json(request, {
        service: "Founder OS Gateway",
        status: "online",
        version: VERSION,
        time: new Date().toISOString()
      });
    }

    if (url.pathname === "/version") {
      return json(request, {
        service: "Founder OS Gateway",
        version: VERSION,
        environment: "development",
        deployment: "github-managed",
        capabilities: {
          blueprintApproval: "canonical-commit-enabled",
          blueprintApprovalDryRun: "enabled",
          idempotentApprovalRecovery: "enabled",
          preservedRuntimeBindings: "enabled"
        }
      });
    }

    if (url.pathname === "/configuration") {
      const bindings = {
        founderAuthentication: Boolean(env.FOUNDER_API_KEY),
        githubToken: Boolean(env.GITHUB_TOKEN),
        githubOwner: Boolean(env.GITHUB_OWNER),
        githubRepository: Boolean(env.GITHUB_REPOSITORY),
        githubBranch: Boolean(env.GITHUB_BRANCH)
      };

      return json(request, {
        service: "Founder OS Gateway",
        version: VERSION,
        configured: Object.values(bindings).every(Boolean),
        bindings
      });
    }

    if (url.pathname === "/") {
      return json(request, {
        service: "Founder OS Gateway",
        status: "online",
        version: VERSION,
        message: "Founder OS secure execution gateway is running."
      });
    }

    return json(
      request,
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested Gateway route does not exist."
        }
      },
      404
    );
  }
};
