import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import Typography from './Typography';
import { usePressScale } from './usePressScale';
import { colors, layout, radii, spacing } from '@/styles/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  // Light tap on press. Defaults on for primary actions only, so secondary taps stay quiet.
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

const FOREGROUND: Record<ButtonVariant, string> = {
  primary: colors.onAccent,
  secondary: colors.textPrimary,
  ghost: colors.textSecondary,
  destructive: colors.destructive,
};

const ICON_SIZE: Record<ButtonSize, number> = { md: 18, lg: 20 };

export default function Button({
  label,
  variant = 'primary',
  size = 'lg',
  icon,
  loading = false,
  fullWidth = false,
  haptic = variant === 'primary',
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  style,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale();
  const foreground = FOREGROUND[variant];
  const isDisabled = !!disabled || loading;

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      onPress?.(event);
    },
    [haptic, onPress],
  );

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      onPressIn={(event) => {
        scaleIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scaleOut();
        onPressOut?.(event);
      }}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <Animated.View
        style={[
          styles.base,
          sizeStyles[size],
          variantStyles[variant],
          isDisabled && styles.disabled,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={foreground} />
        ) : (
          <View style={styles.content}>
            {icon ? <Ionicons name={icon} size={ICON_SIZE[size]} color={foreground} /> : null}
            <Typography variant="body" weight="semibold" color={foreground}>
              {label}
            </Typography>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});

const sizeStyles = StyleSheet.create({
  md: {
    height: layout.controlHeightSm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  lg: {
    height: layout.controlHeight,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent, borderColor: 'transparent' },
  secondary: { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  destructive: { backgroundColor: colors.destructiveSoft, borderColor: 'transparent' },
});
