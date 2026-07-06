import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import {
  getActiveMilestone,
  getDashboardCounts,
  getDashboardSnapshot,
  getRepositoryHealth,
} from '../../services/knowledgeRegistry.service';

// Renders the Founder-facing executive dashboard.
// This is the first landing view for the Natural Nation Control Center.
export function ExecutiveDashboard() {
  // Loads the high-level dashboard summary from the registry service.
  const snapshot = getDashboardSnapshot();

  // Loads the active milestone so the Founder can see current execution focus.
  const activeMilestone = getActiveMilestone();

  // Loads counts used for quick executive metrics.
  const counts = getDashboardCounts();

  // Loads repository health items for the dashboard preview.
  const healthItems = getRepositoryHealth();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Natural Nation Control Center"
        description="Founder dashboard for project status, approvals, decisions, repository health, and knowledge traceability."
      />

      <NNCCCard
        eyebrow="Project Health"
        title={snapshot.projectName}
        body={snapshot.executiveSummary}
        footer={`Health: ${snapshot.healthLevel.toUpperCase()}`}
      />

      {activeMilestone ? (
        <NNCCCard
          eyebrow="Active Milestone"
          title={`${activeMilestone.id} — ${activeMilestone.name}`}
          body={activeMilestone.summary}
          footer={`${activeMilestone.progressPercent}% complete • Owner: ${activeMilestone.ownerRole}`}
        />
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <Metric label="Milestones" value={counts.milestones} />
        <Metric label="Approvals" value={counts.approvals} />
        <Metric label="Decisions" value={counts.decisions} />
        <Metric label="Team Roles" value={counts.teamRoles} />
      </View>

      <NNCCCard
        eyebrow="Recommended Next Action"
        title="Founder Review"
        body={snapshot.recommendedNextAction}
      />

      <NNCCSectionHeader title="Repository Health Preview" />

      {healthItems.map((item) => (
        <NNCCCard
          key={item.id}
          eyebrow={item.level}
          title={item.category}
          body={item.summary}
          footer={item.canonicalHome ? item.canonicalHome.path : undefined}
        />
      ))}
    </ScrollView>
  );
}

// Renders a compact dashboard metric tile.
// Keeping this local prevents over-componentizing the first dashboard pass.
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={{
        backgroundColor: '#ecfdf5',
        borderColor: '#d1fae5',
        borderRadius: 16,
        borderWidth: 1,
        minWidth: 140,
        padding: 16,
      }}
    >
      <Text style={{ color: '#065f46', fontSize: 26, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: '#047857', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}
