import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function ProcessingScreen() {
  // Processing logic will go here
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>Processing your video...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
});