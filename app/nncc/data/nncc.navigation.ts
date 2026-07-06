// Defines one navigation item inside the Natural Nation Control Center.
// This keeps the NNCC route map simple and centralized.
export interface NNCCNavigationItem {
  // Stable route key used by a future router or tab controller.
  key: string;

  // Human-readable label shown in navigation UI.
  label: string;

  // Short description of what the view contains.
  description: string;
}

// Defines the first NNCC navigation map.
// Future routing can use these keys to render the correct page component.
export const nnccNavigationItems: NNCCNavigationItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Founder executive summary, active milestone, metrics, and repository health preview.',
  },
  {
    key: 'founder-brief',
    label: 'Founder Brief',
    description: 'Live-style summary generated from parsed Knowledge System metadata.',
  },
  {
    key: 'milestones',
    label: 'Milestones',
    description: 'Milestone progress, status, ownership, and canonical links.',
  },
  {
    key: 'approvals',
    label: 'Approvals',
    description: 'Founder approval history and draft implementation review items.',
  },
  {
    key: 'decisions',
    label: 'Decisions',
    description: 'Decision registry entries with status and traceability links.',
  },
  {
    key: 'repository',
    label: 'Repository',
    description: 'Branch safety, documentation coverage, and traceability health.',
  },
  {
    key: 'ai-team',
    label: 'AI Team',
    description: 'Natural Nation AI team roles, domains, and canonical knowledge homes.',
  },
];
