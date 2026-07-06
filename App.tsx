import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  AiTeamWorkspace,
  ApprovalCenter,
  BuildQueueView,
  DecisionRegistryView,
  ExecutiveDashboard,
  FounderBriefView,
  FounderTimelineView,
  KnowledgeWorkspaceView,
  MilestoneDashboard,
  MissionHeader,
  RepositoryHealthView,
  missionControlTheme,
  nnccWorkspaceNavigation,
} from './app/nncc';

type RouteKey =
  | 'dashboard'
  | 'founder-brief'
  | 'knowledge'
  | 'timeline'
  | 'build-queue'
  | 'milestones'
  | 'approvals'
  | 'decisions'
  | 'repository'
  | 'ai-team';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>('dashboard');

  return (
    <SafeAreaView style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}>
      <StatusBar style="light" />

      <View style={{ backgroundColor: missionControlTheme.colors.background, flex: 1, flexDirection: 'row' }}>
        <View
          style={{
            backgroundColor: '#06101b',
            borderRightColor: missionControlTheme.colors.border,
            borderRightWidth: 1,
            maxWidth: 340,
            minWidth: 280,
            padding: 18,
          }}
        >
          <Text style={{ color: missionControlTheme.colors.emerald, fontSize: 13, fontWeight: '900', letterSpacing: 2 }}>
            NNCC
          </Text>

          <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 25, fontWeight: '900', marginTop: 5 }}>
            Mission Control
          </Text>

          <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 18, marginTop: 6 }}>
            Founder / Developer command interface
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {nnccWorkspaceNavigation.map((group) => (
              <View key={group.id} style={{ marginBottom: 18 }}>
                <Text
                  style={{
                    color: getGroupAccent(group.accent),
                    fontSize: 11,
                    fontWeight: '900',
                    letterSpacing: 1.6,
                    marginBottom: 8,
                  }}
                >
                  {group.label.toUpperCase()}
                </Text>

                {group.routes.map((item) => {
                  const isActive = item.key === activeRoute;

                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setActiveRoute(item.key as RouteKey)}
                      style={{
                        backgroundColor: isActive ? 'rgba(34, 245, 169, 0.14)' : 'transparent',
                        borderColor: isActive ? missionControlTheme.colors.emerald : 'transparent',
                        borderRadius: 14,
                        borderWidth: 1,
                        marginBottom: 8,
                        padding: 12,
                      }}
                    >
                      <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 14, fontWeight: '900' }}>
                        {item.label}
                      </Text>

                      <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>
                        {item.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }}>
          <MissionHeader />
          <View style={{ flex: 1 }}>{renderPage(activeRoute)}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getGroupAccent(accent: string) {
  if (accent === 'purple') return missionControlTheme.colors.purple;
  if (accent === 'cyan') return missionControlTheme.colors.cyan;
  if (accent === 'amber') return missionControlTheme.colors.amber;
  if (accent === 'blue') return missionControlTheme.colors.blue;
  return missionControlTheme.colors.emerald;
}

function renderPage(route: RouteKey) {
  if (route === 'founder-brief') return <FounderBriefView />;
  if (route === 'knowledge') return <KnowledgeWorkspaceView />;
  if (route === 'timeline') return <FounderTimelineView />;
  if (route === 'build-queue') return <BuildQueueView />;
  if (route === 'milestones') return <MilestoneDashboard />;
  if (route === 'approvals') return <ApprovalCenter />;
  if (route === 'decisions') return <DecisionRegistryView />;
  if (route === 'repository') return <RepositoryHealthView />;
  if (route === 'ai-team') return <AiTeamWorkspace />;
  return <ExecutiveDashboard />;
}
