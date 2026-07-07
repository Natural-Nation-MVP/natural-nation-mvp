import React from 'react';
import { Text, View } from 'react-native';
import { missionControlTheme } from '../theme/missionControl.theme';

// Renders the persistent Founder OS header.
// This presents NNCC as the Founder-facing interface powered by NNOS.
export function MissionHeader() {
  return (
    <View
      style={{
        backgroundColor: missionControlTheme.colors.panel,
        borderBottomColor: missionControlTheme.colors.border,
        borderBottomWidth: 1,
        paddingHorizontal: missionControlTheme.spacing.xl,
        paddingVertical: missionControlTheme.spacing.lg,
      }}
    >
      <Text
        style={{
          color: missionControlTheme.colors.emerald,
          fontSize: 12,
          fontWeight: '900',
          letterSpacing: 2.5,
          marginBottom: 6,
        }}
      >
        NATURAL NATION // FOUNDER OS
      </Text>

      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: missionControlTheme.colors.textPrimary, fontSize: 28, fontWeight: '900' }}>
            Executive Operating Environment
          </Text>
          <Text style={{ color: missionControlTheme.colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 6 }}>
            Powered by the Natural Nation Operating System (NNOS)
          </Text>
        </View>

        <View
          style={{
            alignItems: 'center',
            borderColor: missionControlTheme.colors.emerald,
            borderRadius: 999,
            borderWidth: 1,
            flexDirection: 'row',
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <View
            style={{
              backgroundColor: missionControlTheme.colors.emerald,
              borderRadius: 999,
              height: 8,
              marginRight: 8,
              width: 8,
            }}
          />
          <Text style={{ color: missionControlTheme.colors.emerald, fontSize: 12, fontWeight: '900' }}>
            FOUNDER OS ONLINE
          </Text>
        </View>
      </View>
    </View>
  );
}
