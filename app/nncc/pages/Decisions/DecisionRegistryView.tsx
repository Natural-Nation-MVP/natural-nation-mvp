import React from 'react';
import { ScrollView } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { getDecisions } from '../../services/knowledgeRegistry.service';

// Renders the decision registry inside NNCC.
// This gives the Founder a clear view of approved and draft project decisions.
export function DecisionRegistryView() {
  // Loads decision records from the registry service.
  const decisions = getDecisions();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Decision Registry"
        description="Browse Founder decisions and trace each one back to its canonical Knowledge System home."
      />

      {decisions.map((decision) => (
        <NNCCCard
          key={decision.id}
          eyebrow={`${decision.status} • ${decision.milestoneId}`}
          title={decision.id}
          body={decision.decision}
          footer={decision.canonicalHome.path}
        />
      ))}
    </ScrollView>
  );
}
