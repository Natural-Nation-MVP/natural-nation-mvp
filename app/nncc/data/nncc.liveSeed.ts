import type { NNCCKnowledgeDocument } from '../types/liveKnowledge.types';

// Provides representative Knowledge System documents for NNCC-002 parsing.
// Future work should replace this with real repository file loading.
export const nnccLiveSeedDocuments: NNCCKnowledgeDocument[] = [
  {
    path: 'knowledge/README.md',
    content: `# Natural Nation Knowledge System

**Status:** Approved
**Canonical Home:** knowledge/README.md

The Knowledge System (NN-KS) is the institutional memory of Natural Nation.

It serves as the single source of truth for all Founder-approved knowledge.`,
  },
  {
    path: 'knowledge/11-founder-operating-system/README.md',
    content: `# 11 — Founder Operating System

**NN-KS Section:** 11
**Status:** Approved
**Canonical Home:** knowledge/11-founder-operating-system/

The Founder Operating System is the executive control layer for Natural Nation.`,
  },
  {
    path: 'knowledge/12-founder-knowledge-intelligence/README.md',
    content: `# 12 — Founder Knowledge Intelligence

**NN-KS Section:** 12
**Status:** Approved
**Canonical Home:** knowledge/12-founder-knowledge-intelligence/

The Founder Knowledge Intelligence Layer turns the Natural Nation Knowledge System into an AI-ready operating layer.`,
  },
  {
    path: 'app/nncc/README.md',
    content: `# Natural Nation Control Center

**Milestone:** NNCC-001
**Status:** Draft Implementation
**Canonical Module Home:** app/nncc/

The Natural Nation Control Center is the Founder-facing operational dashboard for the Natural Nation project.`,
  },
];
