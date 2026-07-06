import type { NNCCStatus } from './nncc.types';

// Defines a top-level workspace group in the Knowledge Browser.
// Groups help the Founder browse knowledge without thinking in folder paths.
export interface NNCCKnowledgeGroup {
  // Stable group ID used by filters and UI cards.
  id: string;

  // Human-readable group name.
  name: string;

  // Short group purpose shown in the browser.
  description: string;

  // Repository paths that belong to this group.
  paths: string[];
}

// Defines one searchable knowledge item.
// This is separate from parsed markdown so the UI can show curated entries immediately.
export interface NNCCKnowledgeItem {
  // Stable knowledge item ID.
  id: string;

  // Display title.
  title: string;

  // Workspace group ID.
  groupId: string;

  // Current approval or implementation status.
  status: NNCCStatus;

  // Canonical repository path.
  canonicalPath: string;

  // Searchable summary.
  summary: string;

  // Search keywords for fast local filtering.
  keywords: string[];

  // Related milestone IDs, decision IDs, or build IDs.
  relatedIds: string[];
}

// Defines one chronological Founder Timeline event.
// Timeline records explain how the project evolved and why decisions were made.
export interface NNCCFounderTimelineEvent {
  // Stable event ID.
  id: string;

  // ISO-like date string for display and sorting.
  date: string;

  // Event title.
  title: string;

  // Event status.
  status: NNCCStatus;

  // Short event summary.
  summary: string;

  // Canonical path or repository proof for the event.
  canonicalPath: string;

  // Related IDs across milestones, approvals, decisions, or build items.
  relatedIds: string[];
}
