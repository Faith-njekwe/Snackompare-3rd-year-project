import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "@snackompare_favorites";

/**
 * Get all favorite products
 * @returns {Promise<Array>} Array of favorite products
 */
export async function getFavorites() {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error("Error loading favorites:", error);
    return [];
  }
}

/**
 * Add a product to favorites
 * @param {Object} product - Product to add
 * @returns {Promise<boolean>} Success status
 */
export async function addFavorite(product) {
  try {
    const favorites = await getFavorites();

    // Check if already exists
    const exists = favorites.some((fav) => fav.id === product.id);
    if (exists) {
      return false;
    }

    favorites.push(product);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error("Error adding favorite:", error);
    return false;
  }
}

/**
 * Remove a product from favorites
 * @param {string} productId - Product ID to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeFavorite(productId) {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter((fav) => fav.id !== productId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error removing favorite:", error);
    return false;
  }
}

/**
 * Check if a product is favorited
 * @param {string} productId - Product ID to check
 * @returns {Promise<boolean>} Whether product is favorited
 */
export async function isFavorite(productId) {
  try {
    const favorites = await getFavorites();
    return favorites.some((fav) => fav.id === productId);
  } catch (error) {
    console.error("Error checking favorite:", error);
    return false;
  }
}

/**
 * Clear all favorites
 * @returns {Promise<boolean>} Success status
 */
export async function clearFavorites() {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing favorites:", error);
    return false;
  }
}
