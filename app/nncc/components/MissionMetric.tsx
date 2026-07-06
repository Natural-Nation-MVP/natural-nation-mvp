import React from 'react';
import { Text, View } from 'react-native';
import { missionControlTheme } from '../theme/missionControl.theme';

interface MissionMetricProps {
  label: string;
  value: string | number;
  helper?: string;
  accent?: string;
}

// Renders a compact Mission Control metric tile.
// These tiles support the Founder Dashboard v2 system status layout.
export function MissionMetric({ label, value, helper, accent }: MissionMetricProps) {
  const metricColor = accent ?? missionControlTheme.colors.cyan;

  return (
    <View
      style={{
        backgroundColor: missionControlTheme.colors.panelStrong,
        borderColor: missionControlTheme.colors.border,
        borderRadius: missionControlTheme.radius.md,
        borderWidth: 1,
        minWidth: 130,
        padding: missionControlTheme.spacing.md,
      }}
    >
      <Text style={{ color: metricColor, fontSize: 28, fontWeight: '900' }}>{value}</Text>
      <Text
        style={{
          color: missionControlTheme.colors.textPrimary,
          fontSize: 12,
          fontWeight: '900',
          letterSpacing: 1,
          marginTop: 4,
        }}
      >
        {label.toUpperCase()}
      </Text>
      {helper ? (
        <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 11, marginTop: 5 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
