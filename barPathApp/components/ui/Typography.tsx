import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '@/styles/theme';

export type TypographyVariant = keyof typeof typography;
type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: Weight;
  align?: TextStyle['textAlign'];
}

const WEIGHTS: Record<Weight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export default function Typography({
  variant = 'body',
  color = colors.textPrimary,
  weight,
  align,
  style,
  children,
  ...rest
}: TypographyProps) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        weight ? { fontWeight: WEIGHTS[weight] } : null,
        { color },
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
