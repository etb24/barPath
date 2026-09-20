import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '@/styles/theme';

interface ScreenProps {
  children: React.ReactNode;
  // Tab screens pass ['top'] because the tab bar already owns the bottom inset
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom'];

export default function Screen({ children, edges = DEFAULT_EDGES, style }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
