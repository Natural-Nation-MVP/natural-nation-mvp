import type {
  NNCCKnowledgeRecord,
  NNCCKnowledgeRelationship,
} from '../types/knowledgeIntelligence.types';

// Defines the first repository-aware knowledge records.
// These are still curated records, but they mirror the canonical repository structure.
export const nnccKnowledgeRecords: NNCCKnowledgeRecord[] = [
  {
    id: 'REC-KS-001',
    title: 'Natural Nation Knowledge System',
    recordType: 'document',
    status: 'approved',
    canonicalPath: 'knowledge/README.md',
    summary: 'Canonical project memory and numbered Knowledge System foundation.',
    tags: ['knowledge-system', 'canonical', 'founder-approved', 'project-memory'],
    relatedIds: ['NN-KS-001', 'DEC-NN-KS-001'],
  },
  {
    id: 'REC-KS-002',
    title: 'Founder Operating System',
    recordType: 'document',
    status: 'approved',
    canonicalPath: 'knowledge/11-founder-operating-system/README.md',
    summary: 'Executive control layer for Founder status, approvals, milestones, and repository health.',
    tags: ['founder-os', 'approvals', 'milestones', 'executive'],
    relatedIds: ['NN-KS-002', 'APR-NN-KS-002'],
  },
  {
    id: 'REC-KS-003',
    title: 'Founder Knowledge Intelligence',
    recordType: 'document',
    status: 'approved',
    canonicalPath: 'knowledge/12-founder-knowledge-intelligence/README.md',
    summary: 'Registry layer for decisions, approvals, architecture, assets, prompts, team roles, and NNCC metadata.',
    tags: ['knowledge-intelligence', 'registry', 'traceability', 'metadata'],
    relatedIds: ['NN-KS-003', 'APR-NN-KS-003'],
  },
  {
    id: 'REC-DEC-001',
    title: 'Decision Registry',
    recordType: 'decision',
    status: 'approved',
    canonicalPath: 'knowledge/12-founder-knowledge-intelligence/decision-registry.md',
    summary: 'Tracks Founder decisions, statuses, milestones, canonical homes, and notes.',
    tags: ['decision', 'registry', 'approval', 'traceability'],
    relatedIds: ['DEC-NN-KS-001', 'DEC-NN-KS-002', 'DEC-NN-KS-003'],
  },
  {
    id: 'REC-APR-001',
    title: 'Approval Ledger',
    recordType: 'approval',
    status: 'approved',
    canonicalPath: 'knowledge/12-founder-knowledge-intelligence/approval-ledger.md',
    summary: 'Chronological record of approvals and review events.',
    tags: ['approval', 'ledger', 'review', 'founder'],
    relatedIds: ['APR-NN-KS-002', 'APR-NN-KS-003'],
  },
  {
    id: 'REC-BUILD-001',
    title: 'AI Operations Center',
    recordType: 'build',
    status: 'draft_implementation',
    canonicalPath: 'app/nncc/pages/BuildQueue/BuildQueueView.tsx',
    summary: 'Mission Control workspace for AI build packages, tool profiles, sessions, and build history.',
    tags: ['build-queue', 'ai-operations', 'prompt-package', 'codex', 'google-ai-studio'],
    relatedIds: ['NNCC-010', 'BUILD-NNCC-001', 'BUILD-NNCC-002'],
  },
  {
    id: 'REC-OPS-001',
    title: 'Operations Center',
    recordType: 'build',
    status: 'draft_implementation',
    canonicalPath: 'app/nncc/pages/Operations/OperationsCenterView.tsx',
    summary: 'Mission Control workspace for roadmap, QA, release tracks, and operations metrics.',
    tags: ['operations', 'roadmap', 'qa', 'release', 'metrics'],
    relatedIds: ['NNCC-011', 'REL-NNCC-R1'],
  },
];

// Defines first knowledge relationship edges.
// These relationships make the Knowledge Workspace more than a document list.
export const nnccKnowledgeRelationships: NNCCKnowledgeRelationship[] = [
  {
    id: 'REL-KI-001',
    sourceId: 'REC-KS-001',
    targetId: 'REC-KS-002',
    type: 'supports',
    summary: 'The Knowledge System foundation supports the Founder Operating System.',
  },
  {
    id: 'REL-KI-002',
    sourceId: 'REC-KS-001',
    targetId: 'REC-KS-003',
    type: 'supports',
    summary: 'The Knowledge System foundation supports Founder Knowledge Intelligence.',
  },
  {
    id: 'REL-KI-003',
    sourceId: 'REC-KS-003',
    targetId: 'REC-DEC-001',
    type: 'defines',
    summary: 'Founder Knowledge Intelligence defines the Decision Registry.',
  },
  {
    id: 'REL-KI-004',
    sourceId: 'REC-KS-003',
    targetId: 'REC-APR-001',
    type: 'defines',
    summary: 'Founder Knowledge Intelligence defines the Approval Ledger.',
  },
  {
    id: 'REL-KI-005',
    sourceId: 'REC-DEC-001',
    targetId: 'REC-BUILD-001',
    type: 'supports',
    summary: 'Decision Registry context supports AI Operations work packages.',
  },
  {
    id: 'REL-KI-006',
    sourceId: 'REC-BUILD-001',
    targetId: 'REC-OPS-001',
    type: 'references',
    summary: 'AI Operations and Operations Center share release and roadmap state.',
  },
];
