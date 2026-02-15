import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../config";

const KEY_PREFIX = "@snackompare_user_";

function getUserId() {
  return auth.currentUser?.uid || null;
}

function dataDoc(uid, key) {
  return doc(db, "users", uid, "data", key);
}

/**
 * Load user data for a given key.
 * Tries Firestore first (when authenticated), falls back to AsyncStorage.
 * Returns defaultValue if both miss.
 */
export async function loadUserData(key, defaultValue = null) {
  const uid = getUserId();

  // Try Firestore first when authenticated
  if (uid) {
    try {
      const snap = await getDoc(dataDoc(uid, key));
      if (snap.exists()) return snap.data().value;
    } catch (error) {
      console.error("Error loading user data from Firestore:", error);
    }
  }

  // Fallback to AsyncStorage
  try {
    const json = await AsyncStorage.getItem(KEY_PREFIX + key);
    return json != null ? JSON.parse(json) : defaultValue;
  } catch (error) {
    console.error("Error loading user data from AsyncStorage:", error);
    return defaultValue;
  }
}

/**
 * Save user data for a given key.
 * Writes to Firestore if authenticated, and always writes to AsyncStorage.
 */
export async function saveUserData(key, value) {
  const uid = getUserId();

  if (uid) {
    try {
      await setDoc(dataDoc(uid, key), { value, updatedAt: Date.now() });
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
    }
  }

  try {
    await AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving user data to AsyncStorage:", error);
  }
}

/**
 * Delete user data for a given key.
 * Removes from Firestore if authenticated, and always removes from AsyncStorage.
 */
export async function deleteUserData(key) {
  const uid = getUserId();

  if (uid) {
    try {
      await deleteDoc(dataDoc(uid, key));
    } catch (error) {
      console.error("Error deleting user data from Firestore:", error);
    }
  }

  try {
    await AsyncStorage.removeItem(KEY_PREFIX + key);
  } catch (error) {
    console.error("Error deleting user data from AsyncStorage:", error);
  }
}

/**
 * Delete all user data for a given uid.
 * Deletes the entire users/{uid}/data subcollection in Firestore,
 * and clears all @snackompare_user_* keys from AsyncStorage.
 */
export async function deleteAllUserData(uid) {
  // Delete Firestore subcollection
  if (uid) {
    try {
      const snap = await getDocs(collection(db, "users", uid, "data"));
      const deletions = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletions);
    } catch (error) {
      console.error("Error deleting all user data from Firestore:", error);
    }
  }

  // Clear all user data keys from AsyncStorage
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter((k) => k.startsWith(KEY_PREFIX));
    if (userKeys.length) {
      await AsyncStorage.multiRemove(userKeys);
    }
  } catch (error) {
    console.error("Error clearing user data from AsyncStorage:", error);
  }
}
