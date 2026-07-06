import type { NNCCBuildQueueItem } from '../types/buildQueue.types';

// Defines the first AI build queue items for NNCC.
// These items turn Founder direction into structured, traceable AI work packages.
export const nnccBuildQueueItems: NNCCBuildQueueItem[] = [
  {
    id: 'BUILD-NNCC-001',
    title: 'Connect NNCC to live Knowledge System files',
    surface: 'codex',
    status: 'ready_for_prompt',
    milestoneId: 'NNCC-005',
    ownerRole: 'Art',
    summary:
      'Replace seed Knowledge System documents with repository-loaded markdown files so Founder Brief and registries reflect real project files.',
    contextPaths: [
      'app/nncc/services/liveKnowledgeParser.service.ts',
      'app/nncc/services/liveRegistry.service.ts',
      'knowledge/README.md',
      'knowledge/11-founder-operating-system/',
      'knowledge/12-founder-knowledge-intelligence/',
    ],
    acceptanceCriteria: [
      'Registry loader can accept real markdown document content.',
      'Founder Brief displays parsed repository document metadata.',
      'Seed data remains available as fallback data.',
      'No locked Knowledge System rules are changed.',
    ],
    approvalStatus: 'draft_implementation',
  },
  {
    id: 'BUILD-NNCC-002',
    title: 'Create Google AI Studio app build package',
    surface: 'google_ai_studio',
    status: 'ready_for_prompt',
    milestoneId: 'NNCC-005',
    ownerRole: 'GPose',
    summary:
      'Generate a copy-ready Google AI Studio prompt package for rebuilding the NNCC dashboard UI from approved project context.',
    contextPaths: [
      'app/nncc/README.md',
      'app/nncc/pages/Dashboard/ExecutiveDashboard.tsx',
      'app/nncc/data/nncc.navigation.ts',
      'knowledge/12-founder-knowledge-intelligence/prompt-library.md',
    ],
    acceptanceCriteria: [
      'Prompt includes Natural Nation brand and purpose context.',
      'Prompt includes required NNCC pages and navigation.',
      'Prompt states that Founder approval controls locked changes.',
      'Prompt avoids replacing canonical Knowledge System artifacts.',
    ],
    approvalStatus: 'draft_implementation',
  },
  {
    id: 'BUILD-NNCC-003',
    title: 'Add GitHub repository health integration plan',
    surface: 'chatgpt',
    status: 'planned',
    milestoneId: 'NNCC-005',
    ownerRole: 'Rev',
    summary:
      'Prepare the implementation plan for live repository health cards, including PR status, branch state, commits, and review readiness.',
    contextPaths: [
      'app/nncc/pages/Repository/RepositoryHealthView.tsx',
      'app/nncc/data/nncc.seed.ts',
      'docs/NNCC-003_RUN_GUIDE.md',
    ],
    acceptanceCriteria: [
      'Plan identifies safe GitHub data sources.',
      'Plan separates local dashboard data from GitHub connector data.',
      'Plan lists security and access constraints.',
      'Plan defines the first repository health metrics.',
    ],
    approvalStatus: 'draft_implementation',
  },
];
