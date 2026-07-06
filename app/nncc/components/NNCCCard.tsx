import React from 'react';
import { Text, View } from 'react-native';

// Defines the props accepted by the reusable NNCC card.
// This keeps dashboard panels visually consistent across pages.
interface NNCCCardProps {
  // Small label shown above the card title.
  eyebrow?: string;

  // Main card heading.
  title: string;

  // Supporting body text.
  body: string;

  // Optional footer text for links, status, or next action.
  footer?: string;
}

// Renders a simple reusable card for the Control Center.
// This component intentionally uses basic React Native primitives for portability.
export function NNCCCard({ eyebrow, title, body, footer }: NNCCCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 14,
        padding: 18,
      }}
    >
      {eyebrow ? (
        <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
          {eyebrow.toUpperCase()}
        </Text>
      ) : null}

      <Text style={{ color: '#111827', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
        {title}
      </Text>

      <Text style={{ color: '#374151', fontSize: 15, lineHeight: 22 }}>{body}</Text>

      {footer ? (
        <Text style={{ color: '#047857', fontSize: 13, fontWeight: '700', marginTop: 12 }}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}
