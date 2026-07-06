import React from 'react';
import { ScrollView } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { getFounderTimelineEvents } from '../../services/knowledgeWorkspace.service';

// Renders the Founder Timeline.
// This gives Natural Nation a chronological memory of approvals, builds, and major project events.
export function FounderTimelineView() {
  const events = getFounderTimelineEvents();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Founder Timeline"
        description="Review the evolution of Natural Nation decisions, approvals, and implementation milestones."
      />

      {events.map((event) => (
        <NNCCCard
          key={event.id}
          eyebrow={`${event.date} • ${event.status}`}
          title={event.title}
          body={event.summary}
          footer={`${event.canonicalPath} • ${event.relatedIds.join(', ')}`}
        />
      ))}
    </ScrollView>
  );
}
