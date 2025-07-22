import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import {
  getStorage,
  ref as storageRef,
  putFile,
  deleteObject,
  getDownloadURL,
} from '@react-native-firebase/storage';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from '@react-native-firebase/firestore';

const app       = getApp();
export const auth      = getAuth(app);
export const storageDb = getStorage(app);
export const db        = getFirestore(app);

export {
  storageRef,
  putFile,
  deleteObject,
  getDownloadURL,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  onAuthStateChanged,
};
