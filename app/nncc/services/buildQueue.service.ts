import {
  nnccAiToolProfiles,
  nnccBuildHistoryEvents,
  nnccBuildSessions,
} from '../data/nncc.aiOperations.seed';
import { nnccBuildQueueItems } from '../data/nncc.buildQueue.seed';
import type {
  NNCCAiOperationsSummary,
  NNCCBuildPromptPackage,
  NNCCBuildQueueItem,
} from '../types/buildQueue.types';

// Returns all current AI build queue items.
// Future versions can load these from issues, milestones, or a repository-backed registry.
export function getBuildQueueItems(): NNCCBuildQueueItem[] {
  return nnccBuildQueueItems;
}

// Returns one build queue item by ID.
// This supports future detail pages and prompt generation workflows.
export function getBuildQueueItemById(id: string): NNCCBuildQueueItem | undefined {
  return nnccBuildQueueItems.find((item) => item.id === id);
}

// Generates a copy-ready AI prompt package from a build queue item.
// The prompt includes context paths and acceptance criteria so AI work remains traceable.
export function createBuildPromptPackage(item: NNCCBuildQueueItem): NNCCBuildPromptPackage {
  const contextList = item.contextPaths.map((path) => `- ${path}`).join('\n');
  const criteriaList = item.acceptanceCriteria.map((criteria) => `- ${criteria}`).join('\n');

  return {
    buildItemId: item.id,
    surface: item.surface,
    title: item.title,
    prompt: `You are working on Natural Nation.\n\nTask: ${item.title}\n\nMilestone: ${item.milestoneId}\nOwner Role: ${item.ownerRole}\nTarget Surface: ${item.surface}\n\nSummary:\n${item.summary}\n\nUse these canonical context paths:\n${contextList}\n\nAcceptance Criteria:\n${criteriaList}\n\nRules:\n- Do not change locked Natural Nation decisions without Founder approval.\n- Preserve canonical Knowledge System homes.\n- Keep implementation additive unless explicitly instructed otherwise.\n- Report what changed, what remains, and any blockers.`,
  };
}

// Generates prompt packages for every item that is ready for prompt creation.
// This is the first step toward a real AI Build Queue workflow.
export function getReadyBuildPromptPackages(): NNCCBuildPromptPackage[] {
  return nnccBuildQueueItems
    .filter((item) => item.status === 'ready_for_prompt')
    .map(createBuildPromptPackage);
}

// Returns the AI tool profiles supported by the AI Operations Center.
// Tool profiles explain which tool should handle each package type.
export function getAiToolProfiles() {
  return nnccAiToolProfiles;
}

// Returns current AI build sessions.
// Sessions create the first traceable layer between prompts and execution.
export function getBuildSessions() {
  return nnccBuildSessions;
}

// Returns build history events in newest-first order.
// This gives the Founder an audit trail for AI-assisted development.
export function getBuildHistoryEvents() {
  return [...nnccBuildHistoryEvents].sort((first, second) => second.date.localeCompare(first.date));
}

// Returns an operations summary for dashboard metrics.
// This converts raw queue data into Founder-ready status counts.
export function getAiOperationsSummary(): NNCCAiOperationsSummary {
  return {
    totalBuildItems: nnccBuildQueueItems.length,
    readyForPrompt: nnccBuildQueueItems.filter((item) => item.status === 'ready_for_prompt').length,
    inProgress: nnccBuildQueueItems.filter((item) => item.status === 'in_progress').length,
    blocked: nnccBuildQueueItems.filter((item) => item.status === 'blocked').length,
    readyForReview: nnccBuildQueueItems.filter((item) => item.status === 'ready_for_review').length,
    shipped: nnccBuildQueueItems.filter((item) => item.status === 'shipped').length,
    activeSessions: nnccBuildSessions.length,
  };
}
