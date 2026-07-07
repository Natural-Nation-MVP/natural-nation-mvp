import React from 'react';
import { ScrollView } from 'react-native';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getLiveKnowledgeRegistrySnapshot } from '../../services/liveRegistry.service';

// Renders the Founder OS daily brief view.
// This page translates NNOS registry metadata into a quick Founder-readable briefing.
export function FounderBriefView() {
  // Loads the current parsed registry snapshot.
  const snapshot = getLiveKnowledgeRegistrySnapshot();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.emerald}
        eyebrow="Review Daily Brief"
        title="Founder Briefing"
        body="Review the current Founder-facing summary generated from NNOS operating records and registry metadata."
        footer="Powered by NNOS"
      />

      <MissionPanel accent={missionControlTheme.colors.cyan} eyebrow="Daily Brief" title="What Changed" body={snapshot.founderBrief} />

      <MissionPanel
        accent={missionControlTheme.colors.purple}
        eyebrow="Coverage"
        title="Operating Records"
        body={`${snapshot.documents.length} operating records are included in the current Founder OS registry snapshot.`}
      />

      <MissionPanel
        accent={missionControlTheme.colors.amber}
        eyebrow="Approval Review"
        title="Review Queue"
        body={`${snapshot.reviewQueue.length} records currently appear to be in draft or review status.`}
      />

      {snapshot.documents.map((document) => (
        <MissionPanel
          key={document.path}
          accent={missionControlTheme.colors.blue}
          eyebrow={document.status ?? 'unknown status'}
          title={document.title}
          body={document.summary}
          footer={document.canonicalHome ?? document.path}
        />
      ))}
    </ScrollView>
  );
}
