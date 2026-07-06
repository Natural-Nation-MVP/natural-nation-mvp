import type {
  NNCCAiTeamMember,
  NNCCApprovalItem,
  NNCCDashboardSnapshot,
  NNCCDecision,
  NNCCMilestone,
  NNCCRepositoryHealthItem,
} from '../types/nncc.types';

// Defines the top-level Founder dashboard snapshot.
// This object gives NNCC a single source for the executive summary card.
export const nnccDashboardSnapshot: NNCCDashboardSnapshot = {
  projectName: 'Natural Nation MVP',
  activeMilestoneId: 'NNCC-001',
  healthLevel: 'good',
  executiveSummary:
    'The Knowledge System foundation is approved. NNCC-001 is now creating the first Founder-facing Control Center module.',
  recommendedNextAction:
    'Review the first NNCC dashboard implementation, then connect it to the main app shell when routing is ready.',
};

// Defines the current milestone set shown in the Milestones view.
// These records mirror the approved knowledge system progression.
export const nnccMilestones: NNCCMilestone[] = [
  {
    id: 'NN-KS-001',
    name: 'Knowledge System Foundation',
    status: 'approved',
    progressPercent: 100,
    ownerRole: 'Atlas',
    canonicalHome: {
      label: 'Knowledge System README',
      path: 'knowledge/README.md',
    },
    summary: 'Established the Knowledge System as Natural Nation institutional memory.',
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
    name: 'Founder Knowledge Intelligence',
    status: 'approved',
    progressPercent: 100,
    ownerRole: 'Atlas',
    canonicalHome: {
      label: 'Founder Knowledge Intelligence',
      path: 'knowledge/12-founder-knowledge-intelligence/',
    },
    summary: 'Created the registry layer for decisions, approvals, assets, prompts, team ownership, and NNCC metadata.',
  },
  {
    id: 'NNCC-001',
    name: 'Natural Nation Control Center v1',
    status: 'draft_implementation',
    progressPercent: 35,
    ownerRole: 'Art',
    canonicalHome: {
      label: 'NNCC Module',
      path: 'app/nncc/',
    },
    summary: 'Builds the first self-contained Founder dashboard module inside the repository.',
  },
];

// Defines the decisions visible in the first Decision Registry view.
// Each decision links back to a canonical repository path.
export const nnccDecisions: NNCCDecision[] = [
  {
    id: 'DEC-NN-KS-001',
    decision: 'Natural Nation uses a numbered Knowledge System as institutional memory.',
    status: 'approved',
    milestoneId: 'NN-KS-001',
    canonicalHome: {
      label: 'Knowledge System README',
      path: 'knowledge/README.md',
    },
  },
  {
    id: 'DEC-NN-KS-002',
    decision: 'Founder Operating System is section 11 of the Knowledge System.',
    status: 'approved',
    milestoneId: 'NN-KS-002',
    canonicalHome: {
      label: 'Founder Operating System',
      path: 'knowledge/11-founder-operating-system/',
    },
  },
  {
    id: 'DEC-NN-KS-003',
    decision: 'Founder Knowledge Intelligence Layer is section 12 of the Knowledge System.',
    status: 'approved',
    milestoneId: 'NN-KS-003',
    canonicalHome: {
      label: 'Founder Knowledge Intelligence',
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
    title: 'NN-KS-003 Founder Knowledge Intelligence',
    status: 'approved',
    date: '2026-07-06',
    relatedDecisionId: 'DEC-NN-KS-003',
    canonicalHome: {
      label: 'Founder Knowledge Intelligence',
      path: 'knowledge/12-founder-knowledge-intelligence/',
    },
    note: 'Approved by Founder after section 12 implementation.',
  },
  {
    id: 'APR-NNCC-001',
    title: 'NNCC-001 Control Center v1',
    status: 'draft_implementation',
    date: '2026-07-06',
    canonicalHome: {
      label: 'NNCC Module',
      path: 'app/nncc/',
    },
    note: 'Implementation started after Founder requested the Control Center build.',
  },
];

// Defines repository health records displayed in NNCC.
// This gives the Founder a quick view of implementation readiness.
export const nnccRepositoryHealth: NNCCRepositoryHealthItem[] = [
  {
    id: 'repo-branch-health',
    category: 'Branch Health',
    level: 'good',
    summary: 'NNCC-001 is isolated on a feature branch for safe review.',
    canonicalHome: {
      label: 'NNCC Module',
      path: 'app/nncc/',
    },
  },
  {
    id: 'repo-documentation-coverage',
    category: 'Documentation Coverage',
    level: 'good',
    summary: 'Knowledge System sections 11 and 12 exist and are linked from the Knowledge index.',
    canonicalHome: {
      label: 'Knowledge System README',
      path: 'knowledge/README.md',
    },
  },
  {
    id: 'repo-traceability',
    category: 'Traceability',
    level: 'watch',
    summary: 'First NNCC data objects link to canonical homes. Future work should automate validation.',
    canonicalHome: {
      label: 'Cross-Reference Index',
      path: 'knowledge/12-founder-knowledge-intelligence/cross-reference-index.md',
    },
  },
];

// Defines AI team roles shown in the first team workspace.
// These records map project roles to their knowledge domains.
export const nnccAiTeam: NNCCAiTeamMember[] = [
  {
    role: 'Atlas',
    domain: 'Knowledge Stewardship',
    responsibilities: 'Organizes and connects Natural Nation project knowledge.',
    canonicalHome: { label: 'Knowledge System', path: 'knowledge/README.md' },
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
