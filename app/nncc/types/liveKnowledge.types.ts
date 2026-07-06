import type { NNCCStatus } from './nncc.types';

// Defines a raw Knowledge System document loaded from a repository source.
// This keeps NNCC independent from a specific file-loading implementation.
export interface NNCCKnowledgeDocument {
  // Repository path for the markdown or source document.
  path: string;

  // Full text content of the document.
  content: string;
}

// Defines the structured metadata extracted from a Knowledge System document.
// NNCC uses this shape to power live dashboard views.
export interface NNCCKnowledgeMetadata {
  // Repository path for the source document.
  path: string;

  // Best detected document title.
  title: string;

  // Optional NN-KS section number or milestone marker.
  section?: string;

  // Status detected from the document front matter or heading block.
  status?: NNCCStatus | string;

  // Canonical home detected from the document.
  canonicalHome?: string;

  // Short generated summary for executive display.
  summary: string;
}

// Defines a parsed Knowledge System registry snapshot.
// This snapshot is the bridge between repository documents and NNCC views.
export interface NNCCKnowledgeRegistrySnapshot {
  // All source documents included in the snapshot.
  documents: NNCCKnowledgeMetadata[];

  // Documents that appear approved or locked.
  approvedDocuments: NNCCKnowledgeMetadata[];

  // Documents that still need review or approval.
  reviewQueue: NNCCKnowledgeMetadata[];

  // Repository paths that look canonical.
  canonicalHomes: string[];

  // Generated summary for the Founder dashboard.
  founderBrief: string;
}
