import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { MissionMetric } from '../../components/MissionMetric';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import {
  getKnowledgeIntelligenceSummary,
  getKnowledgeRelationships,
  getRelationshipsForRecord,
  searchKnowledgeRecords,
} from '../../services/knowledgeIntelligence.service';

// Renders the Knowledge Intelligence workspace for NNCC.
// This view adds scored search, canonical records, and relationship visibility.
export function KnowledgeWorkspaceView() {
  const [query, setQuery] = useState('');
  const summary = getKnowledgeIntelligenceSummary();
  const results = searchKnowledgeRecords(query);
  const relationships = getKnowledgeRelationships();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.purple}
        eyebrow="Knowledge Intelligence"
        title="Canonical Knowledge Graph"
        body="Search repository-aware Natural Nation records, inspect canonical homes, and see relationships across decisions, approvals, builds, and operating documents."
        footer="Current mode: curated repository-aware intelligence records"
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <MissionMetric accent={missionControlTheme.colors.purple} label="Records" value={summary.totalRecords} />
        <MissionMetric accent={missionControlTheme.colors.emerald} label="Approved" value={summary.approvedRecords} />
        <MissionMetric accent={missionControlTheme.colors.amber} label="Draft" value={summary.draftRecords} />
        <MissionMetric accent={missionControlTheme.colors.cyan} label="Links" value={summary.relationships} />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search knowledge, decisions, approvals, builds, prompts, Duey, blueprint..."
        placeholderTextColor={missionControlTheme.colors.textMuted}
        style={{
          backgroundColor: missionControlTheme.colors.panelStrong,
          borderColor: missionControlTheme.colors.border,
          borderRadius: missionControlTheme.radius.md,
          borderWidth: 1,
          color: missionControlTheme.colors.textPrimary,
          fontSize: 15,
          marginBottom: 18,
          padding: 15,
        }}
      />

      <MissionPanel
        accent={missionControlTheme.colors.cyan}
        eyebrow="Search Results"
        title={`${results.length} Knowledge Matches`}
        body="Results are scored by title, tags, related IDs, canonical path, and summary matches."
      >
        {results.map((result) => {
          const itemRelationships = getRelationshipsForRecord(result.record.id);

          return (
            <View key={result.record.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 14 }}>
              <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 16, fontWeight: '900' }}>
                {result.record.title} // SCORE {result.score}
              </Text>
              <Text style={{ color: missionControlTheme.colors.purple, fontSize: 12, fontWeight: '900', marginTop: 4 }}>
                {result.record.recordType.toUpperCase()} • {result.record.status.toUpperCase()}
              </Text>
              <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 }}>
                {result.record.summary}
              </Text>
              <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
                {result.record.canonicalPath}
              </Text>
              <Text style={{ color: missionControlTheme.colors.cyan, fontSize: 12, fontWeight: '800', marginTop: 6 }}>
                Matches: {result.matchedFields.join(', ')} • Relationships: {itemRelationships.length}
              </Text>
            </View>
          );
        })}
      </MissionPanel>

      <MissionPanel accent={missionControlTheme.colors.emerald} eyebrow="Relationship Map" title="Knowledge Links">
        {relationships.map((relationship) => (
          <View key={relationship.id} style={{ borderTopColor: missionControlTheme.colors.border, borderTopWidth: 1, paddingVertical: 12 }}>
            <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 15, fontWeight: '900' }}>
              {relationship.sourceId} → {relationship.targetId}
            </Text>
            <Text style={{ color: missionControlTheme.colors.emerald, fontSize: 12, fontWeight: '900', marginTop: 4 }}>
              {relationship.type.toUpperCase()}
            </Text>
            <Text style={{ color: missionControlTheme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
              {relationship.summary}
            </Text>
          </View>
        ))}
      </MissionPanel>
    </ScrollView>
  );
}
