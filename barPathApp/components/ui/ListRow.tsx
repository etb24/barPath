import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Typography from './Typography';
import type { IconName } from './Button';
import { colors, spacing } from '@/styles/theme';

interface ListRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  // Trailing text (e.g. a version number). Ignored when onPress is set, which shows a chevron instead.
  value?: string;
  onPress?: () => void;
  tone?: 'default' | 'destructive';
}

const BADGE_SIZE = 32;

export default function ListRow({ icon, title, subtitle, value, onPress, tone = 'default' }: ListRowProps) {
  const isDestructive = tone === 'destructive';
  const iconColor = isDestructive ? colors.destructive : colors.accent;

  const content = (
    <View style={styles.row}>
      <View style={[styles.badge, isDestructive && styles.badgeDestructive]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Typography variant="body" weight="medium" color={isDestructive ? colors.destructive : colors.textPrimary}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color={colors.textMuted}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : value ? (
        <Typography variant="caption" color={colors.textSecondary}>
          {value}
        </Typography>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDestructive: {
    backgroundColor: colors.destructiveSoft,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
