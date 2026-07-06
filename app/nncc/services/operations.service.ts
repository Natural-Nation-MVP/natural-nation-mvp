import {
  nnccOperationsMetrics,
  nnccQaCheckpoints,
  nnccReleaseTracks,
  nnccRoadmapItems,
} from '../data/nncc.operations.seed';

// Returns operations metric records.
export function getOperationsMetrics() {
  return nnccOperationsMetrics;
}

// Returns roadmap records.
export function getRoadmapItems() {
  return nnccRoadmapItems;
}

// Returns QA checkpoint records.
export function getQaCheckpoints() {
  return nnccQaCheckpoints;
}

// Returns release track records.
export function getReleaseTracks() {
  return nnccReleaseTracks;
}

// Returns simple totals for the Operations Center.
export function getOperationsSummary() {
  return {
    metrics: nnccOperationsMetrics.length,
    roadmapItems: nnccRoadmapItems.length,
    qaCheckpoints: nnccQaCheckpoints.length,
    releaseTracks: nnccReleaseTracks.length,
    passingQa: nnccQaCheckpoints.filter((checkpoint) => checkpoint.status === 'passing').length,
    needsReviewQa: nnccQaCheckpoints.filter((checkpoint) => checkpoint.status === 'needs_review').length,
  };
}
