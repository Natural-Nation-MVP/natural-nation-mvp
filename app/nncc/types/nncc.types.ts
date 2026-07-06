// Defines the approval state values used across NNCC.
// These values match the Natural Nation Knowledge System status language.
export type NNCCStatus =
  | 'draft'
  | 'draft_implementation'
  | 'ready_for_review'
  | 'approved'
  | 'locked'
  | 'superseded'
  | 'retired';

// Defines the health level values shown in Founder-facing dashboard cards.
// These values keep executive summaries simple and consistent.
export type NNCCHealthLevel = 'good' | 'watch' | 'risk' | 'blocked';

// Defines a canonical link back into the repository knowledge system.
// NNCC uses this to avoid duplicating source-of-truth content.
export interface NNCCCanonicalLink {
  // Human-readable label displayed in the UI.
  label: string;

  // Repository path to the source-of-truth artifact.
  path: string;
}

// Defines a project milestone record for milestone tracking views.
// Each milestone links back to its canonical knowledge home.
export interface NNCCMilestone {
  // Stable milestone ID used across NNCC and Knowledge System records.
  id: string;

  // Human-readable milestone name.
  name: string;

  // Current milestone status.
  status: NNCCStatus;

  // Simple completion percentage for executive display.
  progressPercent: number;

  // Role responsible for stewarding the milestone.
  ownerRole: string;

  // Canonical file or directory for the milestone.
  canonicalHome: NNCCCanonicalLink;

  // Short summary shown on dashboard cards.
  summary: string;
}

// Defines a Founder decision shown in the Decision Registry view.
// Decisions remain traceable to canonical Knowledge System locations.
export interface NNCCDecision {
  // Stable decision ID.
  id: string;

  // Decision summary.
  decision: string;

  // Current decision status.
  status: NNCCStatus;

  // Related milestone ID.
  milestoneId: string;

  // Canonical home for the decision or governing artifact.
  canonicalHome: NNCCCanonicalLink;
}

// Defines an approval item shown in the Approval Center.
// Approval items separate Founder review state from implementation state.
export interface NNCCApprovalItem {
  // Stable approval record ID.
  id: string;

  // Title of the approval item.
  title: string;

  // Current approval status.
  status: NNCCStatus;

  // Date string for audit readability.
  date: string;

  // Related decision ID when available.
  relatedDecisionId?: string;

  // Canonical source-of-truth link.
  canonicalHome: NNCCCanonicalLink;

  // Short note shown in review cards.
  note: string;
}

// Defines repository health cards for executive review.
// These records summarize branch, documentation, and traceability state.
export interface NNCCRepositoryHealthItem {
  // Stable health item ID.
  id: string;

  // Health category name.
  category: string;

  // Current health level.
  level: NNCCHealthLevel;

  // Human-readable status summary.
  summary: string;

  // Canonical or implementation link for the health item.
  canonicalHome?: NNCCCanonicalLink;
}

// Defines an AI team member shown in the team workspace.
// This maps operating roles to their project knowledge domains.
export interface NNCCAiTeamMember {
  // Role name used by the Natural Nation team.
  role: string;

  // Primary project domain for the role.
  domain: string;

  // Summary of responsibilities.
  responsibilities: string;

  // Canonical knowledge link for this role.
  canonicalHome: NNCCCanonicalLink;
}

// Defines a dashboard summary object for top-level executive cards.
// This gives the Founder one readable project snapshot.
export interface NNCCDashboardSnapshot {
  // Project name displayed at the top of NNCC.
  projectName: string;

  // Current active milestone.
  activeMilestoneId: string;

  // Overall project health level.
  healthLevel: NNCCHealthLevel;

  // Short executive summary.
  executiveSummary: string;

  // Recommended next action for the Founder or team.
  recommendedNextAction: string;
}
