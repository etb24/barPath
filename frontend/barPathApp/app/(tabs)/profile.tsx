import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { getAuth, signOut } from '@react-native-firebase/auth';

export default function Library() {
  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile screen</Text>
      <View style={styles.buttonContainer}>
        <Button title="Sign Out" onPress={handleSignOut} color="#ff4444" />
      </View>
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
    fontSize: 18,
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    width: 200,
  },
});