-- Founder OS runtime persistence. Every operational row is workspace-scoped.
CREATE TABLE IF NOT EXISTS fos_runtime_run (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  workflow_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','completed','failed','denied','recovering')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, idempotency_key),
  UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS fos_runtime_approval_binding (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  run_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  approval_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  FOREIGN KEY (workspace_id, run_id) REFERENCES fos_runtime_run(workspace_id, id)
);

CREATE TABLE IF NOT EXISTS fos_runtime_evidence (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  run_id UUID NOT NULL,
  evidence_type TEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  storage_reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (workspace_id, run_id) REFERENCES fos_runtime_run(workspace_id, id)
);

CREATE TABLE IF NOT EXISTS fos_runtime_event (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  run_id UUID,
  channel TEXT NOT NULL CHECK (channel IN ('audit','observability','cost','notification','incident')),
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (workspace_id, run_id) REFERENCES fos_runtime_run(workspace_id, id)
);

CREATE TABLE IF NOT EXISTS fos_runtime_retry (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  run_id UUID NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  outcome TEXT NOT NULL,
  error_code TEXT,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, run_id, attempt_number),
  FOREIGN KEY (workspace_id, run_id) REFERENCES fos_runtime_run(workspace_id, id)
);

CREATE TABLE IF NOT EXISTS fos_runtime_checkpoint (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  run_id UUID NOT NULL,
  checkpoint_name TEXT NOT NULL,
  state_hash CHAR(64) NOT NULL,
  storage_reference TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, run_id, checkpoint_name),
  FOREIGN KEY (workspace_id, run_id) REFERENCES fos_runtime_run(workspace_id, id)
);

CREATE INDEX IF NOT EXISTS idx_fos_runtime_run_workspace_status ON fos_runtime_run(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_fos_runtime_event_workspace_created ON fos_runtime_event(workspace_id, created_at);
