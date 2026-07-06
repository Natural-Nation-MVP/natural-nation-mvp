import type {
  NNCCKnowledgeDocument,
  NNCCKnowledgeMetadata,
  NNCCKnowledgeRegistrySnapshot,
} from '../types/liveKnowledge.types';

// Finds the first markdown H1 title in a document.
// This gives NNCC a readable title even when no metadata block exists.
function extractTitle(content: string, fallbackPath: string): string {
  const titleLine = content.split('\n').find((line) => line.trim().startsWith('# '));
  return titleLine ? titleLine.replace('# ', '').trim() : fallbackPath;
}

// Extracts a simple metadata value from bold markdown labels.
// Example supported line: **Status:** Approved
function extractBoldLabel(content: string, label: string): string | undefined {
  const expression = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, 'i');
  const match = content.match(expression);
  return match?.[1]?.trim();
}

// Extracts a short summary from the first useful paragraph.
// This keeps Founder brief cards readable and concise.
function extractSummary(content: string): string {
  const paragraph = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 40 && !line.startsWith('#') && !line.startsWith('|'));

  return paragraph ?? 'No summary available yet.';
}

// Parses one Knowledge System document into NNCC metadata.
// The parser is intentionally conservative so it works with simple markdown files.
export function parseKnowledgeDocument(document: NNCCKnowledgeDocument): NNCCKnowledgeMetadata {
  return {
    path: document.path,
    title: extractTitle(document.content, document.path),
    section: extractBoldLabel(document.content, 'NN-KS Section'),
    status: extractBoldLabel(document.content, 'Status'),
    canonicalHome: extractBoldLabel(document.content, 'Canonical Home'),
    summary: extractSummary(document.content),
  };
}

// Builds a live-ready Knowledge System snapshot from loaded documents.
// Future work can feed this function real repository file contents.
export function buildKnowledgeRegistrySnapshot(
  documents: NNCCKnowledgeDocument[],
): NNCCKnowledgeRegistrySnapshot {
  const parsedDocuments = documents.map(parseKnowledgeDocument);

  const approvedDocuments = parsedDocuments.filter((document) => {
    const status = document.status?.toLowerCase() ?? '';
    return status.includes('approved') || status.includes('locked');
  });

  const reviewQueue = parsedDocuments.filter((document) => {
    const status = document.status?.toLowerCase() ?? '';
    return status.includes('draft') || status.includes('review');
  });

  const canonicalHomes = parsedDocuments
    .map((document) => document.canonicalHome)
    .filter((home): home is string => Boolean(home));

  return {
    documents: parsedDocuments,
    approvedDocuments,
    reviewQueue,
    canonicalHomes,
    founderBrief: buildFounderBrief(parsedDocuments, reviewQueue),
  };
}

// Creates a short Founder brief from parsed registry data.
// This will power the first live-style Daily Founder Brief panel.
function buildFounderBrief(
  documents: NNCCKnowledgeMetadata[],
  reviewQueue: NNCCKnowledgeMetadata[],
): string {
  const approvedCount = documents.filter((document) => {
    const status = document.status?.toLowerCase() ?? '';
    return status.includes('approved') || status.includes('locked');
  }).length;

  return `NNCC scanned ${documents.length} knowledge documents. ${approvedCount} appear approved or locked. ${reviewQueue.length} still need review or approval.`;
}
