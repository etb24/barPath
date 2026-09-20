import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Typography from './Typography';
import { colors, spacing } from '@/styles/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  // Slot for a control that sits on the title's baseline (a segmented control, an icon button)
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenHeader({ title, subtitle, right, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.text}>
        <Typography variant="title" accessibilityRole="header">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body" color={colors.textSecondary}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  right: {
    paddingBottom: spacing.xxs,
  },
});
