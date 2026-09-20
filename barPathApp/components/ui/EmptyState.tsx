import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Button, { type IconName } from './Button';
import Typography from './Typography';
import { colors, spacing } from '@/styles/theme';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const BADGE_SIZE = 72;

export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={30} color={colors.accent} />
      </View>
      <View style={styles.copy}>
        <Typography variant="heading" align="center">
          {title}
        </Typography>
        {message ? (
          <Typography variant="body" color={colors.textSecondary} align="center">
            {message}
          </Typography>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button label={actionLabel} size="md" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: spacing.xs,
    maxWidth: 300,
  },
  action: {
    marginTop: spacing.xs,
  },
});
