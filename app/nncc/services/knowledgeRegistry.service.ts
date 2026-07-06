import {
  nnccAiTeam,
  nnccApprovalItems,
  nnccDashboardSnapshot,
  nnccDecisions,
  nnccMilestones,
  nnccRepositoryHealth,
} from '../data/nncc.seed';

// Returns the full dashboard snapshot for the executive dashboard.
// This keeps the UI from importing raw data directly.
export function getDashboardSnapshot() {
  return nnccDashboardSnapshot;
}

// Returns all milestones currently visible in NNCC.
// Future versions can replace this static data with parsed Knowledge System records.
export function getMilestones() {
  return nnccMilestones;
}

// Finds the active milestone by the dashboard snapshot ID.
// This gives the dashboard a stable way to highlight current work.
export function getActiveMilestone() {
  return nnccMilestones.find(
    (milestone) => milestone.id === nnccDashboardSnapshot.activeMilestoneId,
  );
}

// Returns Founder approval records for the Approval Center.
// Keeping this behind a service makes future data loading easier.
export function getApprovalItems() {
  return nnccApprovalItems;
}

// Returns approved and draft decisions for the Decision Registry view.
// Future versions can parse this from the Knowledge Intelligence registry.
export function getDecisions() {
  return nnccDecisions;
}

// Returns repository health records for the Repository Health panel.
// These records summarize the implementation state for Founder review.
export function getRepositoryHealth() {
  return nnccRepositoryHealth;
}

// Returns AI team ownership records for the Team Workspace.
// This connects role ownership to canonical knowledge files.
export function getAiTeam() {
  return nnccAiTeam;
}

// Returns a count summary for top-level dashboard stats.
// This prevents each UI card from repeating simple counting logic.
export function getDashboardCounts() {
  return {
    milestones: nnccMilestones.length,
    approvals: nnccApprovalItems.length,
    decisions: nnccDecisions.length,
    healthItems: nnccRepositoryHealth.length,
    teamRoles: nnccAiTeam.length,
  };
}
