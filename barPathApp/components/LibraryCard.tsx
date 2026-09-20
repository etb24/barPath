import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import IconButton from './ui/IconButton';
import Typography from './ui/Typography';
import { usePressScale } from './ui/usePressScale';
import { colors, radii, spacing } from '@/styles/theme';

interface LibraryCardProps {
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  width: number;
  onPress: () => void;
  onMenuPress: () => void;
}

// Lift videos are portrait, so the tiles are too
const THUMB_ASPECT = 9 / 16;
const IMAGE_FADE_MS = 200;

export default function LibraryCard({ title, subtitle, thumbnailUrl, width, onPress, onMenuPress }: LibraryCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.98);
  const height = width / THUMB_ASPECT;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      accessibilityHint="Opens the lift with its bar path"
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[styles.card, { width, height }, animatedStyle]}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={IMAGE_FADE_MS}
          recyclingKey={thumbnailUrl}
          accessibilityIgnoresInvertColors
        />
        <IconButton
          icon="ellipsis-horizontal"
          accessibilityLabel={`More options for ${title}`}
          variant="scrim"
          size={32}
          iconSize={18}
          onPress={onMenuPress}
          style={styles.menu}
        />
        <View style={styles.caption}>
          <Typography variant="caption" weight="semibold" numberOfLines={1}>
            {title}
          </Typography>
          <Typography variant="label" color={colors.textSecondary}>
            {subtitle}
          </Typography>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function LibraryCardSkeleton({ width }: { width: number }) {
  return <View style={[styles.card, styles.skeleton, { width, height: width / THUMB_ASPECT }]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  skeleton: {
    backgroundColor: colors.surface,
  },
  menu: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
    backgroundColor: colors.scrim,
  },
});
