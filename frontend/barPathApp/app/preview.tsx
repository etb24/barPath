import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function PreviewScreen() {
  // Preview logic will go here
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Video Preview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  text: {
    color: '#fff',
  },
});