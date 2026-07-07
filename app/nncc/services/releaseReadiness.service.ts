import { nnccReleaseReadinessItems } from '../data/nncc.releaseReadiness.seed';
import type { NNCCReadinessItem, NNCCReleaseReadinessReport } from '../types/releaseReadiness.types';

// Groups readiness items by status for Founder review.
// This keeps Release 1 merge readiness simple and transparent.
export function getReleaseReadinessReport(): NNCCReleaseReadinessReport {
  const completedItems = getItemsByStatus('complete');
  const watchItems = getItemsByStatus('watch');
  const blockedItems = getItemsByStatus('blocked');
  const readinessPercent = Math.round((completedItems.length / nnccReleaseReadinessItems.length) * 100);

  return {
    releaseId: 'NNOS-R1',
    releaseName: 'Founder OS Release 1 Foundation',
    readinessPercent,
    mergeRecommendation: blockedItems.length === 0 ? 'ready_for_founder_review' : 'not_ready',
    completedItems,
    watchItems,
    blockedItems,
  };
}

// Returns readiness items matching a specific status.
// This allows the UI to show complete, watch, and blocked work separately.
function getItemsByStatus(status: NNCCReadinessItem['status']) {
  return nnccReleaseReadinessItems.filter((item) => item.status === status);
}
