import {
  nnccKnowledgeRecords,
  nnccKnowledgeRelationships,
} from '../data/nncc.knowledgeIntelligence.seed';
import type {
  NNCCKnowledgeRecord,
  NNCCKnowledgeSearchResult,
} from '../types/knowledgeIntelligence.types';

// Returns the repository-aware knowledge records used by Knowledge Intelligence.
export function getKnowledgeRecords(): NNCCKnowledgeRecord[] {
  return nnccKnowledgeRecords;
}

// Returns all relationship edges between knowledge records.
export function getKnowledgeRelationships() {
  return nnccKnowledgeRelationships;
}

// Returns relationship edges that reference a specific knowledge record.
export function getRelationshipsForRecord(recordId: string) {
  return nnccKnowledgeRelationships.filter(
    (relationship) => relationship.sourceId === recordId || relationship.targetId === recordId,
  );
}

// Searches knowledge records with a simple weighted score.
// Title matches score higher than tag, path, or summary matches.
export function searchKnowledgeRecords(query: string): NNCCKnowledgeSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return nnccKnowledgeRecords.map((record) => ({
      record,
      score: 1,
      matchedFields: ['all'],
    }));
  }

  return nnccKnowledgeRecords
    .map((record) => scoreKnowledgeRecord(record, normalizedQuery))
    .filter((result) => result.score > 0)
    .sort((first, second) => second.score - first.score);
}

// Returns summary counts for the Knowledge Intelligence workspace.
export function getKnowledgeIntelligenceSummary() {
  return {
    totalRecords: nnccKnowledgeRecords.length,
    approvedRecords: nnccKnowledgeRecords.filter((record) => record.status === 'approved').length,
    draftRecords: nnccKnowledgeRecords.filter((record) => record.status === 'draft_implementation').length,
    relationships: nnccKnowledgeRelationships.length,
    canonicalHomes: new Set(nnccKnowledgeRecords.map((record) => record.canonicalPath)).size,
  };
}

// Calculates a simple search score for one knowledge record.
function scoreKnowledgeRecord(record: NNCCKnowledgeRecord, query: string): NNCCKnowledgeSearchResult {
  let score = 0;
  const matchedFields: string[] = [];

  if (record.title.toLowerCase().includes(query)) {
    score += 5;
    matchedFields.push('title');
  }

  if (record.tags.join(' ').toLowerCase().includes(query)) {
    score += 4;
    matchedFields.push('tags');
  }

  if (record.relatedIds.join(' ').toLowerCase().includes(query)) {
    score += 3;
    matchedFields.push('relatedIds');
  }

  if (record.canonicalPath.toLowerCase().includes(query)) {
    score += 2;
    matchedFields.push('path');
  }

  if (record.summary.toLowerCase().includes(query)) {
    score += 1;
    matchedFields.push('summary');
  }

  return { record, score, matchedFields };
}
