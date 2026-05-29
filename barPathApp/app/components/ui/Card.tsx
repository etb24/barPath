import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, ViewProps } from 'react-native';
import { colors, radii, spacing, shadow } from '../../styles/theme';

type CardProps = ViewProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'secondary' | 'accent';
  padded?: boolean;
};

export default function Card({
  children,
  style,
  tone = 'default',
  padded = true,
  ...rest
}: CardProps) {
  const toneStyle =
    tone === 'accent'
      ? accentStyles.card
      : tone === 'secondary'
      ? secondaryStyles.card
      : defaultStyles.card;

  return (
    <View
      {...rest}
      style={[styles.card, toneStyle, padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});

const defaultStyles = StyleSheet.create({
  card: {
    ...shadow.card,
  },
});

const secondaryStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
  },
});

const accentStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.accentMuted,
    borderColor: 'rgba(158,255,82,0.32)',
  },
});
