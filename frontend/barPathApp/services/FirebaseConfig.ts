import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getStorage } from '@react-native-firebase/storage';
import { getFirestore } from '@react-native-firebase/firestore';

const app = getApp();
export const auth = getAuth(app);
export const storageDb = getStorage(app);
export const db = getFirestore(app);