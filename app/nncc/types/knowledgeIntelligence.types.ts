import type { NNCCStatus } from './nncc.types';

// Defines the type of knowledge relationship shown in NNCC.
// Relationships connect decisions, approvals, builds, prompts, and canonical files.
export type NNCCKnowledgeRelationshipType =
  | 'defines'
  | 'approves'
  | 'depends_on'
  | 'implements'
  | 'references'
  | 'supersedes'
  | 'supports';

// Defines a repository-aware knowledge record.
// These records prepare the Knowledge Workspace for live repository-backed loading.
export interface NNCCKnowledgeRecord {
  id: string;
  title: string;
  recordType: 'document' | 'decision' | 'approval' | 'asset' | 'prompt' | 'architecture' | 'build';
  status: NNCCStatus;
  canonicalPath: string;
  summary: string;
  tags: string[];
  relatedIds: string[];
}

// Defines an edge between two knowledge records.
// The first graph view can render these relationships as grouped panels.
export interface NNCCKnowledgeRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: NNCCKnowledgeRelationshipType;
  summary: string;
}

// Defines one scored search result.
// Scoring helps the Founder see the most relevant knowledge first.
export interface NNCCKnowledgeSearchResult {
  record: NNCCKnowledgeRecord;
  score: number;
  matchedFields: string[];
}

// Defines a summary object for Knowledge Intelligence panels.
// This powers quick system metrics in the Knowledge workspace.
export interface NNCCKnowledgeIntelligenceSummary {
  totalRecords: number;
  approvedRecords: number;
  draftRecords: number;
  relationships: number;
  canonicalHomes: number;
}
