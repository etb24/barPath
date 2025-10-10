import React from 'react';
import { Text, View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../../styles/theme';

type PillProps = {
  label: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  tone?: 'default' | 'accent';
  uppercase?: boolean;
};

export default function Pill({
  label,
  style,
  textStyle,
  tone = 'default',
  uppercase = false,
}: PillProps) {
  return (
    <View
      style={[
        styles.base,
        tone === 'accent' ? styles.accent : styles.default,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          tone === 'accent' ? styles.textAccent : styles.textDefault,
          uppercase && styles.uppercase,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.accentMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(158,255,82,0.32)',
  },
  text: {
    ...typography.caption,
    textTransform: 'none',
  },
  uppercase: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  textDefault: {
    color: colors.textMuted,
  },
  textAccent: {
    color: colors.accent,
    fontWeight: '700',
  },
});
