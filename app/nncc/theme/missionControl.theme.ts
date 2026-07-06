// Defines the Founder/Developer Mission Control visual system.
// This style is exclusive to NNCC and does not apply to the consumer Natural Nation app.
export const missionControlTheme = {
  colors: {
    background: '#050b12',
    backgroundElevated: '#07131f',
    panel: 'rgba(10, 24, 38, 0.92)',
    panelStrong: '#0b1b2a',
    border: '#14324a',
    borderGlow: '#22f5a9',
    textPrimary: '#eafff7',
    textSecondary: '#9fb7c7',
    textMuted: '#6f8898',
    emerald: '#22f5a9',
    cyan: '#20d9ff',
    purple: '#b16cff',
    amber: '#ffbf47',
    red: '#ff4d6d',
    blue: '#5aa7ff',
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 32,
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
  },
};

// Defines status colors used by HUD badges and system panels.
// These values keep mission state consistent across all NNCC pages.
export function getMissionStatusColor(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes('approved') || normalizedStatus.includes('good')) {
    return missionControlTheme.colors.emerald;
  }

  if (normalizedStatus.includes('draft') || normalizedStatus.includes('review')) {
    return missionControlTheme.colors.amber;
  }

  if (normalizedStatus.includes('blocked') || normalizedStatus.includes('risk')) {
    return missionControlTheme.colors.red;
  }

  if (normalizedStatus.includes('intelligence') || normalizedStatus.includes('knowledge')) {
    return missionControlTheme.colors.purple;
  }

  return missionControlTheme.colors.cyan;
}
