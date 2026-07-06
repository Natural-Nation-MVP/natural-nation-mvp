import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MissionMetric } from '../../components/MissionMetric';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import {
  getOperationsMetrics,
  getOperationsSummary,
  getQaCheckpoints,
  getReleaseTracks,
  getRoadmapItems,
} from '../../services/operations.service';

// Renders the Operations Center for the Founder Mission Control interface.
export function OperationsCenterView() {
  const metrics = getOperationsMetrics();
  const roadmap = getRoadmapItems();
  const qa = getQaCheckpoints();
  const releases = getReleaseTracks();
  const summary = getOperationsSummary();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.amber}
        eyebrow="Operations"
        title="Release Control Center"
        body="Track roadmap progress, QA checkpoints, release readiness, and repository operations from one Founder-facing workspace."
        footer="Current mode: seed-backed operations visibility"
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <MissionMetric accent={missionControlTheme.colors.amber} label="Metrics" value={summary.metrics} />
        <MissionMetric accent={missionControlTheme.colors.cyan} label="Roadmap" value={summary.roadmapItems} />
        <MissionMetric accent={missionControlTheme.colors.emerald} label="QA Pass" value={summary.passingQa} />
        <MissionMetric accent={missionControlTheme.colors.purple} label="Releases" value={summary.releaseTracks} />
      </View>

      <MissionPanel accent={missionControlTheme.colors.cyan} eyebrow="Repository Ops" title="Operations Metrics">
        {metrics.map((metric) => (
          <View key={metric.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {metric.label}: {metric.value}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {metric.helper}
            </Text>
          </View>
        ))}
      </MissionPanel>

      <MissionPanel accent={missionControlTheme.colors.emerald} eyebrow="Roadmap" title="Release 1 Build Path">
        {roadmap.map((item) => (
          <View key={item.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {item.id} // {item.title}
            </Text>
            <Text style={{ color: missionControlTheme.colors.emerald, fontSize: 12, fontWeight: '900', marginTop: 4 }}>
              {item.status.toUpperCase()} • {item.progressPercent}%
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {item.summary}
            </Text>
          </View>
        ))}
      </MissionPanel>

      <MissionPanel accent={missionControlTheme.colors.amber} eyebrow="QA" title="Review Checkpoints">
        {qa.map((checkpoint) => (
          <View key={checkpoint.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {checkpoint.title} // {checkpoint.status.toUpperCase()}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 12, marginTop: 4 }}>
              Owner: {checkpoint.ownerRole}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {checkpoint.summary}
            </Text>
          </View>
        ))}
      </MissionPanel>

      <MissionPanel accent={missionControlTheme.colors.purple} eyebrow="Releases" title="Release Tracks">
        {releases.map((release) => (
          <View key={release.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {release.name}
            </Text>
            <Text style={{ color: missionControlTheme.colors.purple, fontSize: 12, fontWeight: '900', marginTop: 4 }}>
              {release.status.toUpperCase()} • {release.target}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {release.summary}
            </Text>
          </View>
        ))}
      </MissionPanel>
    </ScrollView>
  );
}
