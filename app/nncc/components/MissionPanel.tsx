import React from 'react';
import { Text, View } from 'react-native';
import { missionControlTheme } from '../theme/missionControl.theme';

interface MissionPanelProps {
  eyebrow?: string;
  title: string;
  body?: string;
  footer?: string;
  accent?: string;
  children?: React.ReactNode;
}

// Renders a premium HUD-style panel for the Founder Mission Control UI.
// This component is the primary replacement for flat admin cards.
export function MissionPanel({ eyebrow, title, body, footer, accent, children }: MissionPanelProps) {
  const glowColor = accent ?? missionControlTheme.colors.emerald;

  return (
    <View
      style={{
        backgroundColor: missionControlTheme.colors.panel,
        borderColor: missionControlTheme.colors.border,
        borderRadius: missionControlTheme.radius.lg,
        borderWidth: 1,
        marginBottom: missionControlTheme.spacing.md,
        padding: missionControlTheme.spacing.lg,
        shadowColor: glowColor,
        shadowOpacity: 0.18,
        shadowRadius: 18,
      }}
    >
      <View
        style={{
          backgroundColor: glowColor,
          borderRadius: 999,
          height: 3,
          marginBottom: missionControlTheme.spacing.md,
          opacity: 0.9,
          width: 72,
        }}
      />

      {eyebrow ? (
        <Text
          style={{
            color: glowColor,
            fontSize: 11,
            fontWeight: '900',
            letterSpacing: 1.8,
            marginBottom: missionControlTheme.spacing.xs,
          }}
        >
          {eyebrow.toUpperCase()}
        </Text>
      ) : null}

      <Text
        style={{
          color: missionControlTheme.colors.textPrimary,
          fontSize: 22,
          fontWeight: '900',
          marginBottom: body ? missionControlTheme.spacing.sm : 0,
        }}
      >
        {title}
      </Text>

      {body ? (
        <Text
          style={{
            color: missionControlTheme.colors.textSecondary,
            fontSize: 15,
            lineHeight: 23,
          }}
        >
          {body}
        </Text>
      ) : null}

      {children}

      {footer ? (
        <Text
          style={{
            color: glowColor,
            fontSize: 12,
            fontWeight: '800',
            marginTop: missionControlTheme.spacing.md,
          }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}
