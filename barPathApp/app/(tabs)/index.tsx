import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, StatusBar, Platform, LayoutAnimation, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';
import QuickAction from '../components/QuickAction';
import Accordion from '../components/Accordion';
import Bullet from '../components/Bullet';

// enable layout animation on Android (for accordion)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const router = useRouter();
  const auth   = getAuth();
  const user   = auth.currentUser;

  const goToUpload  = () => router.push('/upload');
  const goToLibrary = () => router.push('/library');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={styles.title}>barPath.io</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Track your lifts with AI</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutHeadline}>
              Get stronger, safely with <Text style={styles.brand}>barPath.io</Text>
            </Text>
            <Text style={styles.aboutText}>
              Track your lifts and improve your form using cutting-edge AI technology. 
              Visualize your bar path, monitor progress, and lift with confidence.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.row}>
            <QuickAction
              title="Upload a lift"
              subtitle="Pick a video to analyze"
              icon="upload"
              onPress={goToUpload}
            />
            <QuickAction
              title="Your library"
              subtitle="Manage saved videos"
              icon="folder"
              onPress={goToLibrary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>

          <Accordion title="How to get the best results" defaultOpen>
            <Bullet text="Record your set from the side if possible. Keep the camera steady." />
            <Bullet text="Keep the barbell and plates fully in frame for the entire set." />
            <Bullet text="Use good lighting; avoid strong backlight and motion blur." />
            <Bullet text="Open the Upload tab and pick your video (under 2 minutes works best)." />
            <Bullet text="We’ll process it and show bar path + metrics; review in your Library." />
          </Accordion>

          <Accordion title="Tips & Troubleshooting">
            <Bullet text="If tracking looks off, try a different angle or clear clutter near the bar." />
            <Bullet text="Higher FPS (60) helps; overly compressed clips can reduce accuracy." />
            <Bullet text="Trim the clip close to the set to speed up processing." />
            <Bullet text="If the picker doesn’t open, grant photo/video permissions." />
            <Bullet text="Privacy: videos stay tied to your account; you can delete them anytime." />
          </Accordion>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },

  header: { 
    paddingTop: 8, 
    paddingBottom: 6, 
    alignItems: 'center' 
  },

  badge: {
    backgroundColor: '#1A1A1A',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },

  badgeText: { 
    color: '#cfcfcf', 
    fontSize: 12, 
    letterSpacing: 0.3 
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#C2FD4E',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    color: '#9A9A9A',
    textAlign: 'center',
  },

  section: { 
    marginTop: 18 
  },

  sectionTitle: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700', 
    letterSpacing: 0.2,
    paddingLeft: 12,
  },

  row: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 10 
  },

  aboutCard: {
    backgroundColor: '#161616',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },

  aboutHeadline: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },

  brand: {
    color: '#C2FD4E',
    fontWeight: '900',
  },

  aboutText: {
    color: '#CFCFCF',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

});
