export interface NNCCWorkspaceRoute {
  key: string;
  label: string;
  description: string;
}

export interface NNCCWorkspaceGroup {
  id: string;
  label: string;
  accent: 'emerald' | 'cyan' | 'purple' | 'amber' | 'blue';
  routes: NNCCWorkspaceRoute[];
}

export const nnccWorkspaceNavigation: NNCCWorkspaceGroup[] = [
  {
    id: 'founder',
    label: 'Founder OS',
    accent: 'emerald',
    routes: [
      {
        key: 'dashboard',
        label: 'Monitor Project',
        description: 'Check project health, priorities, milestones, and active command status.',
      },
      {
        key: 'founder-brief',
        label: 'Review Daily Brief',
        description: 'Read the current Founder summary generated from project state.',
      },
      {
        key: 'approvals',
        label: 'Approve Changes',
        description: 'Review Founder decisions, approval needs, and revision requests.',
      },
      {
        key: 'timeline',
        label: 'Review Project History',
        description: 'Review chronological approvals, implementation events, and operating history.',
      },
    ],
  },
  {
    id: 'knowledge',
    label: 'Project Intelligence',
    accent: 'purple',
    routes: [
      {
        key: 'knowledge',
        label: 'Explore Project Intelligence',
        description: 'Search operating records, canonical paths, and project relationships powered by NNOS.',
      },
      {
        key: 'decisions',
        label: 'Review Decisions',
        description: 'Trace Founder decisions, approvals, and canonical reasoning.',
      },
      {
        key: 'ai-team',
        label: 'Coordinate AI Team',
        description: 'Review AI team roles, domains, ownership, and handoffs.',
      },
    ],
  },
  {
    id: 'build',
    label: 'AI Operations',
    accent: 'cyan',
    routes: [
      {
        key: 'build-queue',
        label: 'Generate Build Packages',
        description: 'Create AI-ready packages for ChatGPT, Codex, Google AI Studio, and review workflows.',
      },
      {
        key: 'repository',
        label: 'Monitor Repository',
        description: 'Check branch, documentation, implementation, and repository health.',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Project Operations',
    accent: 'amber',
    routes: [
      {
        key: 'operations',
        label: 'Manage Operations',
        description: 'Coordinate roadmap, QA, release tracking, and operating metrics.',
      },
      {
        key: 'verification',
        label: 'Verify Implementation',
        description: 'Confirm route, service, data, and readiness status.',
      },
      {
        key: 'milestones',
        label: 'Review Milestones',
        description: 'Review milestone progress, ownership, and status.',
      },
    ],
  },
];
