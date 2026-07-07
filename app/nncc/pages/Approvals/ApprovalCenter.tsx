import React from 'react';
import { ScrollView } from 'react-native';
import { MissionPanel } from '../../components/MissionPanel';
import { missionControlTheme } from '../../theme/missionControl.theme';
import { getApprovalItems } from '../../services/knowledgeRegistry.service';

// Renders the Founder OS approval workflow.
// This view separates approval state from implementation progress so Founder decisions stay clear.
export function ApprovalCenter() {
  // Loads approval records from the registry service.
  const approvalItems = getApprovalItems();

  return (
    <ScrollView
      style={{ backgroundColor: missionControlTheme.colors.background, flex: 1 }}
      contentContainerStyle={{ padding: missionControlTheme.spacing.xl }}
    >
      <MissionPanel
        accent={missionControlTheme.colors.amber}
        eyebrow="Approve Changes"
        title="Founder Approval Queue"
        body="Review approvals, draft implementation items, and canonical evidence before project decisions become locked."
        footer="Founder approval remains required before permanent project decisions change status."
      />

      {approvalItems.map((item) => (
        <MissionPanel
          key={item.id}
          accent={item.status === 'approved' ? missionControlTheme.colors.emerald : missionControlTheme.colors.amber}
          eyebrow={`${item.status} • ${item.date}`}
          title={item.title}
          body={item.note}
          footer={item.canonicalHome.path}
        />
      ))}
    </ScrollView>
  );
}
