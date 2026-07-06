import React from 'react';
import { ScrollView } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { getAiTeam } from '../../services/knowledgeRegistry.service';

// Renders the AI team workspace for Founder visibility.
// This maps project roles to ownership domains and canonical knowledge links.
export function AiTeamWorkspace() {
  // Loads AI team role records from the registry service.
  const team = getAiTeam();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="AI Team Workspace"
        description="See role ownership, knowledge domains, and canonical references for the Natural Nation AI team."
      />

      {team.map((member) => (
        <NNCCCard
          key={member.role}
          eyebrow={member.domain}
          title={member.role}
          body={member.responsibilities}
          footer={member.canonicalHome.path}
        />
      ))}
    </ScrollView>
  );
}
