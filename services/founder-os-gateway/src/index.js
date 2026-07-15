/**
 * Founder OS Gateway Worker v0.5.1
 *
 * Canonical source for the Cloudflare Worker.
 * v0.5.1 adds provider readiness, secure dispatch delivery, and result callbacks.
 */

import { json } from "./lib/http.js";
import { handleApproveBlueprint } from "./routes/approve-blueprint.js";
import { handleAiOrchestration } from "./routes/ai-orchestration.js";

const VERSION = "0.5.1";

function safeBindingDiagnostics(env) {
  const receivedBindingNames = Object.keys(env || {}).sort();
  const normalizedFounderCandidates = receivedBindingNames.filter((name) =>
    name.replace(/[^A-Z0-9]/gi, "").toUpperCase().includes("FOUNDERAPIKEY")
  );
  return { receivedBindingNames, founderBindingCandidates: normalizedFounderCandidates };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return json(request, { ok: true }, 204);

    const orchestrationResponse = await handleAiOrchestration(request, env, url.pathname);
    if (orchestrationResponse) return orchestrationResponse;

    const approvalResponse = await handleApproveBlueprint(request, env, url.pathname);
    if (approvalResponse) return approvalResponse;

    if (url.pathname === "/health") {
      return json(request, { service: "Founder OS Gateway", status: "online", version: VERSION, time: new Date().toISOString() });
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
          aiOrchestration: "repository-backed-dispatch-enabled",
          aiOrchestrationDryRun: "enabled",
          aiProviderDelivery: "adapter-enabled",
          aiResultCallbacks: "protected-enabled",
          preservedRuntimeBindings: "enabled",
          safeBindingDiagnostics: "enabled"
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
        bindings,
        diagnostics: safeBindingDiagnostics(env)
      });
    }

    if (url.pathname === "/") {
      return json(request, { service: "Founder OS Gateway", status: "online", version: VERSION, message: "Founder OS secure execution gateway is running." });
    }

    return json(request, { ok: false, error: { code: "NOT_FOUND", message: "The requested Gateway route does not exist." } }, 404);
  }
};
