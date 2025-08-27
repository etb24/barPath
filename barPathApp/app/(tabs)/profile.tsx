import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable, Image, Alert, StatusBar, Platform, } from 'react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const auth = getAuth();
  const router = useRouter();
  const user = auth.currentUser;

  const initial =
    user?.displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.error('Sign out error:', e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const goToLibrary = () => router.push('/library');
  const goToUpload  = () => router.push('/upload');
  //const goToAccount = () => router.push('/account'); // stub: add this route for future account management

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* header / avatar */}
        <View style={styles.header}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          <Text style={styles.name} numberOfLines={1}>
            {user?.displayName || 'Anonymous'}
          </Text>
          {user?.email ? (
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
        </View>

        {/* quick Actions */}
        <View style={styles.section}>
          <View style={styles.cardList}>
            <ProfileRow title="Upload a lift" subtitle="Pick a video to analyze" onPress={goToUpload} />
            <ProfileRow title="Your library" subtitle="Manage saved videos" onPress={goToLibrary} />
            {/*<ProfileRow title="Account" subtitle="Name, photo (coming soon)" onPress={goToAccount} />*/}
          </View>
        </View>

        {/* app info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App</Text>
              <Text style={styles.aboutValue}>barPath.io</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* sign out */}
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// might delete this component later, but keeping for now
function ProfileRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
      style={({ pressed }) => [rowStyles.row, pressed && rowStyles.pressed]}
    >
      <View style={rowStyles.texts}>
        <Text style={rowStyles.title}>{title}</Text>
        {subtitle ? <Text style={rowStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={rowStyles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 18,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: '#C2FD4E',
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C2FD4E',
    marginBottom: 14,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  email: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 4,
  },

  section: { marginTop: 24 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
    paddingLeft: 12,
  },

  cardList: {
    backgroundColor: '#161616',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
  },

  aboutCard: {
    backgroundColor: '#161616',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  aboutRow: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aboutLabel: { color: '#9A9A9A', fontSize: 13 },
  aboutValue: { color: '#EDEDED', fontSize: 13 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#262626',
    marginVertical: 6,
  },

  signOutButton: {
    marginTop: 28,
    alignSelf: 'center',
    backgroundColor: '#8A5BFE',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 4 },
    }),
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pressed: { 
    transform: [{ scale: 0.98 }] 
  },
});

const rowStyles = StyleSheet.create({
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#161616',
    borderBottomColor: '#242424',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pressed: { transform: [{ scale: 0.99 }] },
  texts: { flex: 1, paddingRight: 12 },
  title: { color: '#EDEDED', fontSize: 15, fontWeight: '700' },
  subtitle: { color: '#9A9A9A', fontSize: 12, marginTop: 2 },
  chevron: { color: '#8C8C8C', fontSize: 22, marginLeft: 6 },
});
