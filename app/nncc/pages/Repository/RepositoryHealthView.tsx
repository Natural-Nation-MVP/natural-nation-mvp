import React from 'react';
import { ScrollView } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { getRepositoryHealth } from '../../services/knowledgeRegistry.service';

// Renders repository health information for Founder review.
// This helps surface branch, documentation, and traceability status.
export function RepositoryHealthView() {
  // Loads repository health records from the registry service.
  const healthItems = getRepositoryHealth();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Repository Health"
        description="Review branch safety, documentation coverage, and traceability readiness."
      />

      {healthItems.map((item) => (
        <NNCCCard
          key={item.id}
          eyebrow={item.level}
          title={item.category}
          body={item.summary}
          footer={item.canonicalHome ? item.canonicalHome.path : undefined}
        />
      ))}
    </ScrollView>
  );
}
