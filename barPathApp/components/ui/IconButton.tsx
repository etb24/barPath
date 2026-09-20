import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import Typography from './Typography';
import { usePressScale } from './usePressScale';
import { colors, hitSlop, layout, spacing } from '@/styles/theme';
import type { IconName } from './Button';

type IconButtonVariant = 'filled' | 'tonal' | 'ghost' | 'destructive' | 'scrim';

interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  icon: IconName;
  // Required: an icon-only control has no visible text for a screen reader to announce
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: number;
  iconSize?: number;
  // Optional caption under the circle, for action rows where the icon alone is ambiguous
  label?: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const FOREGROUND: Record<IconButtonVariant, string> = {
  filled: colors.onAccent,
  tonal: colors.textPrimary,
  ghost: colors.textSecondary,
  destructive: colors.destructive,
  scrim: '#FFFFFF',
};

export default function IconButton({
  icon,
  accessibilityLabel,
  variant = 'tonal',
  size = layout.minTouchTarget,
  iconSize = 22,
  label,
  loading = false,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: IconButtonProps) {
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale(0.92);
  const foreground = FOREGROUND[variant];
  const isDisabled = !!disabled || loading;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={hitSlop}
      onPressIn={(event) => {
        scaleIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scaleOut();
        onPressOut?.(event);
      }}
      style={[styles.pressable, style]}
    >
      <Animated.View
        style={[
          styles.circle,
          variantStyles[variant],
          { width: size, height: size, borderRadius: size / 2 },
          isDisabled && styles.disabled,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={foreground} />
        ) : (
          <Ionicons name={icon} size={iconSize} color={foreground} />
        )}
      </Animated.View>
      {label ? (
        <View>
          <Typography variant="caption" color={isDisabled ? colors.textMuted : colors.textSecondary}>
            {label}
          </Typography>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles = StyleSheet.create({
  filled: { backgroundColor: colors.accent },
  tonal: { backgroundColor: colors.surfaceRaised },
  ghost: { backgroundColor: 'transparent' },
  destructive: { backgroundColor: colors.destructiveSoft },
  scrim: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
});
