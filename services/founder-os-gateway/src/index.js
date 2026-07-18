/*
 * Founder OS Gateway Worker v0.6.0
 *
 * Canonical Cloudflare Worker source for protected Founder approvals,
 * repository-backed AI orchestration, live workflows, and governed review.
 */

import { emptyResponse, errorResponse, json } from "./lib/http.js";
import { handleApproveBlueprint } from "./routes/approve-blueprint.js";
import { handleAiOrchestration } from "./routes/ai-orchestration.js";
import { handleLivePilot } from "./routes/live-pilot.js";
import { handleNnKs002 } from "./routes/nn-ks-002.js";

const VERSION = "0.6.0";

function safeBindingDiagnostics(env) {
  const receivedBindingNames = Object.keys(env || {}).sort();
  const normalizedFounderCandidates = receivedBindingNames.filter((name) =>
    name.replace(/[^A-Z0-9]/gi, "").toUpperCase().includes("FOUNDERAPIKEY")
  );
  return { receivedBindingNames, founderBindingCandidates: normalizedFounderCandidates };
}

export function gatewayConfiguration(env) {
  const required = {
    founderAuthentication: Boolean(env.FOUNDER_API_KEY),
    githubToken: Boolean(env.GITHUB_TOKEN),
    githubOwner: Boolean(env.GITHUB_OWNER),
    githubRepository: Boolean(env.GITHUB_REPOSITORY),
    githubBranch: Boolean(env.GITHUB_BRANCH),
    runtimeStore: Boolean(env.FOUNDER_OS_RUNTIME_STORE?.get && env.FOUNDER_OS_RUNTIME_STORE?.put)
  };
  const providers = {
    openAiProvider: Boolean(env.OPENAI_API_KEY),
    googleProvider: Boolean(env.GOOGLE_AI_API_KEY)
  };
  const optionalLegacy = {
    aiCallbackAuthentication: Boolean(env.AI_CALLBACK_TOKEN),
    gatewayPublicUrl: Boolean(env.GATEWAY_PUBLIC_URL)
  };
  return {
    configured: Object.values(required).every(Boolean) && Object.values(providers).some(Boolean),
    directProviderReady: Object.values(providers).some(Boolean),
    required,
    providers,
    optionalLegacy,
    bindings: { ...required, ...providers, ...optionalLegacy }
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return emptyResponse(request, 204);

    try {
      const approvalResponse = await handleApproveBlueprint(request, env, url.pathname);
      if (approvalResponse) return approvalResponse;

      const orchestrationResponse = await handleAiOrchestration(request, env, url.pathname);
      if (orchestrationResponse) return orchestrationResponse;

      const nnKs002Response = await handleNnKs002(request, env, url.pathname);
      if (nnKs002Response) return nnKs002Response;

      const livePilotResponse = await handleLivePilot(request, env, url.pathname, VERSION);
      if (livePilotResponse) return livePilotResponse;

      if (url.pathname === "/health") {
        return json(request, { service: "Founder OS Gateway", status: "online", version: VERSION, time: new Date().toISOString() });
      }

      if (url.pathname === "/version") {
        return json(request, {
          service: "Founder OS Gateway",
          version: VERSION,
          environment: "production",
          deployment: "github-managed",
          capabilities: {
            blueprintApproval: "canonical-commit-enabled",
            blueprintApprovalDryRun: "enabled",
            idempotentApprovalRecovery: "enabled",
            aiOrchestration: "repository-backed",
            aiDispatchDryRun: "enabled",
            directAiProviders: "enabled",
            providerReadiness: "enabled",
            repositoryExecution: "enabled",
            structuredObservability: "enabled",
            verifiedResultCallbacks: "legacy-compatible",
            workspaceIsolation: "enabled",
            liveFounderReviewPilot: "enabled",
            signedPilotApprovals: "enabled",
            pilotDiagnostics: "enabled",
            liveNnKs002Workflow: "enabled",
            durableWorkflowState: "enabled",
            exactScopeApproval: "enabled"
          }
        });
      }

      if (url.pathname === "/configuration") {
        const configuration = gatewayConfiguration(env);
        return json(request, { service: "Founder OS Gateway", version: VERSION, ...configuration, diagnostics: safeBindingDiagnostics(env) });
      }

      if (url.pathname === "/") {
        return json(request, { service: "Founder OS Gateway", status: "online", version: VERSION, message: "Founder OS secure execution gateway is running." });
      }

      return json(request, { ok: false, error: { code: "NOT_FOUND", message: "The requested Gateway route does not exist." } }, 404);
    } catch (error) {
      console.error(JSON.stringify({
        service: "founder-os-gateway",
        type: "unhandled_gateway_failure",
        pathname: url.pathname,
        message: error instanceof Error ? error.message : "Unknown gateway error"
      }));
      return errorResponse(request, 500, "GATEWAY_RUNTIME_FAILURE", "The gateway request failed safely. No protected action was executed.");
    }
  }
};
