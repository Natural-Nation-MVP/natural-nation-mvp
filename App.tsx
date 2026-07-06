import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  AiTeamWorkspace,
  ApprovalCenter,
  DecisionRegistryView,
  ExecutiveDashboard,
  FounderBriefView,
  MilestoneDashboard,
  RepositoryHealthView,
  nnccNavigationItems,
} from './app/nncc';

type RouteKey =
  | 'dashboard'
  | 'founder-brief'
  | 'milestones'
  | 'approvals'
  | 'decisions'
  | 'repository'
  | 'ai-team';

export default function App() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>('dashboard');

  return (
    <SafeAreaView style={{ backgroundColor: '#ecfdf5', flex: 1 }}>
      <StatusBar style="dark" />

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ backgroundColor: '#064e3b', maxWidth: 320, minWidth: 260, padding: 18 }}>
          <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '900', marginBottom: 4 }}>
            NNCC
          </Text>

          <Text style={{ color: '#a7f3d0', fontSize: 13, lineHeight: 19, marginBottom: 18 }}>
            Natural Nation Control Center
          </Text>

          <ScrollView>
            {nnccNavigationItems.map((item) => {
              const isActive = item.key === activeRoute;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setActiveRoute(item.key as RouteKey)}
                  style={{
                    backgroundColor: isActive ? '#10b981' : 'transparent',
                    borderRadius: 14,
                    marginBottom: 8,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                    {item.label}
                  </Text>

                  <Text style={{ color: isActive ? '#ecfdf5' : '#a7f3d0', fontSize: 12, lineHeight: 17, marginTop: 4 }}>
                    {item.description}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ flex: 1 }}>{renderPage(activeRoute)}</View>
      </View>
    </SafeAreaView>
  );
}

function renderPage(route: RouteKey) {
  if (route === 'founder-brief') return <FounderBriefView />;
  if (route === 'milestones') return <MilestoneDashboard />;
  if (route === 'approvals') return <ApprovalCenter />;
  if (route === 'decisions') return <DecisionRegistryView />;
  if (route === 'repository') return <RepositoryHealthView />;
  if (route === 'ai-team') return <AiTeamWorkspace />;
  return <ExecutiveDashboard />;
}
