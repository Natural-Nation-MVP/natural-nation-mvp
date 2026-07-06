import React from 'react';
import { Text, View } from 'react-native';

// Defines the props accepted by NNCC section headers.
// Section headers keep page headings consistent and readable.
interface NNCCSectionHeaderProps {
  // Main section title.
  title: string;

  // Optional supporting description below the title.
  description?: string;
}

// Renders a page or panel heading inside the Control Center.
// This avoids repeating title styling across NNCC pages.
export function NNCCSectionHeader({ title, description }: NNCCSectionHeaderProps) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: '#064e3b', fontSize: 28, fontWeight: '900', marginBottom: 6 }}>
        {title}
      </Text>

      {description ? (
        <Text style={{ color: '#4b5563', fontSize: 15, lineHeight: 22 }}>{description}</Text>
      ) : null}
    </View>
  );
}
