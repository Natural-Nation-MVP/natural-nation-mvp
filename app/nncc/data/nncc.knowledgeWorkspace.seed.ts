import type {
  NNCCFounderTimelineEvent,
  NNCCKnowledgeGroup,
  NNCCKnowledgeItem,
} from '../types/knowledgeWorkspace.types';

// Defines the first Knowledge Browser groups.
// These groups are designed around Founder workflow, not raw repository folders.
export const nnccKnowledgeGroups: NNCCKnowledgeGroup[] = [
  {
    id: 'founder',
    name: 'Founder Operating System',
    description: 'Executive status, approvals, repository health, and traceability.',
    paths: ['knowledge/11-founder-operating-system/'],
  },
  {
    id: 'intelligence',
    name: 'Founder Knowledge Intelligence',
    description: 'Decision, approval, architecture, asset, prompt, and cross-reference registries.',
    paths: ['knowledge/12-founder-knowledge-intelligence/'],
  },
  {
    id: 'control-center',
    name: 'Natural Nation Control Center',
    description: 'NNCC app shell, dashboard pages, services, data models, and run guides.',
    paths: ['app/nncc/', 'docs/NNCC-003_RUN_GUIDE.md', 'docs/NNCC_IPAD_RUN_GUIDE.md'],
  },
  {
    id: 'build',
    name: 'AI Build System',
    description: 'AI Build Queue, prompt packages, and tool-specific build workflows.',
    paths: ['app/nncc/pages/BuildQueue/', 'app/nncc/services/buildQueue.service.ts'],
  },
];

// Defines curated Knowledge Browser entries.
// Future versions can replace this with repository parsing and registry discovery.
export const nnccKnowledgeItems: NNCCKnowledgeItem[] = [
  {
    id: 'KNOW-001',
    title: 'Natural Nation Knowledge System',
    groupId: 'founder',
    status: 'approved',
    canonicalPath: 'knowledge/README.md',
    summary: 'The institutional memory and single source of truth for Founder-approved project knowledge.',
    keywords: ['knowledge', 'system', 'canonical', 'single source', 'approval'],
    relatedIds: ['NN-KS-001'],
  },
  {
    id: 'KNOW-002',
    title: 'Founder Operating System',
    groupId: 'founder',
    status: 'approved',
    canonicalPath: 'knowledge/11-founder-operating-system/README.md',
    summary: 'The Founder-facing executive control layer for approvals, milestones, status, and traceability.',
    keywords: ['founder', 'operating system', 'approval', 'milestone', 'traceability'],
    relatedIds: ['NN-KS-002', 'DEC-NN-KS-002'],
  },
  {
    id: 'KNOW-003',
    title: 'Founder Knowledge Intelligence',
    groupId: 'intelligence',
    status: 'approved',
    canonicalPath: 'knowledge/12-founder-knowledge-intelligence/README.md',
    summary: 'The registry layer for decisions, approvals, architecture, assets, prompts, team roles, and NNCC data.',
    keywords: ['registry', 'decision', 'approval', 'architecture', 'asset', 'prompt'],
    relatedIds: ['NN-KS-003', 'DEC-NN-KS-003'],
  },
  {
    id: 'KNOW-004',
    title: 'NNCC Runnable Dashboard',
    groupId: 'control-center',
    status: 'draft_implementation',
    canonicalPath: 'app/nncc/README.md',
    summary: 'The runnable Control Center foundation with dashboard, Founder Brief, and workspace pages.',
    keywords: ['nncc', 'dashboard', 'expo', 'codespaces', 'ipad'],
    relatedIds: ['NNCC-001', 'NNCC-003'],
  },
  {
    id: 'KNOW-005',
    title: 'AI Build Queue',
    groupId: 'build',
    status: 'draft_implementation',
    canonicalPath: 'app/nncc/pages/BuildQueue/BuildQueueView.tsx',
    summary: 'The first AI work package queue for ChatGPT, Codex, Google AI Studio, Gemini, and manual review.',
    keywords: ['build queue', 'chatgpt', 'codex', 'google ai studio', 'prompt package'],
    relatedIds: ['NNCC-005', 'BUILD-NNCC-001', 'BUILD-NNCC-002'],
  },
];

// Defines the first Founder Timeline events.
// Timeline events keep project progress understandable across approvals and builds.
export const nnccFounderTimelineEvents: NNCCFounderTimelineEvent[] = [
  {
    id: 'TIME-001',
    date: '2026-07-06',
    title: 'Knowledge System foundation confirmed',
    status: 'approved',
    summary: 'Natural Nation Knowledge System established as the project memory and canonical reference structure.',
    canonicalPath: 'knowledge/README.md',
    relatedIds: ['NN-KS-001'],
  },
  {
    id: 'TIME-002',
    date: '2026-07-06',
    title: 'Founder Operating System approved',
    status: 'approved',
    summary: 'Section 11 became the executive layer for approvals, milestones, repository health, and traceability.',
    canonicalPath: 'knowledge/11-founder-operating-system/README.md',
    relatedIds: ['NN-KS-002', 'APR-NN-KS-002'],
  },
  {
    id: 'TIME-003',
    date: '2026-07-06',
    title: 'Founder Knowledge Intelligence approved',
    status: 'approved',
    summary: 'Section 12 established registries for decisions, approvals, architecture, assets, prompts, and NNCC metadata.',
    canonicalPath: 'knowledge/12-founder-knowledge-intelligence/README.md',
    relatedIds: ['NN-KS-003', 'APR-NN-KS-003'],
  },
  {
    id: 'TIME-004',
    date: '2026-07-06',
    title: 'Control Center verified on iPad',
    status: 'draft_implementation',
    summary: 'NNCC was run successfully through GitHub Codespaces and viewed from iPad Safari.',
    canonicalPath: 'docs/NNCC_IPAD_RUN_GUIDE.md',
    relatedIds: ['NNCC-003', 'NNCC-004'],
  },
  {
    id: 'TIME-005',
    date: '2026-07-06',
    title: 'AI Build Queue added',
    status: 'draft_implementation',
    summary: 'NNCC gained the first prompt-package workflow for AI-assisted Natural Nation development.',
    canonicalPath: 'app/nncc/pages/BuildQueue/BuildQueueView.tsx',
    relatedIds: ['NNCC-005'],
  },
];
