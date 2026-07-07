import React from 'react';
import { ScrollView } from 'react-native';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getMilestones } from '../../services/knowledgeRegistry.service';

// Renders milestone progress for the Founder OS workspace.
// This gives a readable view of approved, active, and draft project milestones.
export function MilestoneDashboard() {
  // Loads milestone records from the registry service.
  const milestones = getMilestones();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.amber}
        eyebrow="Review Milestones"
        title="Milestone Tracker"
        body="Review Natural Nation milestone progress, ownership, status, and canonical NNOS homes."
        footer="Existing IDs remain unchanged for traceability."
      />

      {milestones.map((milestone) => (
        <MissionPanel
          key={milestone.id}
          accent={milestone.status === 'approved' ? missionControlTheme.colors.emerald : missionControlTheme.colors.cyan}
          eyebrow={milestone.status}
          title={`${milestone.id} — ${milestone.name}`}
          body={milestone.summary}
          footer={`${milestone.progressPercent}% complete • ${milestone.canonicalHome.path}`}
        />
      ))}
    </ScrollView>
  );
}
