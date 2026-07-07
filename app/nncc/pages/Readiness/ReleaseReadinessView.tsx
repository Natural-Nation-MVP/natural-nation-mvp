import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MissionMetric } from '../../components/MissionMetric';
import { MissionPanel } from '../../components/MissionPanel';
import { getReleaseReadinessReport } from '../../services/releaseReadiness.service';
import { missionControlTheme } from '../../theme/missionControl.theme';
import type { NNCCReadinessItem } from '../../types/releaseReadiness.types';

// Renders the Founder OS Release 1 readiness page.
// This page separates completed foundation work from watch items before PR review.
export function ReleaseReadinessView() {
  const report = getReleaseReadinessReport();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.emerald}
        eyebrow="Review Release Readiness"
        title={report.releaseName}
        body="Review what is complete, what remains under watch, and what must be understood before Founder OS Release 1 is ready for final Founder review."
        footer={`Merge Recommendation: ${report.mergeRecommendation.replaceAll('_', ' ').toUpperCase()}`}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <MissionMetric accent={missionControlTheme.colors.emerald} label="Readiness" value={`${report.readinessPercent}%`} />
        <MissionMetric accent={missionControlTheme.colors.cyan} label="Complete" value={report.completedItems.length} />
        <MissionMetric accent={missionControlTheme.colors.amber} label="Watch" value={report.watchItems.length} />
        <MissionMetric accent={missionControlTheme.colors.purple} label="Blocked" value={report.blockedItems.length} />
      </View>

      <ReadinessSection title="Complete" accent={missionControlTheme.colors.emerald} items={report.completedItems} />
      <ReadinessSection title="Watch" accent={missionControlTheme.colors.amber} items={report.watchItems} />
      <ReadinessSection title="Blocked" accent={missionControlTheme.colors.purple} items={report.blockedItems} />
    </ScrollView>
  );
}

// Renders one readiness status group.
// Keeping this local prevents repeated panel markup across complete, watch, and blocked sections.
function ReadinessSection({ accent, items, title }: { accent: string; items: NNCCReadinessItem[]; title: string }) {
  return (
    <MissionPanel accent={accent} eyebrow="Release 1" title={title}>
      {items.length === 0 ? (
        <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
          No items currently listed in this status.
        </Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {item.id} // {item.title}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {item.summary}
            </Text>
            <Text style={{ color: accent, fontSize: 12, fontWeight: '900', lineHeight: 18, marginTop: 6 }}>
              NEXT: {item.nextAction}
            </Text>
          </View>
        ))
      )}
    </MissionPanel>
  );
}
