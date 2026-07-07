import React from 'react';
import { ScrollView } from 'react-native';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getFounderTimelineEvents } from '../../services/knowledgeWorkspace.service';

// Renders the Founder OS project history view.
// This gives the Founder a timeline of approvals, builds, and major project events.
export function FounderTimelineView() {
  const events = getFounderTimelineEvents();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.emerald}
        eyebrow="Review Project History"
        title="Founder Timeline"
        body="Review Natural Nation decisions, approvals, implementation milestones, and operating records."
        footer="Timeline powered by NNOS"
      />

      {events.map((event) => (
        <MissionPanel
          key={event.id}
          accent={event.status === 'approved' ? missionControlTheme.colors.emerald : missionControlTheme.colors.cyan}
          eyebrow={`${event.date} • ${event.status}`}
          title={event.title}
          body={event.summary}
          footer={`${event.canonicalPath} • ${event.relatedIds.join(', ')}`}
        />
      ))}
    </ScrollView>
  );
}
