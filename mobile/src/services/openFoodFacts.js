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
export async function searchProducts(query, pageSize = 10) {
  if (!query || query.trim() === "") {
    return [];
  }

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: 1,
      json: 1,
      page_size: pageSize,
      fields: SEARCH_FIELDS,
    });

    const response = await fetch(`${BASE_URL}/cgi/search.pl?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
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
export function cleanProduct(product) {
  if (!product) {
    return null;
  }

  const nutriments = product.nutriments || {};

  // Prefer smaller images for faster loading in lists
  const thumbnailImage = product.image_front_small_url || product.image_front_thumb_url;
  const fullImage = product.image_url || product.image_front_url;

  return {
    code: product.code || product.id || "",
    name: product.product_name || "Unknown Product",
    brand: product.brands || "Unknown Brand",
    category: getCategory(product),
    image: thumbnailImage || fullImage || null,
    imageFull: fullImage || thumbnailImage || null,
    nutriments: {
      energy: nutriments["energy-kcal_100g"] || nutriments.energy_100g || 0,
      fat: nutriments.fat_100g || 0,
      saturatedFat: nutriments["saturated-fat_100g"] || 0,
      carbs: nutriments.carbohydrates_100g || 0,
      sugar: nutriments.sugars_100g || 0,
      protein: nutriments.proteins_100g || 0,
      fiber: nutriments.fiber_100g || 0,
      salt: nutriments.salt_100g || 0,
    },
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
 * Determine if product is a beverage based on category
 */
function isBeverage(category) {
  const beverageKeywords = [
    "drink",
    "beverage",
    "juice",
    "soda",
    "water",
    "tea",
    "coffee",
    "smoothie",
    "milk",
    "shake",
  ];
  const catLower = (category || "").toLowerCase();
  return beverageKeywords.some((keyword) => catLower.includes(keyword));
}

/**
 * Compute health score for BEVERAGES (stricter on sugar)
 * @param {Object} nutriments - Nutritional values
 * @returns {number} Health score (0-100)
 */
function computeBeverageScore(nutriments) {
  // Start at 90 (beverages should be naturally healthy like water)
  let score = 90;

  // SUGAR - Major penalty for beverages (should be near 0)
  const sugar = nutriments.sugar || 0;
  if (sugar > 15) {
    score -= 50; // Very high sugar (sodas)
  } else if (sugar > 10) {
    score -= 35; // High sugar (sweetened juices)
  } else if (sugar > 5) {
    score -= 20; // Moderate sugar
  } else if (sugar > 2.5) {
    score -= 10; // Low sugar
  }
  // 0-2.5g sugar: no penalty (natural/unsweetened)

  // SALT - Should be minimal in drinks
  const salt = nutriments.salt || 0;
  if (salt > 0.5) {
    score -= 30; // Way too much salt for a drink
  } else if (salt > 0.2) {
    score -= 15;
  } else if (salt > 0.1) {
    score -= 5;
  }

  // CALORIES - Low calorie is better for drinks
  const energy = nutriments.energy || 0;
  if (energy > 200) {
    score -= 20; // Very high calorie drinks
  } else if (energy > 100) {
    score -= 10;
  } else if (energy > 50) {
    score -= 5;
  }

  // PROTEIN BOOST - Good for protein shakes/milk
  const protein = nutriments.protein || 0;
  if (protein > 10) {
    score += 15;
  } else if (protein > 5) {
    score += 10;
  } else if (protein > 2) {
    score += 5;
  }

  // Ensure score stays in range
  return Math.max(5, Math.min(100, Math.round(score)));
}

/**
 * Compute health score for FOOD (balanced approach)
 * @param {Object} nutriments - Nutritional values
 * @returns {number} Health score (0-100)
 */
function computeFoodScore(nutriments) {
  // Start at 75 (neutral baseline for food)
  let score = 75;

  // SUGAR - Moderate penalty (some sugar is okay in food)
  const sugar = nutriments.sugar || 0;
  if (sugar > 40) {
    score -= 40; // Candy/desserts
  } else if (sugar > 25) {
    score -= 25; // Sweet snacks
  } else if (sugar > 15) {
    score -= 15; // Moderately sweet
  } else if (sugar > 10) {
    score -= 8;
  } else if (sugar > 5) {
    score -= 3;
  }

  // SALT - Important factor
  const salt = nutriments.salt || 0;
  if (salt > 2.5) {
    score -= 35; // Very salty (chips, processed foods)
  } else if (salt > 1.5) {
    score -= 25;
  } else if (salt > 1.0) {
    score -= 15;
  } else if (salt > 0.5) {
    score -= 8;
  }

  // SATURATED FAT - Moderate penalty
  const satFat = nutriments.saturatedFat || 0;
  if (satFat > 15) {
    score -= 25; // Very high (fried foods)
  } else if (satFat > 10) {
    score -= 18;
  } else if (satFat > 5) {
    score -= 10;
  } else if (satFat > 3) {
    score -= 5;
  }

  // FIBER BOOST - Very important
  const fiber = nutriments.fiber || 0;
  if (fiber > 15) {
    score += 25; // Excellent fiber content
  } else if (fiber > 10) {
    score += 20;
  } else if (fiber > 7) {
    score += 15;
  } else if (fiber > 5) {
    score += 10;
  } else if (fiber > 3) {
    score += 5;
  }

  // PROTEIN BOOST - Important for satiety
  const protein = nutriments.protein || 0;
  if (protein > 30) {
    score += 20; // High protein foods
  } else if (protein > 20) {
    score += 15;
  } else if (protein > 15) {
    score += 12;
  } else if (protein > 10) {
    score += 8;
  } else if (protein > 5) {
    score += 4;
  }

  // ENERGY - Penalty for excessive calories
  const energy = nutriments.energy || 0;
  if (energy > 600) {
    score -= 15; // Very high calorie density
  } else if (energy > 500) {
    score -= 10;
  } else if (energy > 400) {
    score -= 5;
  }

  // Ensure score stays in range
  return Math.max(5, Math.min(100, Math.round(score)));
}

/**
 * Compute health score based on nutritional values and category
 * @param {Object} nutriments - Nutritional values
 * @param {string} category - Product category
 * @returns {number} Health score (0-100)
 */
export function computeHealthScore(nutriments, category = "") {
  if (!nutriments) {
    return 50;
  }

  // Use different algorithms for beverages vs food
  if (isBeverage(category)) {
    return computeBeverageScore(nutriments);
  } else {
    return computeFoodScore(nutriments);
  }
}

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
    const products = data.products || [];

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
  if (!cleaned) {
    return null;
  }

  const score = computeHealthScore(cleaned.nutriments, cleaned.category);

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
