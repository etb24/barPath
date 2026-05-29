import React from 'react';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Typography from './ui/Typography';
import { colors, radii, spacing, shadow } from '../styles/theme';

export type QuickActionProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
};

export default function QuickAction({ title, subtitle, icon, onPress }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      hitSlop={8}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.texts}>
        <Typography variant="subtitle" weight="bold" style={styles.title}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color={colors.textMuted} style={styles.subtitle}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    ...Platform.select({
      ios: shadow.card,
      android: {
        elevation: shadow.card.elevation,
        shadowColor: shadow.card.shadowColor,
        shadowOpacity: shadow.card.shadowOpacity,
        shadowRadius: shadow.card.shadowRadius,
        shadowOffset: shadow.card.shadowOffset,
      },
    }),
  },
  pressed: { transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  texts: { flex: 1 },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
});
