export const colors = {
  background: '#121212',
  surface: '#161616',
  surfaceAlt: '#1C1C1C',
  surfaceHighlight: '#1A1A1A',
  border: '#242424',
  textPrimary: '#FFFFFF',
  textSecondary: '#CFCFCF',
  textMuted: '#9A9A9A',
  accent: '#C2FD4E',
  accentMuted: 'rgba(194, 253, 78, 0.18)',
  accentStrong: '#D8FF8B',
  destructive: '#FF4444',
  warning: '#FFB347',
  success: '#6CFF8A',
  overlay: 'rgba(8,8,8,0.8)',
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const typography = {
  hero: {
    fontSize: 32,
    fontWeight: '900' as const,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};

export const gradients = {
  hero: ['#12151d', '#12151d', '#181d29'],
  accentGlow: [
    'rgba(158, 255, 82, 0.18)',
    'rgba(158, 255, 82, 0.04)',
    'rgba(18, 22, 33, 0)',
  ],
};

export const layout = {
  screenPadding: {
    top: spacing.xl,
    horizontal: spacing.lg,
    bottom: spacing.xl,
  },
};

export const theme = {
  colors,
  radii,
  spacing,
  typography,
  shadow,
  gradients,
  layout,
};

export type Theme = typeof theme;
