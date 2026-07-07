import React from 'react';
import { ScrollView } from 'react-native';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getRepositoryHealth } from '../../services/knowledgeRegistry.service';

// Renders repository health information for Founder review.
// This helps surface branch, documentation, and traceability status.
export function RepositoryHealthView() {
  // Loads repository health records from the registry service.
  const healthItems = getRepositoryHealth();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.emerald}
        eyebrow="Monitor Repository"
        title="Repository Status"
        body="Review branch safety, documentation coverage, traceability readiness, and implementation health."
        footer="Repository checks currently use curated Founder OS records."
      />

      {healthItems.map((item) => (
        <MissionPanel
          key={item.id}
          accent={item.level === 'good' ? missionControlTheme.colors.emerald : missionControlTheme.colors.amber}
          eyebrow={item.level}
          title={item.category}
          body={item.summary}
          footer={item.canonicalHome ? item.canonicalHome.path : undefined}
        />
      ))}
    </ScrollView>
  );
}
