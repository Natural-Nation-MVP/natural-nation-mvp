// Exports NNCC pages so the main app shell can import them later.
export { ExecutiveDashboard } from './pages/Dashboard/ExecutiveDashboard';
export { FounderBriefView } from './pages/FounderBrief/FounderBriefView';
export { BuildQueueView } from './pages/BuildQueue/BuildQueueView';
export { MilestoneDashboard } from './pages/Milestones/MilestoneDashboard';
export { ApprovalCenter } from './pages/Approvals/ApprovalCenter';
export { DecisionRegistryView } from './pages/Decisions/DecisionRegistryView';
export { RepositoryHealthView } from './pages/Repository/RepositoryHealthView';
export { AiTeamWorkspace } from './pages/AI-Team/AiTeamWorkspace';

// Exports shared NNCC components for reuse inside future Control Center views.
export { NNCCCard } from './components/NNCCCard';
export { NNCCSectionHeader } from './components/NNCCSectionHeader';

// Exports registry services and navigation metadata.
export * from './services/knowledgeRegistry.service';
export * from './services/liveKnowledgeParser.service';
export * from './services/liveRegistry.service';
export * from './services/buildQueue.service';
export * from './data/nncc.navigation';

// Exports NNCC TypeScript models.
export * from './types/nncc.types';
export * from './types/liveKnowledge.types';
export * from './types/buildQueue.types';
