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
    label: 'Founder',
    accent: 'emerald',
    routes: [
      {
        key: 'dashboard',
        label: 'Mission Dashboard',
        description: 'Executive project health and active command status.',
      },
      {
        key: 'founder-brief',
        label: 'Founder Brief',
        description: 'Daily-style summary generated from project state.',
      },
      {
        key: 'approvals',
        label: 'Approval Center',
        description: 'Founder review and approval queue.',
      },
      {
        key: 'timeline',
        label: 'Founder Timeline',
        description: 'Chronological approval and implementation history.',
      },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    accent: 'purple',
    routes: [
      {
        key: 'knowledge',
        label: 'Knowledge Browser',
        description: 'Search and browse canonical Natural Nation knowledge.',
      },
      {
        key: 'decisions',
        label: 'Decision Registry',
        description: 'Founder decisions and canonical traceability.',
      },
      {
        key: 'ai-team',
        label: 'AI Team Map',
        description: 'AI team roles, domains, and ownership.',
      },
    ],
  },
  {
    id: 'build',
    label: 'Build',
    accent: 'cyan',
    routes: [
      {
        key: 'build-queue',
        label: 'AI Build Queue',
        description: 'AI-ready work packages and prompt generation.',
      },
      {
        key: 'repository',
        label: 'Repository Status',
        description: 'Branch, documentation, and implementation health.',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    accent: 'amber',
    routes: [
      {
        key: 'operations',
        label: 'Operations Center',
        description: 'Roadmap, QA, release tracking, and operations metrics.',
      },
      {
        key: 'verification',
        label: 'Verification',
        description: 'Implementation status for routes, services, data, and system readiness.',
      },
      {
        key: 'milestones',
        label: 'Milestones',
        description: 'Milestone progress, ownership, and status.',
      },
    ],
  },
];
