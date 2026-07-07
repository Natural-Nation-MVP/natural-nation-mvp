import React from 'react';
import { ScrollView } from 'react-native';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getAiTeam } from '../../services/knowledgeRegistry.service';

// Renders the Founder OS AI team coordination page.
// This maps project roles to ownership domains and canonical NNOS links.
export function AiTeamWorkspace() {
  // Loads AI team role records from the registry service.
  const team = getAiTeam();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.cyan}
        eyebrow="Coordinate AI Team"
        title="AI Team Map"
        body="Review AI roles, ownership domains, handoffs, and canonical NNOS references."
        footer="AI work should stay aligned with Founder-approved operating records."
      />

      {team.map((member) => (
        <MissionPanel
          key={member.role}
          accent={missionControlTheme.colors.blue}
          eyebrow={member.domain}
          title={member.role}
          body={member.responsibilities}
          footer={member.canonicalHome.path}
        />
      ))}
    </ScrollView>
  );
}
