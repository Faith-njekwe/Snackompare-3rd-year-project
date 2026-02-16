import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "./firebase";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
} from "firebase/firestore";

const FAVORITES_KEY = "@snackompare_favorites";
const PROFILE_KEY = "profilePrefs";
const CHAT_HISTORY_KEY = "@snackompare_chat_history";
const CALORIE_LOG_KEY = "@snackompare_calorie_log";

// helpers 

function getUid() {
  return auth.currentUser?.uid ?? null;
}

function userDoc() {
  const uid = getUid();
  return uid ? doc(db, "users", uid) : null;
}

function minimalProduct(product) {
  return {
    id: product.id,
    name: product.name ?? "",
    brand: product.brand ?? "",
    score: product.score ?? null,
    image: product.image ?? null,
    category: product.category ?? "",
    energy: product.nutriments?.energy ?? product.energy ?? null,
  };
}

//  Favourites

export async function getFavorites() {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Error loading favorites:", error);
    return [];
  }
}

export async function addFavorite(product) {
  try {
    const favorites = await getFavorites();
    const exists = favorites.some((fav) => fav.id === product.id);
    if (exists) return false;

    favorites.push(product);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

    const uDoc = userDoc();
    if (uDoc) {
      const favRef = doc(collection(uDoc, "favourites"), String(product.id));
      await setDoc(favRef, minimalProduct(product));
    }

    return true;
  } catch (error) {
    console.error("Error adding favorite:", error);
    return false;
  }
}

export async function removeFavorite(productId) {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter((fav) => fav.id !== productId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));

    const uDoc = userDoc();
    if (uDoc) {
      const favRef = doc(collection(uDoc, "favourites"), String(productId));
      await deleteDoc(favRef);
    }

    return true;
  } catch (error) {
    console.error("Error removing favorite:", error);
    return false;
  }
}

export async function isFavorite(productId) {
  try {
    const favorites = await getFavorites();
    return favorites.some((fav) => fav.id === productId);
  } catch (error) {
    console.error("Error checking favorite:", error);
    return false;
  }
}

export async function clearFavorites() {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);

    const uDoc = userDoc();
    if (uDoc) {
      const favsCol = collection(uDoc, "favourites");
      const snap = await getDocs(favsCol);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error("Error clearing favorites:", error);
    return false;
  }
}

//  Profile 

export async function getProfile() {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error loading profile:", error);
    return null;
  }
}

export async function saveProfile(data) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data));

    const uDoc = userDoc();
    if (uDoc) {
      await setDoc(uDoc, { profile: data }, { merge: true });
    }

    return true;
  } catch (error) {
    console.error("Error saving profile:", error);
    return false;
  }
}

// Chat History

// Calorie Log

export async function saveCalorieLog(goalText, items) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const payload = { date: today, goalText, items };
    await AsyncStorage.setItem(CALORIE_LOG_KEY, JSON.stringify(payload));

    const uDoc = userDoc();
    if (uDoc) {
      const logRef = doc(collection(uDoc, "calorieLog"), "current");
      await setDoc(logRef, payload);
    }
  } catch (error) {
    console.error("Error saving calorie log:", error);
  }
}

export async function getCalorieLog() {
  try {
    const json = await AsyncStorage.getItem(CALORIE_LOG_KEY);
    if (!json) return null;

    const data = JSON.parse(json);
    const today = new Date().toISOString().slice(0, 10);

    if (data.date === today) {
      return { goalText: data.goalText, items: data.items };
    }
    // New day — keep goal, reset food log
    return { goalText: data.goalText, items: [] };
  } catch (error) {
    console.error("Error loading calorie log:", error);
    return null;
  }
}

// Delete all user data

export async function deleteAllUserData() {
  const uDoc = userDoc();
  if (!uDoc) return;

  try {
    // Delete favourites subcollection
    const favsCol = collection(uDoc, "favourites");
    const snap = await getDocs(favsCol);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    // Delete the user document itself (profile, chatHistory)
    await deleteDoc(uDoc);

    // Clear local storage
    await AsyncStorage.multiRemove([FAVORITES_KEY, PROFILE_KEY, CHAT_HISTORY_KEY, CALORIE_LOG_KEY]);
  } catch (error) {
    console.error("Error deleting user data:", error);
  }
}

// Sync on login 

export async function syncOnLogin() {
  const uDoc = userDoc();
  if (!uDoc) return;

  try {
    // --- Favourites: merge local into Firestore, then pull combined set ---
    const localFavs = await getFavorites();
    const favsCol = collection(uDoc, "favourites");
    const snap = await getDocs(favsCol);
    const cloudFavs = snap.docs.map((d) => d.data());

    // Merge: cloud wins on conflict (same id), local-only items get added
    const merged = new Map();
    cloudFavs.forEach((f) => merged.set(String(f.id), f));
    localFavs.forEach((f) => {
      const key = String(f.id);
      if (!merged.has(key)) merged.set(key, f);
    });

    const allFavs = Array.from(merged.values());
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(allFavs));

    // Push any local-only favourites to Firestore
    const cloudIds = new Set(cloudFavs.map((f) => String(f.id)));
    const batch = writeBatch(db);
    let writes = 0;
    for (const fav of allFavs) {
      if (!cloudIds.has(String(fav.id))) {
        const favRef = doc(favsCol, String(fav.id));
        batch.set(favRef, minimalProduct(fav));
        writes++;
      }
    }
    if (writes > 0) await batch.commit();

    // --- Profile: cloud wins if exists, otherwise push local ---
    const userSnap = await getDoc(uDoc);
    const cloudProfile = userSnap.data()?.profile;
    const localProfile = await getProfile();

    if (cloudProfile) {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(cloudProfile));
    } else if (localProfile) {
      await setDoc(uDoc, { profile: localProfile }, { merge: true });
    }

    // --- Calorie log: cloud wins if exists, otherwise push local ---
    const logRef = doc(collection(uDoc, "calorieLog"), "current");
    const logSnap = await getDoc(logRef);
    if (logSnap.exists()) {
      await AsyncStorage.setItem(CALORIE_LOG_KEY, JSON.stringify(logSnap.data()));
    } else {
      const localLog = await AsyncStorage.getItem(CALORIE_LOG_KEY);
      if (localLog) {
        await setDoc(logRef, JSON.parse(localLog));
      }
    }

  } catch (error) {
    console.error("Error syncing on login:", error);
  }
}


// Onboarding 

export async function getOnboardingCompleteFromCloud() {
  const uDoc = userDoc();
  if (!uDoc) return false;

  try {
    const snap = await getDoc(uDoc);

    // If user doesn't exist yet, treat as NOT onboarded
    if (!snap.exists()) {
      // Optionally create it so it exists for later
      await setDoc(uDoc, { onboardingComplete: false }, { merge: true });
      return false;
    }

    return snap.data()?.onboardingComplete === true;
  } catch (e) {
    console.error("Error reading onboardingComplete:", e);
    return false;
  }
}

// Sets the current user's onboardingComplete flag in Firestore to true
export async function setOnboardingCompleteInCloud(value = true) {
  const uDoc = userDoc();
  if (!uDoc) return false;

  try {
    await setDoc(uDoc, { onboardingComplete: value }, { merge: true });
    return true;
  } catch (e) {
    console.error("Error saving onboardingComplete:", e);
    return false;
  }
}
