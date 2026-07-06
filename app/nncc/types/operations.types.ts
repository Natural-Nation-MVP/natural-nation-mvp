// Defines a repository operations metric displayed in the Operations Center.
// These records are seed-backed now and can later connect to live GitHub data.
export interface NNCCOperationsMetric {
  id: string;
  label: string;
  value: string | number;
  helper: string;
  level: 'good' | 'watch' | 'risk' | 'blocked';
}

// Defines one roadmap item for release planning and project sequencing.
// Roadmap items show where the Founder Control Center is heading next.
export interface NNCCRoadmapItem {
  id: string;
  title: string;
  phase: string;
  status: 'planned' | 'in_progress' | 'ready_for_review' | 'complete';
  progressPercent: number;
  summary: string;
}

// Defines one QA checkpoint in the Operations Center.
// QA checkpoints keep review expectations visible before work is approved or merged.
export interface NNCCQaCheckpoint {
  id: string;
  title: string;
  status: 'pending' | 'passing' | 'needs_review' | 'blocked';
  ownerRole: string;
  summary: string;
}

// Defines one release candidate or release track.
// Release records support future deployment and version planning.
export interface NNCCReleaseTrack {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'ready_for_review' | 'released';
  target: string;
  summary: string;
}
