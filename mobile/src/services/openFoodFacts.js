const BASE_URL = "https://world.openfoodfacts.org";

// Only fetch fields we actually need - significantly reduces payload size and speeds up loading
const SEARCH_FIELDS = [
  "code",
  "product_name",
  "brands",
  "categories_tags",
  "categories",
  "image_front_small_url",
  "image_front_thumb_url",
  "image_url",
  "nutriments",
  "allergens_tags",
  "additives_tags",
  "ingredients_text",
  "nutriscore_grade",
  "ecoscore_grade",
].join(",");

/**
 * Search for products by name
 * @param {string} query - Search term
 * @param {number} pageSize - Number of results to return
 * @returns {Promise<Array>} Array of products
 */
export async function searchProducts(query, pageSize = 10, page = 1) {
  if (!query || query.trim() === "") {
    return { products: [], hasMore: false };
  }

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: 1,
      json: 1,
      page_size: pageSize,
      page: page,
      fields: SEARCH_FIELDS,
    });

    const response = await fetch(`${BASE_URL}/cgi/search.pl?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const products = data.products || [];
    const totalCount = data.count || 0;
    const hasMore = page * pageSize < totalCount;
    return { products, hasMore };
  } catch (error) {
    console.error("Error searching products:", error);
    return { products: [], hasMore: false };
  }
}

/**
 * Get product by barcode
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object|null>} Product data or null if not found
 */
export async function getProductByBarcode(barcode) {
  if (!barcode) {
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/v0/product/${barcode}.json`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      return data.product;
    }

    return null;
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return null;
  }
}

/**
 * Extract clean nutrition data from Open Food Facts product
 * @param {Object} product - Raw product data from Open Food Facts
 * @returns {Object} Cleaned product data
 */


function kcalToKj(kcal) {
  return (kcal || 0) * 4.184;
}

function saltGToSodiumMg(saltG) {
  // sodium (mg) = salt(g) * 400
  return (saltG || 0) * 400.0;
}

/* Nutri-score bins */

const ENERGY_KJ_THRESH = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SUGARS_G_THRESH  = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];
const SATFAT_G_THRESH  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SODIUM_MG_THRESH = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];

const FIBER_G_THRESH   = [0.9, 1.9, 2.8, 3.7, 4.7]; // 0..5
const PROTEIN_G_THRESH = [1.6, 3.2, 4.8, 6.4, 8.0]; // 0..5

// Beverages specific
const BEV_ENERGY_KJ_THRESH = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
const BEV_SUGARS_G_THRESH  = [0, 0.5, 2, 3.5, 5, 6, 7, 8, 9, 10];

// Fats specific (sat fat / total fat ratio %)
const FAT_RATIO_THRESH = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64];

function pointsFromThresholds(value, thresholds) {
  const v = value || 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (v <= thresholds[i]) return i;
  }
  return thresholds.length;
}

function computeNutriPoints(n, category = "General") {
  // Negative points (A)
  let energyPts, sugarPts;

  if (category === "Beverages") {
    energyPts = pointsFromThresholds(n.energy_kj, BEV_ENERGY_KJ_THRESH);
    sugarPts  = pointsFromThresholds(n.sugar, BEV_SUGARS_G_THRESH);
  } else {
    energyPts = pointsFromThresholds(n.energy_kj, ENERGY_KJ_THRESH);
    sugarPts  = pointsFromThresholds(n.sugar, SUGARS_G_THRESH);
  }

  // Fat logic
  let fatPts;
  if (category === "Fats") {
    const totalFat = n.fat || 1;
    const satFat = n.saturatedFat || 0;
    const ratio = (satFat / totalFat) * 100;
    fatPts = pointsFromThresholds(ratio, FAT_RATIO_THRESH);
  } else {
    fatPts = pointsFromThresholds(n.saturatedFat, SATFAT_G_THRESH);
  }

  const sodiumPts = pointsFromThresholds(n.sodium_mg, SODIUM_MG_THRESH);

  const A = energyPts + sugarPts + fatPts + sodiumPts;

  // Positive points (C)
  const fiberPts = Math.min(5, pointsFromThresholds(n.fiber, FIBER_G_THRESH));
  const proteinPts = Math.min(5, pointsFromThresholds(n.protein, PROTEIN_G_THRESH));

  let vPoints = 0;
  if (category === "FruitVeg") {
    vPoints = 5;
  } else if ((n.fiber || 0) > 4.7) {
    vPoints = 5;
  }

  let useProtein = true;
  if (category === "Cheese") {
    useProtein = true;
  } else if (A >= 11 && fiberPts < 5) {
    useProtein = false;
  }

  const C = fiberPts + vPoints + (useProtein ? proteinPts : 0);

  return A - C; // lower is better
 }

 /**
 * Compute health score based on Nutri-Score–style system
 * @param {Object} nutriments - standardized nutriments (must include energy_kj + sodium_mg)
 * @param {string} categoryMapped - one of: Beverages, Cheese, FruitVeg, Fats, General
 */

export function computeHealthScore(nutriments, categoryMapped = "General") {
  if (!nutriments) return 0;
  const points = computeNutriPoints(nutriments, categoryMapped);
  return nutriPointsToScore(points);
}

function nutriPointsToScore(points) {
  const MIN_P = -15;
  const MAX_P = 40;

  const p = Math.max(MIN_P, Math.min(MAX_P, points));
  const score = (100 * (MAX_P - p)) / (MAX_P - MIN_P);
  return Math.round(score);
}

