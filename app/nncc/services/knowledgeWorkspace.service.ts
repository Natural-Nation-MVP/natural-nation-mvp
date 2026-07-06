import {
  nnccFounderTimelineEvents,
  nnccKnowledgeGroups,
  nnccKnowledgeItems,
} from '../data/nncc.knowledgeWorkspace.seed';
import type { NNCCKnowledgeItem } from '../types/knowledgeWorkspace.types';

// Returns all Knowledge Browser groups.
// This keeps the UI from importing raw seed files directly.
export function getKnowledgeGroups() {
  return nnccKnowledgeGroups;
}

// Returns all curated Knowledge Browser items.
// Future versions can merge these with parsed repository documents.
export function getKnowledgeItems() {
  return nnccKnowledgeItems;
}

// Returns knowledge items for a specific workspace group.
// This powers grouped browsing in the Knowledge Workspace.
export function getKnowledgeItemsByGroup(groupId: string): NNCCKnowledgeItem[] {
  return nnccKnowledgeItems.filter((item) => item.groupId === groupId);
}

// Searches knowledge items by title, summary, path, keywords, and related IDs.
// The search is local and simple so it works immediately in Codespaces and iPad preview.
export function searchKnowledgeItems(query: string): NNCCKnowledgeItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return nnccKnowledgeItems;
  }

  return nnccKnowledgeItems.filter((item) => {
    const searchableText = [
      item.title,
      item.summary,
      item.canonicalPath,
      ...item.keywords,
      ...item.relatedIds,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

// Returns the Founder Timeline events in newest-first order.
// Sorting here keeps the UI simple and consistent.
export function getFounderTimelineEvents() {
  return [...nnccFounderTimelineEvents].sort((first, second) =>
    second.date.localeCompare(first.date),
  );
}

// Returns quick counts for the Knowledge Workspace dashboard.
// This gives the Founder simple health metrics for knowledge coverage.
export function getKnowledgeWorkspaceCounts() {
  return {
    groups: nnccKnowledgeGroups.length,
    items: nnccKnowledgeItems.length,
    timelineEvents: nnccFounderTimelineEvents.length,
    approvedItems: nnccKnowledgeItems.filter((item) => item.status === 'approved').length,
    draftItems: nnccKnowledgeItems.filter((item) => item.status === 'draft_implementation').length,
  };
}
