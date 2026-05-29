import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { typography, colors } from '../../styles/theme';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  weight?: 'regular' | 'medium' | 'bold' | 'black';
};

const weightMap: Record<NonNullable<Props['weight']>, TextStyle> = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  black: { fontWeight: '900' },
};

export default function Typography({
  variant = 'body',
  color = colors.textPrimary,
  weight,
  style,
  children,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        weight ? weightMap[weight] : null,
        { color },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
