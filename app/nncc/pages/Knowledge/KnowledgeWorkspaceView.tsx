import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import {
  getKnowledgeGroups,
  getKnowledgeWorkspaceCounts,
  searchKnowledgeItems,
} from '../../services/knowledgeWorkspace.service';

// Renders the Knowledge Workspace for NNCC.
// This view gives the Founder grouped browsing and global local search.
export function KnowledgeWorkspaceView() {
  const [query, setQuery] = useState('');
  const groups = getKnowledgeGroups();
  const counts = getKnowledgeWorkspaceCounts();
  const results = searchKnowledgeItems(query);

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Knowledge Workspace"
        description="Browse, search, and trace Natural Nation knowledge by Founder workflow instead of raw repository folders."
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <Metric label="Groups" value={counts.groups} />
        <Metric label="Items" value={counts.items} />
        <Metric label="Approved" value={counts.approvedItems} />
        <Metric label="Draft" value={counts.draftItems} />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search knowledge, decisions, prompts, Duey, blueprint, wellness score..."
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          borderRadius: 16,
          borderWidth: 1,
          color: '#111827',
          fontSize: 15,
          marginBottom: 18,
          padding: 14,
        }}
      />

      <NNCCSectionHeader title="Knowledge Groups" />

      {groups.map((group) => (
        <NNCCCard
          key={group.id}
          eyebrow="workspace group"
          title={group.name}
          body={group.description}
          footer={group.paths.join(' • ')}
        />
      ))}

      <NNCCSectionHeader title="Search Results" description={`${results.length} matching knowledge items`} />

      {results.map((item) => (
        <NNCCCard
          key={item.id}
          eyebrow={`${item.status} • ${item.groupId}`}
          title={item.title}
          body={item.summary}
          footer={item.canonicalPath}
        />
      ))}
    </ScrollView>
  );
}

// Renders compact metric cards for Knowledge Workspace counts.
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={{
        backgroundColor: '#eef2ff',
        borderColor: '#c7d2fe',
        borderRadius: 16,
        borderWidth: 1,
        minWidth: 120,
        padding: 14,
      }}
    >
      <Text style={{ color: '#3730a3', fontSize: 24, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: '#4338ca', fontSize: 12, fontWeight: '800', marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}
