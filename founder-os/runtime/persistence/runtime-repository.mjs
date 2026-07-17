// Creates a dependency-free repository used for validation and local execution.
export function createRuntimeRepository() {
  const runs = new Map();
  const evidence = [];
  const events = [];
  const retries = [];
  const checkpoints = [];

  const key = (workspaceId, id) => `${workspaceId}:${id}`;
  const requireWorkspace = (workspaceId) => {
    if (!workspaceId) throw new Error('workspaceId is required');
  };

  return {
    saveRun(run) {
      requireWorkspace(run.workspaceId);
      const idempotencyKey = key(run.workspaceId, `idem:${run.idempotencyKey}`);
      if (runs.has(idempotencyKey)) return runs.get(idempotencyKey);
      const record = structuredClone(run);
      runs.set(key(run.workspaceId, run.id), record);
      runs.set(idempotencyKey, record);
      return structuredClone(record);
    },

    getRun(workspaceId, runId) {
      requireWorkspace(workspaceId);
      const record = runs.get(key(workspaceId, runId));
      return record ? structuredClone(record) : null;
    },

    appendEvidence(record) {
      requireWorkspace(record.workspaceId);
      if (!this.getRun(record.workspaceId, record.runId)) throw new Error('run not found in workspace');
      evidence.push(structuredClone(record));
    },

    appendEvent(record) {
      requireWorkspace(record.workspaceId);
      if (record.runId && !this.getRun(record.workspaceId, record.runId)) throw new Error('run not found in workspace');
      events.push(structuredClone(record));
    },

    appendRetry(record) {
      requireWorkspace(record.workspaceId);
      if (!this.getRun(record.workspaceId, record.runId)) throw new Error('run not found in workspace');
      retries.push(structuredClone(record));
    },

    saveCheckpoint(record) {
      requireWorkspace(record.workspaceId);
      if (!this.getRun(record.workspaceId, record.runId)) throw new Error('run not found in workspace');
      checkpoints.push(structuredClone(record));
    },

    snapshot(workspaceId) {
      requireWorkspace(workspaceId);
      return {
        runs: [...new Set([...runs.entries()].filter(([entryKey]) => entryKey.startsWith(`${workspaceId}:`) && !entryKey.includes(':idem:')).map(([, value]) => value))].map(structuredClone),
        evidence: evidence.filter((item) => item.workspaceId === workspaceId).map(structuredClone),
        events: events.filter((item) => item.workspaceId === workspaceId).map(structuredClone),
        retries: retries.filter((item) => item.workspaceId === workspaceId).map(structuredClone),
        checkpoints: checkpoints.filter((item) => item.workspaceId === workspaceId).map(structuredClone),
      };
    },
  };
}