function mapCategoryForNutriScore(product) {
  const rawCategories = product?.categories_tags || [];
  const cats = rawCategories.map((c) => (c || "").toLowerCase());

  // tag matches
  if (cats.some((c) => c.includes("beverage"))) return "Beverages";
  if (
    cats.some((c) =>
      c.includes("en:waters") ||
      c.includes("en:soft-drinks") ||
      c.includes("en:sodas") ||
      c.includes("en:carbonated-drinks") ||
      c.includes("en:juices") ||
      c.includes("en:fruit-juices") ||
      c.includes("en:tea") ||
      c.includes("en:coffee") ||
      c.includes("en:milks")
    )
  ) return "Beverages";
  if (cats.some((c) => c.includes("cheese"))) return "Cheese";
  if (cats.some((c) =>
      ["en:fruits", "en:vegetables", "en:nuts", "en:legumes"].includes(c)
    )) return "FruitVeg";
  if (cats.some((c) => ["en:fats", "en:sauces", "en:oils"].includes(c)))
    return "Fats";

  return "General";
}




export function cleanProduct(product) {
  if (!product) return null;

  const n = product.nutriments || {};

  const thumbnailImage = product.image_front_small_url || product.image_front_thumb_url;
  const fullImage = product.image_url || product.image_front_url;

  // OFF typically has:
  // - energy_100g is kJ
  // - energy-kcal_100g is kcal
  const kcal = n["energy-kcal_100g"] ?? n.energy_kcal ?? null;
  const kj = n.energy_100g ?? null;

  const energy_kj = kj != null ? kj : kcalToKj(kcal);
  const energy_kcal = kcal != null ? kcal : (energy_kj / 4.184);

  const salt_g = n.salt_100g ?? 0;

  const categoryMapped = mapCategoryForNutriScore(product);

  return {
    code: product.code || product.id || "", 
    name: product.product_name || "Unknown Product", 
    brand: product.brands || "Unknown Brand", 
    category: getCategory(product),
    categoryMapped,
    image: thumbnailImage || fullImage || null, 
    imageFull: fullImage || thumbnailImage || null, 
    nutriments: { 
      energy: energy_kcal ?? null,
      energy_kj: energy_kj ?? null,  
      sodium_mg: saltGToSodiumMg(salt_g),
      fat: n.fat_100g ?? 0,
      saturatedFat: n["saturated-fat_100g"] ?? 0,
      carbs: n.carbohydrates_100g ?? 0,
      sugar: n.sugars_100g ?? 0,
      protein: n.proteins_100g ?? 0,
      fiber: n.fiber_100g ?? 0,
      salt: n.salt_100g ?? 0,
    }, 

    //if the backend injects it, keep it
    health_score: typeof product.health_score === "number" ? product.health_score : undefined,
    additives: product.additives_tags || [], 
    allergens: product.allergens_tags || [], 
    ingredients: product.ingredients_text || "", 
    ecoscore: product.ecoscore_grade || "", 
    nutriscore: product.nutriscore_grade || "", 

  }; 

} 

/**
 * Get category from product data
 */
function getCategory(product) {
  if (product.categories_tags && product.categories_tags.length > 0) {
    const category = product.categories_tags[0].replace("en:", "");
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  return product.categories || "Food";
}

/**
 * Compute health score for BEVERAGES (stricter on sugar)
 * @param {Object} nutriments - Nutritional values
 * @returns {number} Health score (0-100)
 */
/*

/**
 * Format product for display in the app
 * @param {Object} rawProduct - Raw product data from Open Food Facts
 * @returns {Object} Formatted product for app use
 */


/**
 * Search for healthier alternatives in the same category
 * @param {string} category - Product category
 * @param {number} currentScore - Current product's health score
 * @param {string} excludeId - Product ID to exclude from results
 * @returns {Promise<Array>} Array of healthier alternatives
 */
export async function findHealthierAlternatives(category, currentScore, excludeId) {
  if (!category || currentScore >= 90) {
    return [];
  }

  try {
    // Search for products in the same category
    const categorySearch = category.toLowerCase().split("-")[0].trim();
    const params = new URLSearchParams({
      search_terms: categorySearch,
      search_simple: 1,
      json: 1,
      page_size: 15,
      fields: SEARCH_FIELDS,
    });

    const response = await fetch(`${BASE_URL}/cgi/search.pl?${params}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const products = (data.products || []);

    // Format and filter for healthier options
    const alternatives = products
      .map(formatProductForApp)
      .filter((p) => p !== null && p.id !== excludeId && p.score > currentScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return alternatives;
  } catch (error) {
    console.error("Error finding alternatives:", error);
    return [];
  }
}

export function formatProductForApp(rawProduct) {
  const cleaned = cleanProduct(rawProduct);
  if (!cleaned) return null;

  let score = computeHealthScore(cleaned.nutriments, cleaned.categoryMapped);

  return {
    id: cleaned.code,
    name: cleaned.name,
    brand: cleaned.brand,
    category: cleaned.category,
    score: score,
    image: cleaned.image,
    imageFull: cleaned.imageFull,
    nutriments: cleaned.nutriments,
    additives: cleaned.additives,
    allergens: cleaned.allergens,
    ingredients: cleaned.ingredients,
    ecoscore: cleaned.ecoscore,
    nutriscore: cleaned.nutriscore,
  };
}
