export type NNCCReadinessStatus = 'complete' | 'watch' | 'blocked';

export interface NNCCReadinessItem {
  id: string;
  title: string;
  status: NNCCReadinessStatus;
  summary: string;
  nextAction: string;
}

export interface NNCCReleaseReadinessReport {
  releaseId: string;
  releaseName: string;
  readinessPercent: number;
  mergeRecommendation: 'ready_for_founder_review' | 'not_ready';
  completedItems: NNCCReadinessItem[];
  watchItems: NNCCReadinessItem[];
  blockedItems: NNCCReadinessItem[];
}
