import { nnccLiveSeedDocuments } from '../data/nncc.liveSeed';
import { buildKnowledgeRegistrySnapshot } from './liveKnowledgeParser.service';

// Builds the current live-style Knowledge System registry snapshot.
// NNCC-002 uses seed documents now and can swap in repository-loaded documents later.
export function getLiveKnowledgeRegistrySnapshot() {
  return buildKnowledgeRegistrySnapshot(nnccLiveSeedDocuments);
}

// Returns the generated Founder brief for display in the Control Center.
// This keeps the brief generation behind one service boundary.
export function getFounderBrief() {
  return getLiveKnowledgeRegistrySnapshot().founderBrief;
}
