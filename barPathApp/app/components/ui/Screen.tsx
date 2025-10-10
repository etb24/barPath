import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../styles/theme';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  insetColor?: string;
  barStyle?: 'light-content' | 'dark-content';
};

export default function Screen({
  children,
  style,
  insetColor = colors.background,
  barStyle = 'light-content',
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: insetColor }]}>
      <StatusBar barStyle={barStyle} />
      <SafeAreaView style={[styles.inner, style]}>{children}</SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
