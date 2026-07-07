import type {
  NNCCAiTeamMember,
  NNCCApprovalItem,
  NNCCDashboardSnapshot,
  NNCCDecision,
  NNCCMilestone,
  NNCCRepositoryHealthItem,
} from '../types/nncc.types';

// Defines the top-level Founder OS dashboard snapshot.
// This object gives the Founder a single source for the executive summary card.
export const nnccDashboardSnapshot: NNCCDashboardSnapshot = {
  projectName: 'Natural Nation Founder OS',
  activeMilestoneId: 'NNCC-001',
  healthLevel: 'good',
  executiveSummary:
    'Founder OS is active. NNOS now powers the executive interface, project intelligence layer, AI operations, and implementation verification workflow.',
  recommendedNextAction:
    'Polish the remaining Founder OS pages and align legacy views with the approved action-oriented interface standard.',
};

// Defines the current milestone set shown in the Milestones view.
// These records mirror the approved NNOS progression while preserving existing IDs.
export const nnccMilestones: NNCCMilestone[] = [
  {
    id: 'NN-KS-001',
    name: 'NNOS Foundation',
    status: 'approved',
    progressPercent: 100,
    ownerRole: 'Atlas',
    canonicalHome: {
      label: 'NNOS Repository Root',
      path: 'knowledge/README.md',
    },
    summary: 'Established the Natural Nation Operating System as the project source of truth.',
  },
  {
    id: 'NN-KS-002',
    name: 'Founder Operating System',
    status: 'approved',
    progressPercent: 100,
    ownerRole: 'Atlas',
    canonicalHome: {
      label: 'Founder Operating System',
      path: 'knowledge/11-founder-operating-system/',
    },
    summary: 'Created the Founder-facing executive structure for approvals, status, health, and traceability.',
  },
  {
    id: 'NN-KS-003',
    name: 'Project Intelligence Layer',
    status: 'approved',
    progressPercent: 100,
    ownerRole: 'Atlas',
    canonicalHome: {
      label: 'Project Intelligence Layer',
      path: 'knowledge/12-founder-knowledge-intelligence/',
    },
    summary: 'Created the registry layer for decisions, approvals, assets, prompts, team ownership, and Founder OS metadata.',
  },
  {
    id: 'NNCC-001',
    name: 'Natural Nation Founder OS v1',
    status: 'draft_implementation',
    progressPercent: 65,
    ownerRole: 'Art',
    canonicalHome: {
      label: 'Founder OS Module',
      path: 'app/nncc/',
    },
    summary: 'Builds the first self-contained Founder OS module inside the repository.',
  },
];

// Defines the decisions visible in the first Decision Registry view.
// Each decision links back to a canonical repository path.
export const nnccDecisions: NNCCDecision[] = [
  {
    id: 'DEC-NN-KS-001',
    decision: 'Natural Nation uses NNOS as the canonical operating system and institutional memory.',
    status: 'approved',
    milestoneId: 'NN-KS-001',
    canonicalHome: {
      label: 'NNOS Repository Root',
      path: 'knowledge/README.md',
    },
  },
  {
    id: 'DEC-NN-KS-002',
    decision: 'Founder Operating System is section 11 of the NNOS repository structure.',
    status: 'approved',
    milestoneId: 'NN-KS-002',
    canonicalHome: {
      label: 'Founder Operating System',
      path: 'knowledge/11-founder-operating-system/',
    },
  },
  {
    id: 'DEC-NN-KS-003',
    decision: 'Project Intelligence Layer is section 12 of the NNOS repository structure.',
    status: 'approved',
    milestoneId: 'NN-KS-003',
    canonicalHome: {
      label: 'Project Intelligence Layer',
      path: 'knowledge/12-founder-knowledge-intelligence/',
    },
  },
];

// Defines the approval center records for Founder review.
// Approval items stay separate from milestone implementation progress.
export const nnccApprovalItems: NNCCApprovalItem[] = [
  {
    id: 'APR-NN-KS-002',
    title: 'NN-KS-002 Founder Operating System',
    status: 'approved',
    date: '2026-07-06',
    relatedDecisionId: 'DEC-NN-KS-002',
    canonicalHome: {
      label: 'Founder Operating System',
      path: 'knowledge/11-founder-operating-system/',
    },
    note: 'Approved by Founder after implementation.',
  },
  {
    id: 'APR-NN-KS-003',
    title: 'NN-KS-003 Project Intelligence Layer',
    status: 'approved',
    date: '2026-07-06',
    relatedDecisionId: 'DEC-NN-KS-003',
    canonicalHome: {
      label: 'Project Intelligence Layer',
      path: 'knowledge/12-founder-knowledge-intelligence/',
    },
    note: 'Approved by Founder after section 12 implementation.',
  },
  {
    id: 'APR-NNCC-001',
    title: 'NNCC-001 Founder OS v1',
    status: 'draft_implementation',
    date: '2026-07-06',
    canonicalHome: {
      label: 'Founder OS Module',
      path: 'app/nncc/',
    },
    note: 'Implementation is active after Founder approved the Founder OS rebrand and action-oriented interface standard.',
  },
];

// Defines repository health records displayed in Founder OS.
// This gives the Founder a quick view of implementation readiness.
export const nnccRepositoryHealth: NNCCRepositoryHealthItem[] = [
  {
    id: 'repo-branch-health',
    category: 'Branch Health',
    level: 'good',
    summary: 'Founder OS work is isolated on a feature branch for safe review.',
    canonicalHome: {
      label: 'Founder OS Module',
      path: 'app/nncc/',
    },
  },
  {
    id: 'repo-documentation-coverage',
    category: 'Documentation Coverage',
    level: 'good',
    summary: 'NNOS standards, Founder OS rebrand guidance, and action-oriented interface rules are documented.',
    canonicalHome: {
      label: 'NNOS-001 Founder OS Rebrand',
      path: 'docs/NNOS-001_FOUNDER_OS_REBRAND.md',
    },
  },
  {
    id: 'repo-traceability',
    category: 'Traceability',
    level: 'watch',
    summary: 'Founder OS data objects link to canonical homes. Future work should automate validation.',
    canonicalHome: {
      label: 'Cross-Reference Index',
      path: 'knowledge/12-founder-knowledge-intelligence/cross-reference-index.md',
    },
  },
];

// Defines AI team roles shown in the first team workspace.
// These records map project roles to their NNOS domains.
export const nnccAiTeam: NNCCAiTeamMember[] = [
  {
    role: 'Atlas',
    domain: 'NNOS Stewardship',
    responsibilities: 'Organizes and connects Natural Nation operating records.',
    canonicalHome: { label: 'NNOS Repository Root', path: 'knowledge/README.md' },
  },
  {
    role: 'Art',
    domain: 'Architecture',
    responsibilities: 'Converts Founder vision into system structure and build plans.',
    canonicalHome: {
      label: 'Architecture Registry',
      path: 'knowledge/12-founder-knowledge-intelligence/architecture-registry.md',
    },
  },
  {
    role: 'Nova',
    domain: 'Design',
    responsibilities: 'Owns visual direction, UI polish, and asset alignment.',
    canonicalHome: {
      label: 'Asset Registry',
      path: 'knowledge/12-founder-knowledge-intelligence/asset-registry.md',
    },
  },
  {
    role: 'Rev',
    domain: 'Governance',
    responsibilities: 'Checks approval readiness, traceability, and decision consistency.',
    canonicalHome: {
      label: 'Cross-Reference Index',
      path: 'knowledge/12-founder-knowledge-intelligence/cross-reference-index.md',
    },
  },
];
