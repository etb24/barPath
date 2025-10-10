import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { processVideo } from '../../services/api';
import Screen from '../components/ui/Screen';
import Typography from '../components/ui/Typography';
import { colors, spacing } from '../styles/theme';

export default function ProcessingScreen() {
  const { inputUri } = useLocalSearchParams<{ inputUri: string }>();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const { localUri, blobPath}  = await processVideo(inputUri);
        // as soon as it’s written locally, navigate to preview
        router.replace({
          pathname: '/preview',
          params: { processedUri: localUri, blobPath},
        });
      } catch (e: any) {
        Alert.alert('Processing failed', e.message || 'Unknown error');
        router.replace('/');
      }
    })();
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Typography variant="subtitle" weight="bold" style={styles.title}>
          Processing your lift…
        </Typography>
        <Typography variant="body" color={colors.textSecondary} style={styles.copy}>
          We’re mapping the bar path and rendering metrics. This should finish shortly.
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
