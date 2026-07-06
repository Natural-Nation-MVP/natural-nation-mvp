import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MissionMetric } from '../../components/MissionMetric';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import {
  createBuildPromptPackage,
  getAiOperationsSummary,
  getAiToolProfiles,
  getBuildHistoryEvents,
  getBuildQueueItems,
  getBuildSessions,
} from '../../services/buildQueue.service';

// Renders the AI Operations Center for the Founder Control Center.
// This view expands the original Build Queue into tools, sessions, history, and copy-ready prompt packages.
export function BuildQueueView() {
  const items = getBuildQueueItems();
  const summary = getAiOperationsSummary();
  const toolProfiles = getAiToolProfiles();
  const sessions = getBuildSessions();
  const historyEvents = getBuildHistoryEvents();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.cyan}
        eyebrow="AI Operations"
        title="Build Queue Command Center"
        body="Turn approved Natural Nation knowledge into structured work packages for ChatGPT, Codex, Google AI Studio, Gemini, and Founder review."
        footer="Founder approval remains required before permanent adoption."
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <MissionMetric accent={missionControlTheme.colors.cyan} label="Build Items" value={summary.totalBuildItems} />
        <MissionMetric accent={missionControlTheme.colors.emerald} label="Ready" value={summary.readyForPrompt} />
        <MissionMetric accent={missionControlTheme.colors.amber} label="Sessions" value={summary.activeSessions} />
        <MissionMetric accent={missionControlTheme.colors.purple} label="Shipped" value={summary.shipped} />
      </View>

      <MissionPanel accent={missionControlTheme.colors.purple} eyebrow="Tool Profiles" title="AI Surface Matrix">
        {toolProfiles.map((tool) => (
          <View
            key={tool.id}
            style={{
              borderColor: missionControlTheme.colors.border,
              borderTopWidth: 1,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
              {tool.name} // {tool.status.toUpperCase()}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              Best for: {tool.bestFor.join(', ')}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
              {tool.usageRule}
            </Text>
          </View>
        ))}
      </MissionPanel>

      {items.map((item) => {
        const promptPackage = createBuildPromptPackage(item);

        return (
          <MissionPanel
            key={item.id}
            accent={item.surface === 'google_ai_studio' ? missionControlTheme.colors.purple : missionControlTheme.colors.cyan}
            eyebrow={`${item.surface} • ${item.status}`}
            title={`${item.id} — ${item.title}`}
            body={item.summary}
            footer={`${item.milestoneId} • Owner: ${item.ownerRole} • Approval: ${item.approvalStatus}`}
          >
            <View
              style={{
                backgroundColor: '#020617',
                borderColor: missionControlTheme.colors.border,
                borderRadius: missionControlTheme.radius.md,
                borderWidth: 1,
                marginTop: 16,
                padding: 16,
              }}
            >
              <Text style={{ color: missionControlTheme.colors.emerald, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 }}>
                COPY-READY PROMPT PACKAGE
              </Text>

              <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                {promptPackage.prompt}
              </Text>
            </View>
          </MissionPanel>
        );
      })}

      <MissionPanel accent={missionControlTheme.colors.amber} eyebrow="Sessions" title="Active AI Build Sessions">
        {sessions.map((session) => (
          <View key={session.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 15, fontWeight: '900' }}>
              {session.id} // {session.status.toUpperCase()}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {session.summary}
            </Text>
          </View>
        ))}
      </MissionPanel>

      <MissionPanel accent={missionControlTheme.colors.emerald} eyebrow="History" title="Build History Log">
        {historyEvents.map((event) => (
          <View key={event.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 15, fontWeight: '900' }}>
              {event.date} // {event.title}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {event.summary}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
              {event.relatedPaths.join(' • ')}
            </Text>
          </View>
        ))}
      </MissionPanel>
    </ScrollView>
  );
}
