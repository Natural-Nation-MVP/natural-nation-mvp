import type {
  NNCCAiToolProfile,
  NNCCBuildHistoryEvent,
  NNCCBuildSession,
} from '../types/buildQueue.types';

// Defines the supported AI tool profiles for the AI Operations Center.
// These profiles help the Founder decide which surface should handle each build package.
export const nnccAiToolProfiles: NNCCAiToolProfile[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    status: 'online',
    bestFor: ['strategy', 'requirements', 'documentation', 'review planning'],
    outputType: 'analysis, prompts, architecture notes, and implementation instructions',
    usageRule: 'Use for reasoning-heavy planning, Founder summaries, and cross-system build packages.',
  },
  {
    id: 'codex',
    name: 'Codex',
    status: 'planned',
    bestFor: ['repository edits', 'code implementation', 'tests', 'refactors'],
    outputType: 'commits, patches, and pull request changes',
    usageRule: 'Use when the package requires direct code changes in the repository.',
  },
  {
    id: 'google_ai_studio',
    name: 'Google AI Studio',
    status: 'manual',
    bestFor: ['prototype screens', 'app flows', 'multi-device UI experiments'],
    outputType: 'prototype prompts, app mockups, and UI build instructions',
    usageRule: 'Use for visual app build experiments that need clear Natural Nation context.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    status: 'manual',
    bestFor: ['secondary review', 'large context validation', 'alternative implementation checks'],
    outputType: 'review notes, validation reports, and prompt alternatives',
    usageRule: 'Use as a second reviewer for major architecture, design, or prompt packages.',
  },
  {
    id: 'manual_review',
    name: 'Manual Review',
    status: 'online',
    bestFor: ['Founder approval', 'QA review', 'final acceptance'],
    outputType: 'approval notes and revision requests',
    usageRule: 'Use before any output becomes approved or locked.',
  },
];

// Defines the first AI build sessions.
// These records show how prompt packages will be tracked after generation.
export const nnccBuildSessions: NNCCBuildSession[] = [
  {
    id: 'SESSION-NNCC-001',
    buildItemId: 'BUILD-NNCC-002',
    surface: 'google_ai_studio',
    status: 'prepared',
    startedAt: '2026-07-06',
    summary: 'Google AI Studio package prepared for NNCC dashboard UI direction.',
  },
  {
    id: 'SESSION-NNCC-002',
    buildItemId: 'BUILD-NNCC-001',
    surface: 'codex',
    status: 'prepared',
    startedAt: '2026-07-06',
    summary: 'Repository-loaded Knowledge System package prepared for future implementation.',
  },
];

// Defines AI build history events for Founder traceability.
// These events preserve the audit trail from queue item to package generation and review.
export const nnccBuildHistoryEvents: NNCCBuildHistoryEvent[] = [
  {
    id: 'HISTORY-NNCC-001',
    buildItemId: 'BUILD-NNCC-001',
    date: '2026-07-06',
    title: 'Live Knowledge loader queued',
    status: 'ready_for_prompt',
    summary: 'Created first package for replacing seed Knowledge System documents with repository-loaded markdown.',
    relatedPaths: [
      'app/nncc/services/liveKnowledgeParser.service.ts',
      'app/nncc/services/liveRegistry.service.ts',
    ],
  },
  {
    id: 'HISTORY-NNCC-002',
    buildItemId: 'BUILD-NNCC-002',
    date: '2026-07-06',
    title: 'Google AI Studio prompt package queued',
    status: 'ready_for_prompt',
    summary: 'Created copy-ready Google AI Studio package for visual app build alignment.',
    relatedPaths: ['app/nncc/pages/BuildQueue/BuildQueueView.tsx'],
  },
  {
    id: 'HISTORY-NNCC-003',
    buildItemId: 'BUILD-NNCC-003',
    date: '2026-07-06',
    title: 'Repository health integration planned',
    status: 'planned',
    summary: 'Planned live GitHub health metrics for PRs, branches, commits, and review readiness.',
    relatedPaths: ['app/nncc/pages/Repository/RepositoryHealthView.tsx'],
  },
];
