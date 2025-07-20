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
        <Button title="Sign Out" onPress={handleSignOut} color="#ff4444" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});