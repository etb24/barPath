import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/styles/theme';

export default function Divider() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
