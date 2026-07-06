import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { createBuildPromptPackage, getBuildQueueItems } from '../../services/buildQueue.service';

// Renders the AI Build Queue for the Founder Control Center.
// This view shows AI-ready work packages and the prompt each package can generate.
export function BuildQueueView() {
  const items = getBuildQueueItems();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="AI Build Queue"
        description="Turn approved Natural Nation context into structured work packages for ChatGPT, Codex, Google AI Studio, Gemini, and review workflows."
      />

      {items.map((item) => {
        const promptPackage = createBuildPromptPackage(item);

        return (
          <View key={item.id} style={{ marginBottom: 18 }}>
            <NNCCCard
              eyebrow={`${item.surface} • ${item.status}`}
              title={`${item.id} — ${item.title}`}
              body={item.summary}
              footer={`${item.milestoneId} • Owner: ${item.ownerRole}`}
            />

            <View
              style={{
                backgroundColor: '#111827',
                borderRadius: 16,
                marginTop: -4,
                padding: 16,
              }}
            >
              <Text style={{ color: '#a7f3d0', fontSize: 12, fontWeight: '800', marginBottom: 8 }}>
                COPY-READY PROMPT PACKAGE
              </Text>

              <Text style={{ color: '#f9fafb', fontSize: 13, lineHeight: 19 }}>
                {promptPackage.prompt}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
