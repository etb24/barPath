import type { TextStyle } from 'react-native';

// Dark-only palette. The accent is sampled from the app icon (assets/images/icon.png)
// so the home-screen icon, splash, and in-app actions all read as one brand.
export const colors = {
  background: '#0B0B0C',
  surface: '#151517',
  surfaceRaised: '#1E1E21',
  border: '#2A2A2F',
  borderStrong: '#3B3B42',
  textPrimary: '#F5F5F7',
  textSecondary: '#ADADB8',
  textMuted: '#7D7D88',
  accent: '#AADC57',
  accentPressed: '#95C74A',
  accentSoft: 'rgba(170, 220, 87, 0.14)',
  onAccent: '#0B0B0C',
  destructive: '#FF5C5C',
  destructiveSoft: 'rgba(255, 92, 92, 0.14)',
  warning: '#FFB347',
  scrim: 'rgba(0, 0, 0, 0.55)',
  videoBackdrop: '#000000',
} as const;

// 4pt scale: every gap/padding in the app is one of these, which is what makes screens feel aligned
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const layout = {
  screenPadding: 20,
  controlHeight: 52,
  controlHeightSm: 44,
  minTouchTarget: 44, // iOS HIG / WCAG minimum
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

// Every variant carries a lineHeight so stacked text has predictable rhythm
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;
