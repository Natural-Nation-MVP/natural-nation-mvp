import type { NNCCStatus } from './nncc.types';

// Defines the AI tool surfaces NNCC can prepare work for.
// These values keep build packages consistent across ChatGPT, Codex, and Google AI Studio.
export type NNCCBuildSurface = 'chatgpt' | 'codex' | 'google_ai_studio' | 'gemini' | 'manual_review';

// Defines the current lifecycle state of a build queue item.
// Founder approval remains separate from implementation state.
export type NNCCBuildQueueStatus =
  | 'planned'
  | 'ready_for_prompt'
  | 'in_progress'
  | 'blocked'
  | 'ready_for_review'
  | 'approved'
  | 'shipped';

// Defines one work package that can be assigned to an AI tool or reviewer.
// The goal is to make every build request traceable to approved Natural Nation knowledge.
export interface NNCCBuildQueueItem {
  // Stable build item ID.
  id: string;

  // Human-readable work title.
  title: string;

  // Which tool or surface should receive the build package.
  surface: NNCCBuildSurface;

  // Current build queue status.
  status: NNCCBuildQueueStatus;

  // Related milestone or project phase.
  milestoneId: string;

  // Owner role responsible for stewarding the task.
  ownerRole: string;

  // Short task summary shown in NNCC.
  summary: string;

  // Repository paths or knowledge files that should guide the task.
  contextPaths: string[];

  // Acceptance criteria that must be true before review.
  acceptanceCriteria: string[];

  // Approval state for Founder review.
  approvalStatus: NNCCStatus;
}

// Defines the prompt package generated from a build queue item.
// This is the copy-ready object NNCC can hand to an AI build tool.
export interface NNCCBuildPromptPackage {
  // Build item ID this prompt came from.
  buildItemId: string;

  // Target AI surface.
  surface: NNCCBuildSurface;

  // Prompt title for human readability.
  title: string;

  // Full prompt text to copy into the selected tool.
  prompt: string;
}

// Defines an AI tool profile shown inside the AI Operations Center.
// Tool profiles explain which AI surface should handle which kind of work.
export interface NNCCAiToolProfile {
  id: NNCCBuildSurface;
  name: string;
  status: 'online' | 'manual' | 'planned';
  bestFor: string[];
  outputType: string;
  usageRule: string;
}

// Defines one AI build session record.
// Sessions track when a build package is prepared, executed, or reviewed.
export interface NNCCBuildSession {
  id: string;
  buildItemId: string;
  surface: NNCCBuildSurface;
  status: 'prepared' | 'sent_to_tool' | 'awaiting_result' | 'result_received' | 'reviewed';
  startedAt: string;
  summary: string;
  outputReference?: string;
}

// Defines one build history event.
// History events preserve the audit trail from prompt package to Founder review.
export interface NNCCBuildHistoryEvent {
  id: string;
  buildItemId: string;
  date: string;
  title: string;
  status: NNCCBuildQueueStatus;
  summary: string;
  relatedPaths: string[];
}

// Defines a top-level AI Operations summary.
// This powers the Mission Control metrics for Build Queue completion.
export interface NNCCAiOperationsSummary {
  totalBuildItems: number;
  readyForPrompt: number;
  inProgress: number;
  blocked: number;
  readyForReview: number;
  shipped: number;
  activeSessions: number;
}
