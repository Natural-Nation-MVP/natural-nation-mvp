import type {
  NNCCOperationsMetric,
  NNCCQaCheckpoint,
  NNCCReleaseTrack,
  NNCCRoadmapItem,
} from '../types/operations.types';

// Defines first repository operations metrics.
// Future versions can replace these with live GitHub API or connector-backed data.
export const nnccOperationsMetrics: NNCCOperationsMetric[] = [
  {
    id: 'ops-pr',
    label: 'Open PR',
    value: 1,
    helper: 'Draft PR #1 tracks the NNCC foundation work.',
    level: 'good',
  },
  {
    id: 'ops-branch',
    label: 'Active Branch',
    value: 'NNCC',
    helper: 'feature/nncc-001-control-center-v1',
    level: 'good',
  },
  {
    id: 'ops-live-data',
    label: 'Live Data',
    value: 'Seed',
    helper: 'Runtime GitHub data integration is still pending.',
    level: 'watch',
  },
  {
    id: 'ops-ipad',
    label: 'iPad Run',
    value: 'OK',
    helper: 'Codespaces workflow verified on iPad.',
    level: 'good',
  },
];

// Defines Release 1 roadmap items for NNCC.
// This roadmap keeps remaining work visible inside the Operations Center.
export const nnccRoadmapItems: NNCCRoadmapItem[] = [
  {
    id: 'ROAD-NNCC-007',
    title: 'Mission Control UI Framework',
    phase: 'Release 1',
    status: 'in_progress',
    progressPercent: 70,
    summary: 'Dark HUD shell, grouped navigation, Mission panels, and Dashboard v2 foundation are implemented.',
  },
  {
    id: 'ROAD-NNCC-009',
    title: 'Knowledge Intelligence',
    phase: 'Release 1',
    status: 'planned',
    progressPercent: 35,
    summary: 'Knowledge Workspace exists; live repository-backed documents and graph relationships remain pending.',
  },
  {
    id: 'ROAD-NNCC-010',
    title: 'AI Operations Center',
    phase: 'Release 1',
    status: 'in_progress',
    progressPercent: 65,
    summary: 'Build Queue v2, tool profiles, prompt packages, sessions, and build history are implemented with seed data.',
  },
  {
    id: 'ROAD-NNCC-011',
    title: 'Operations Center',
    phase: 'Release 1',
    status: 'in_progress',
    progressPercent: 40,
    summary: 'Operations metrics, QA checkpoints, roadmap, and release tracking are being added.',
  },
];

// Defines QA checkpoints for the current release.
// These checkpoints make review criteria visible before Founder approval.
export const nnccQaCheckpoints: NNCCQaCheckpoint[] = [
  {
    id: 'QA-RUN-001',
    title: 'Codespaces Launch',
    status: 'passing',
    ownerRole: 'Founder',
    summary: 'NNCC launches from iPad Codespaces preview using npm run web.',
  },
  {
    id: 'QA-UI-001',
    title: 'Mission Control Shell Review',
    status: 'needs_review',
    ownerRole: 'Nova',
    summary: 'Dark HUD layout needs visual review across iPad and desktop widths.',
  },
  {
    id: 'QA-DATA-001',
    title: 'Seed Data Disclosure',
    status: 'passing',
    ownerRole: 'Rev',
    summary: 'Seed-backed areas are labeled and separated from future live integration scope.',
  },
  {
    id: 'QA-LIVE-001',
    title: 'Live GitHub Data',
    status: 'pending',
    ownerRole: 'Don',
    summary: 'Runtime GitHub metrics are not yet connected and require a safe integration plan.',
  },
];

// Defines release tracks for the Founder Control Center.
// This keeps release readiness visible to the Founder.
export const nnccReleaseTracks: NNCCReleaseTrack[] = [
  {
    id: 'REL-NNCC-R1',
    name: 'Release 1 — Founder Mission Control Foundation',
    status: 'active',
    target: 'Founder daily-use dashboard foundation',
    summary: 'Polished Mission Control shell, Knowledge Workspace, AI Operations Center, and Operations Center.',
  },
  {
    id: 'REL-NNCC-R2',
    name: 'Release 2 — Founder OS',
    status: 'draft',
    target: 'Live project operations and approval workflows',
    summary: 'Live GitHub data, automated Founder Brief, deeper approval workflows, and repository-backed knowledge.',
  },
  {
    id: 'REL-NNCC-R3',
    name: 'Release 3 — AI Orchestration',
    status: 'draft',
    target: 'AI-assisted build engine',
    summary: 'Guided build pipeline for ChatGPT, Codex, Google AI Studio, Gemini, and Founder review.',
  },
];
