import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MissionMetric } from '../../components/MissionMetric';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getImplementationVerificationReport } from '../../services/implementationVerification.service';

// Renders the Founder OS implementation verification dashboard.
// This confirms route readiness, system status, and Founder OS migration progress.
export function ImplementationVerificationView() {
  const report = getImplementationVerificationReport();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.emerald}
        eyebrow="Verify Implementation"
        title="Founder OS Verification"
        body="Founder-confirmed route checks, NNOS migration status, action-oriented navigation readiness, and system-level implementation indicators."
        footer="Founder OS remains seed-backed until live repository intelligence is implemented."
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <MissionMetric accent={missionControlTheme.colors.emerald} label="Overall" value={`${report.overallPercent}%`} />
        <MissionMetric accent={missionControlTheme.colors.cyan} label="Routes" value={`${report.operationalRoutes}/${report.totalRoutes}`} />
        <MissionMetric accent={missionControlTheme.colors.purple} label="Systems" value={`${report.operationalSystems}/${report.totalSystems}`} />
      </View>

      <MissionPanel accent={missionControlTheme.colors.cyan} eyebrow="Routes" title="Action Route Verification">
        {report.routeItems.map((item) => (
          <View key={item.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {item.label} // {item.status.toUpperCase()}
            </Text>
            <Text style={{ color: missionControlTheme.colors.cyan, fontSize: 12, fontWeight: '900', marginTop: 4 }}>
              {item.workspace} • {item.routeKey}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {item.evidence}
            </Text>
          </View>
        ))}
      </MissionPanel>

      <MissionPanel accent={missionControlTheme.colors.purple} eyebrow="Systems" title="Founder OS System Verification">
        {report.systemItems.map((item) => (
          <View key={item.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {item.label} // {item.status.toUpperCase()}
            </Text>
            <Text style={{ color: missionControlTheme.colors.purple, fontSize: 12, fontWeight: '900', marginTop: 4 }}>
              {item.category.toUpperCase()}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {item.evidence}
            </Text>
          </View>
        ))}
      </MissionPanel>
    </ScrollView>
  );
}
