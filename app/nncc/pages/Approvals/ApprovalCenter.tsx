import React from 'react';
import { ScrollView } from 'react-native';
import { NNCCCard } from '../../components/NNCCCard';
import { NNCCSectionHeader } from '../../components/NNCCSectionHeader';
import { getApprovalItems } from '../../services/knowledgeRegistry.service';

// Renders the Founder approval center.
// This view separates approval state from milestone implementation state.
export function ApprovalCenter() {
  // Loads approval records from the registry service.
  const approvalItems = getApprovalItems();

  return (
    <ScrollView style={{ backgroundColor: '#f8fafc', flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <NNCCSectionHeader
        title="Approval Center"
        description="Review Founder approvals, draft implementation items, and canonical approval evidence."
      />

      {approvalItems.map((item) => (
        <NNCCCard
          key={item.id}
          eyebrow={`${item.status} • ${item.date}`}
          title={item.title}
          body={item.note}
          footer={item.canonicalHome.path}
        />
      ))}
    </ScrollView>
  );
}
