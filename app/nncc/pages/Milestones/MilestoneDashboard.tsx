import React from 'react';
import { ScrollView } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { getMilestones } from '../../services/knowledgeRegistry.service';

// Renders milestone progress for the Founder workspace.
// This gives a readable view of approved, active, and draft project milestones.
export function MilestoneDashboard() {
  // Loads milestone records from the registry service.
  const milestones = getMilestones();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Milestones"
        description="Track Natural Nation milestone progress, ownership, status, and canonical homes."
      />

      {milestones.map((milestone) => (
        <NNCCCard
          key={milestone.id}
          eyebrow={milestone.status}
          title={`${milestone.id} — ${milestone.name}`}
          body={milestone.summary}
          footer={`${milestone.progressPercent}% complete • ${milestone.canonicalHome.path}`}
        />
      ))}
    </ScrollView>
  );
}
