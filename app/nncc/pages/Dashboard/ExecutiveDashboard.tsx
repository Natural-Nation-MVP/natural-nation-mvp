import React from 'react';
import { ScrollView, View } from 'react-native';
import { MissionMetric } from '../../components/MissionMetric';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import {
  getActiveMilestone,
  getDashboardCounts,
  getDashboardSnapshot,
  getRepositoryHealth,
} from '../../services/knowledgeRegistry.service';

// Renders the Founder-facing Mission Dashboard.
// This is the primary command surface for the Founder/Developer Control Center.
export function ExecutiveDashboard() {
  const snapshot = getDashboardSnapshot();
  const activeMilestone = getActiveMilestone();
  const counts = getDashboardCounts();
  const healthItems = getRepositoryHealth();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.emerald}
        eyebrow="Mission Status"
        title={snapshot.projectName}
        body={snapshot.executiveSummary}
        footer={`System Health: ${snapshot.healthLevel.toUpperCase()}`}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <MissionMetric accent={missionControlTheme.colors.emerald} label="Milestones" value={counts.milestones} />
        <MissionMetric accent={missionControlTheme.colors.amber} label="Approvals" value={counts.approvals} />
        <MissionMetric accent={missionControlTheme.colors.purple} label="Decisions" value={counts.decisions} />
        <MissionMetric accent={missionControlTheme.colors.cyan} label="AI Roles" value={counts.teamRoles} />
      </View>

      {activeMilestone ? (
        <MissionPanel
          accent={missionControlTheme.colors.cyan}
          eyebrow="Active Operation"
          title={`${activeMilestone.id} — ${activeMilestone.name}`}
          body={activeMilestone.summary}
          footer={`${activeMilestone.progressPercent}% complete • Owner: ${activeMilestone.ownerRole}`}
        />
      ) : null}

      <MissionPanel
        accent={missionControlTheme.colors.amber}
        eyebrow="Founder Command"
        title="Recommended Next Action"
        body={snapshot.recommendedNextAction}
      />

      {healthItems.map((item) => (
        <MissionPanel
          key={item.id}
          accent={item.level === 'good' ? missionControlTheme.colors.emerald : missionControlTheme.colors.amber}
          eyebrow={`Repository Health • ${item.level}`}
          title={item.category}
          body={item.summary}
          footer={item.canonicalHome ? item.canonicalHome.path : undefined}
        />
      ))}
    </ScrollView>
  );
}
