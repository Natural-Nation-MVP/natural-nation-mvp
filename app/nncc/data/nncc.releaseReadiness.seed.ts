import type { NNCCReadinessItem } from '../types/releaseReadiness.types';

// Defines Founder OS Release 1 readiness checkpoints.
// These items separate completed foundation work from watch items that remain seed-backed.
export const nnccReleaseReadinessItems: NNCCReadinessItem[] = [
  {
    id: 'READY-R1-001',
    title: 'Founder OS Rebrand',
    status: 'complete',
    summary: 'Founder OS branding is active in the shell, header, dashboard, navigation, and verification language.',
    nextAction: 'Founder has already confirmed the rebrand is visible in the app.',
  },
  {
    id: 'READY-R1-002',
    title: 'Action-Oriented Navigation',
    status: 'complete',
    summary: 'Primary workspaces now use action titles such as Monitor, Review, Approve, Explore, Generate, Manage, and Verify.',
    nextAction: 'Keep using action titles for future command palette and AI workflow launcher work.',
  },
  {
    id: 'READY-R1-003',
    title: 'Founder OS Page Polish',
    status: 'complete',
    summary: 'Legacy light pages were migrated to dark Founder OS panels and NNOS-aligned language.',
    nextAction: 'Continue visual QA on iPad and desktop widths before merge.',
  },
  {
    id: 'READY-R1-004',
    title: 'Implementation Verification',
    status: 'complete',
    summary: 'Verification now tracks action routes, Founder OS migration status, and system readiness.',
    nextAction: 'Use Verify Implementation as the final pre-merge check page.',
  },
  {
    id: 'READY-R1-005',
    title: 'Project Intelligence Foundation',
    status: 'complete',
    summary: 'Project Intelligence provides operating records, relationship views, and scored search using curated repository-aware data.',
    nextAction: 'Defer true live repository indexing to Release 2.',
  },
  {
    id: 'READY-R1-006',
    title: 'Seed-Backed Runtime Data',
    status: 'watch',
    summary: 'Founder OS currently uses curated seed data instead of live GitHub runtime data.',
    nextAction: 'Keep this as an explicit Release 1 limitation and schedule live repository intelligence for Release 2.',
  },
  {
    id: 'READY-R1-007',
    title: 'PR Merge Review',
    status: 'watch',
    summary: 'PR #1 remains the review container for Founder OS foundation work.',
    nextAction: 'Perform final Founder review, then decide whether to merge the draft PR or continue Release 1 additions.',
  },
  {
    id: 'READY-R1-008',
    title: 'Automated Test Coverage',
    status: 'watch',
    summary: 'Manual iPad route verification is confirmed, but automated test coverage is not yet implemented.',
    nextAction: 'Add lightweight automated checks before production hardening.',
  },
];
