import React from 'react';
import { ScrollView } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { getLiveKnowledgeRegistrySnapshot } from '../../services/liveRegistry.service';

// Renders the first live-style Founder Brief view.
// It uses parsed Knowledge System metadata instead of only static dashboard cards.
export function FounderBriefView() {
  // Loads the current parsed registry snapshot.
  const snapshot = getLiveKnowledgeRegistrySnapshot();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Founder Brief"
        description="Live-style summary generated from Knowledge System registry metadata."
      />

      <NNCCCard eyebrow="Daily Brief" title="What Changed" body={snapshot.founderBrief} />

      <NNCCCard
        eyebrow="Coverage"
        title="Knowledge Documents"
        body={`${snapshot.documents.length} documents are included in the current NNCC registry snapshot.`}
      />

      <NNCCCard
        eyebrow="Approval Review"
        title="Review Queue"
        body={`${snapshot.reviewQueue.length} documents currently appear to be in draft or review status.`}
      />

      {snapshot.documents.map((document) => (
        <NNCCCard
          key={document.path}
          eyebrow={document.status ?? 'unknown status'}
          title={document.title}
          body={document.summary}
          footer={document.canonicalHome ?? document.path}
        />
      ))}
    </ScrollView>
  );
}
