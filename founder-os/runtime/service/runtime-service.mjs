import crypto from 'node:crypto';

// Creates a stable SHA-256 digest so approvals and idempotency bind to exact payloads.
export function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

// Builds the executable runtime with injected registries and emitters for testability.
export function createRuntimeService({ workspaces, workflows, policies, approvals, emitters = {} }) {
  const seen = new Map();
  const emit = (name, event) => emitters[name]?.(event);

  return {
    // Executes one governed request through the complete deny-by-default pipeline.
    async execute(request) {
      const startedAt = new Date().toISOString();
      const payloadHash = hashPayload(request.payload);
      const runId = request.runId ?? crypto.randomUUID();
      const context = { ...request, runId, payloadHash, startedAt };

      if (!request.workspaceId || !workspaces[request.workspaceId]?.active) {
        return deny('INVALID_WORKSPACE_CONTEXT', context, emit);
      }
      if (!request.workflowId || !workflows[request.workflowId]) {
        return deny('UNREGISTERED_WORKFLOW', context, emit);
      }
      if (workflows[request.workflowId].workspaceId !== request.workspaceId) {
        return deny('CROSS_WORKSPACE_WORKFLOW_ACCESS', context, emit);
      }
      if (request.containsProtectedPayload === true) {
        return deny('PROTECTED_PAYLOAD_BLOCKED', context, emit);
      }

      const idempotencyKey = `${request.workspaceId}:${request.idempotencyKey ?? payloadHash}`;
      if (seen.has(idempotencyKey)) return seen.get(idempotencyKey);

      const policy = policies[request.action];
      if (!policy) return deny('NO_POLICY', context, emit);
      if (policy.effect === 'deny') return deny('POLICY_DENIED', context, emit);

      if (policy.approvalRequired) {
        const approval = approvals[request.approvalId];
        const valid = approval
          && approval.workspaceId === request.workspaceId
          && approval.action === request.action
          && approval.payloadHash === payloadHash
          && approval.status === 'approved'
          && Date.parse(approval.expiresAt) > Date.now();
        if (!valid) return deny('APPROVAL_INVALID_OR_MISSING', context, emit);
      }

      const result = await runWithRetry(
        () => workflows[request.workflowId].handler(context),
        workflows[request.workflowId].maxAttempts ?? 1,
      );

      const completed = {
        runId,
        workspaceId: request.workspaceId,
        workflowId: request.workflowId,
        action: request.action,
        payloadHash,
        status: 'completed',
        result: result.value,
        attempts: result.attempts,
        startedAt,
        completedAt: new Date().toISOString(),
      };

      seen.set(idempotencyKey, completed);
      emit('evidence', { runId, workspaceId: request.workspaceId, payloadHash, result: result.value });
      emit('audit', { type: 'runtime.completed', ...completed });
      emit('observability', { metric: 'runtime.execution', status: 'completed', attempts: result.attempts });
      emit('cost', { runId, workspaceId: request.workspaceId, estimated: request.estimatedCost ?? 0 });
      return completed;
    },

    // Reports whether the runtime has the minimum registries required to execute safely.
    health() {
      return {
        status: Object.keys(workspaces).length && Object.keys(workflows).length && Object.keys(policies).length ? 'healthy' : 'degraded',
        checkedAt: new Date().toISOString(),
      };
    },
  };
}

async function runWithRetry(operation, maxAttempts) {
  let lastError;
  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
    try {
      return { value: await operation(), attempts: attempt };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function deny(reason, context, emit) {
  const denied = {
    runId: context.runId,
    workspaceId: context.workspaceId ?? null,
    status: 'denied',
    reason,
    payloadHash: context.payloadHash,
    completedAt: new Date().toISOString(),
  };
  emit('audit', { type: 'runtime.denied', ...denied });
  emit('observability', { metric: 'runtime.execution', status: 'denied', reason });
  return denied;
}
