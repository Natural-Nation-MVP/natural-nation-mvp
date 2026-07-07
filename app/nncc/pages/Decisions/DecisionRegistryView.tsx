import React from 'react';
import { ScrollView } from 'react-native';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getDecisions } from '../../services/knowledgeRegistry.service';

// Renders the Founder OS decision review page.
// This gives the Founder a clear view of approved and draft project decisions.
export function DecisionRegistryView() {
  // Loads decision records from the registry service.
  const decisions = getDecisions();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.purple}
        eyebrow="Review Decisions"
        title="Decision Registry"
        body="Trace Founder decisions, approval status, and canonical NNOS references."
        footer="Decision history remains linked to stable IDs and repository paths."
      />

      {decisions.map((decision) => (
        <MissionPanel
          key={decision.id}
          accent={decision.status === 'approved' ? missionControlTheme.colors.emerald : missionControlTheme.colors.amber}
          eyebrow={`${decision.status} • ${decision.milestoneId}`}
          title={decision.id}
          body={decision.decision}
          footer={decision.canonicalHome.path}
        />
      ))}
    </ScrollView>
  );
}
