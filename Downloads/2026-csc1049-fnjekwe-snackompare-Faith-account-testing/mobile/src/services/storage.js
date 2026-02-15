import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../config";

const FAVORITES_KEY = "@snackompare_favorites";

function getUserId() {
  return auth.currentUser?.uid || null;
}

function favoritesCol(uid) {
  return collection(db, "users", uid, "favorites");
}

function favoriteDoc(uid, id) {
  return doc(db, "users", uid, "favorites", id);
}

/**
 * Get all favorite products
 * @returns {Promise<Array>} Array of favorite products
 */
export async function getFavorites() {
  const uid = getUserId();

  // Try Firestore first when authenticated
  if (uid) {
    try {
      const snap = await getDocs(favoritesCol(uid));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (items.length) return items;
    } catch (error) {
      console.error("Error loading favorites from Firestore:", error);
    }
  }

  // Fallback to local storage for guests/offline
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Error loading favorites from AsyncStorage:", error);
    return [];
  }
}

/**
 * Add a product to favorites
 * @param {Object} product - Product to add
 * @returns {Promise<boolean>} Success status
 */
export async function addFavorite(product) {
  const safeId = product.id || product.code || `fav_${Date.now()}`;
  const uid = getUserId();

  if (uid) {
    try {
      await setDoc(favoriteDoc(uid, safeId), { ...product, id: safeId, updatedAt: Date.now() });
      return true;
    } catch (error) {
      console.error("Error adding favorite to Firestore:", error);
    }
  }

  // Local fallback for guests/offline
  try {
    const favorites = await getFavorites();
    const exists = favorites.some((fav) => fav.id === safeId);
    if (exists) return false;
    favorites.push({ ...product, id: safeId });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error("Error adding favorite locally:", error);
    return false;
  }
}

/**
 * Remove a product from favorites
 * @param {string} productId - Product ID to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeFavorite(productId) {
  const uid = getUserId();

  if (uid) {
    try {
      await deleteDoc(favoriteDoc(uid, productId));
      return true;
    } catch (error) {
      console.error("Error removing favorite from Firestore:", error);
    }
  }

  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter((fav) => fav.id !== productId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error removing favorite locally:", error);
    return false;
  }
}

/**
 * Check if a product is favorited
 * @param {string} productId - Product ID to check
 * @returns {Promise<boolean>} Whether product is favorited
 */
export async function isFavorite(productId) {
  const uid = getUserId();

  if (uid) {
    try {
      const docSnap = await getDoc(favoriteDoc(uid, productId));
      if (docSnap.exists()) return true;
    } catch (error) {
      console.error("Error checking favorite in Firestore:", error);
    }
  }

  try {
    const favorites = await getFavorites();
    return favorites.some((fav) => fav.id === productId);
  } catch (error) {
    console.error("Error checking favorite locally:", error);
    return false;
  }
}

/**
 * Clear all favorites
 * @returns {Promise<boolean>} Success status
 */
export async function clearFavorites() {
  const uid = getUserId();

  if (uid) {
    try {
      const snap = await getDocs(favoritesCol(uid));
      const deletions = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletions);
    } catch (error) {
      console.error("Error clearing favorites in Firestore:", error);
    }
  }

  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing favorites locally:", error);
    return false;
  }
}
