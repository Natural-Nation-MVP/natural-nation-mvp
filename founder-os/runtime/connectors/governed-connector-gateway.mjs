// Redacts values that must never appear in evidence, audit, or observability records.
export function redact(value) {
  const protectedKeys = /secret|token|password|authorization|api[-_]?key|cookie/i;
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, protectedKeys.test(key) ? '[REDACTED]' : redact(child)]));
  }
  return value;
}

// Creates a product-agnostic connector gateway with injected adapters and emitters.
export function createConnectorGateway({ registry, adapters, approvalVerifier, emitters = {} }) {
  const emit = (channel, event) => emitters[channel]?.(event);

  return {
    async execute(request) {
      const connection = registry.connections[request.connectionId];
      if (!connection || connection.status !== 'active') return denied('CONNECTION_UNAVAILABLE', request, emit);
      if (!request.workspaceId || connection.workspaceId !== request.workspaceId) return denied('WORKSPACE_MISMATCH', request, emit);
      if (!connection.capabilities.includes(request.capability)) return denied('CAPABILITY_NOT_REGISTERED', request, emit);
      if (!connection.secretReference || connection.secretValue) return denied('INVALID_SECRET_CONFIGURATION', request, emit);
      if (request.consequential && !approvalVerifier(request)) return denied('APPROVAL_REQUIRED', request, emit);

      const provider = registry.providers[connection.providerId];
      const candidates = [provider, ...(provider.fallbackProviderIds ?? []).map((id) => registry.providers[id])].filter(Boolean);
      let lastError;

      for (const candidate of candidates) {
        const adapter = adapters[candidate.adapter];
        if (!adapter) continue;
        try {
          const result = await adapter.execute({
            capability: request.capability,
            payload: request.payload,
            secretReference: connection.secretReference,
            model: request.model,
          });
          const safeResult = redact(result);
          emit('audit', { type: 'connector.completed', workspaceId: request.workspaceId, connectionId: request.connectionId, providerId: candidate.id, capability: request.capability, request: redact(request.payload) });
          emit('observability', { metric: 'connector.execution', status: 'completed', providerId: candidate.id });
          emit('cost', { workspaceId: request.workspaceId, providerId: candidate.id, usage: result.usage ?? null });
          return { status: 'completed', providerId: candidate.id, result: safeResult };
        } catch (error) {
          lastError = error;
          emit('observability', { metric: 'connector.execution', status: 'failed', providerId: candidate.id, errorCode: error.code ?? 'PROVIDER_ERROR' });
        }
      }
      return denied(lastError?.code ?? 'NO_PROVIDER_AVAILABLE', request, emit);
    },

    health() {
      return Object.values(registry.connections).map((connection) => ({
        connectionId: connection.id,
        workspaceId: connection.workspaceId,
        status: connection.status,
        providerRegistered: Boolean(registry.providers[connection.providerId]),
        secretReferencePresent: Boolean(connection.secretReference),
      }));
    },
  };
}

function denied(reason, request, emit) {
  const result = { status: 'denied', reason, workspaceId: request.workspaceId ?? null, connectionId: request.connectionId ?? null };
  emit('audit', { type: 'connector.denied', ...result, payload: redact(request.payload) });
  emit('observability', { metric: 'connector.execution', status: 'denied', reason });
  return result;
}
