/**
 * Tests for src/services/openFoodFacts.js
 *
 * Unit Tests        – pure functions (computeHealthScore, cleanProduct, formatProductForApp)
 * Integration Tests – API functions with mocked fetch (searchProducts, getProductByBarcode)
 * System Tests      – multi-step flows combining multiple service functions
 */

import {
  computeHealthScore,
  cleanProduct,
  formatProductForApp,
  searchProducts,
  getProductByBarcode,
  findHealthierAlternatives,
} from "../services/openFoodFacts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRawProduct(overrides = {}) {
  return {
    code: "123456",
    product_name: "Test Cereal",
    brands: "BrandX",
    categories_tags: ["en:breakfast-cereals"],
    categories: "Breakfast",
    nutriments: {
      "energy-kcal_100g": 380,
      energy_100g: 1590,
      fat_100g: 5,
      "saturated-fat_100g": 1,
      carbohydrates_100g: 70,
      sugars_100g: 8,
      proteins_100g: 12,
      fiber_100g: 6,
      salt_100g: 0.3,
    },
    allergens_tags: ["en:gluten"],
    additives_tags: ["en:e330"],
    ingredients_text: "Oats, wheat, sugar",
    ecoscore_grade: "b",
    nutriscore_grade: "b",
    image_front_small_url: "https://example.com/small.jpg",
    image_url: "https://example.com/full.jpg",
    ...overrides,
  };
}

function mockFetchSuccess(data) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status = 500) {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({}),
  });
}

// ===========================================================================
// UNIT TESTS – computeHealthScore
// ===========================================================================

describe("Unit Tests – computeHealthScore", () => {
  // 1
  test("returns 0 for null nutriments", () => {
    expect(computeHealthScore(null)).toBe(0);
  });

  // 2
  test("returns 0 for undefined nutriments", () => {
    expect(computeHealthScore(undefined)).toBe(0);
  });

  // 3
  test("healthy food with high fiber and protein scores above 70", () => {
    const n = {
      energy_kj: 300,
      sugar: 2,
      saturatedFat: 0.5,
      sodium_mg: 50,
      fiber: 5,
      protein: 10,
    };
    expect(computeHealthScore(n, "General")).toBeGreaterThan(70);
  });

  // 4
  test("unhealthy food with high sugar, fat and sodium scores below 50", () => {
    const n = {
      energy_kj: 2000,
      sugar: 35,
      saturatedFat: 8,
      sodium_mg: 700,
      fiber: 0,
      protein: 2,
    };
    expect(computeHealthScore(n, "General")).toBeLessThan(50);
  });

  // 5
  test("score is always between 0 and 100", () => {
    const worst = { energy_kj: 9999, sugar: 999, saturatedFat: 999, sodium_mg: 9999 };
    const best  = { energy_kj: 0,    sugar: 0,   saturatedFat: 0,   sodium_mg: 0, fiber: 10, protein: 20 };
    expect(computeHealthScore(worst)).toBeGreaterThanOrEqual(0);
    expect(computeHealthScore(worst)).toBeLessThanOrEqual(100);
    expect(computeHealthScore(best)).toBeGreaterThanOrEqual(0);
    expect(computeHealthScore(best)).toBeLessThanOrEqual(100);
  });

  // 6
  test("Beverages category uses stricter sugar thresholds (lowers score)", () => {
    const n = { energy_kj: 150, sugar: 5, saturatedFat: 0, sodium_mg: 0 };
    const genScore = computeHealthScore(n, "General");
    const bevScore = computeHealthScore(n, "Beverages");
    expect(bevScore).toBeLessThanOrEqual(genScore);
  });

  // 7
  test("FruitVeg category receives fruit/veg bonus points", () => {
    const n = { energy_kj: 200, sugar: 5, saturatedFat: 0, sodium_mg: 20, fiber: 2, protein: 1 };
    const genScore = computeHealthScore(n, "General");
    const fvScore  = computeHealthScore(n, "FruitVeg");
    expect(fvScore).toBeGreaterThanOrEqual(genScore);
  });
});

// ===========================================================================
// UNIT TESTS – cleanProduct
// ===========================================================================

describe("Unit Tests – cleanProduct", () => {
  // 8
  test("returns null for null input", () => {
    expect(cleanProduct(null)).toBeNull();
  });

  // 9
  test("returns null for undefined input", () => {
    expect(cleanProduct(undefined)).toBeNull();
  });

  // 10
  test("maps basic product fields correctly", () => {
    const result = cleanProduct(makeRawProduct());
    expect(result.code).toBe("123456");
    expect(result.name).toBe("Test Cereal");
    expect(result.brand).toBe("BrandX");
  });

  // 11
  test("defaults name to 'Unknown Product' when missing", () => {
    const result = cleanProduct(makeRawProduct({ product_name: undefined }));
    expect(result.name).toBe("Unknown Product");
  });

  // 12
  test("computes sodium_mg from salt (salt × 400)", () => {
    const result = cleanProduct(makeRawProduct());
    // salt_100g = 0.3, so sodium_mg = 0.3 × 400 = 120
    expect(result.nutriments.sodium_mg).toBeCloseTo(120, 1);
  });

  // 13
  test("derives category from categories_tags", () => {
    const result = cleanProduct(makeRawProduct());
    expect(result.category).toBe("Breakfast-cereals");
  });

  // 14
  test("defaults to 'Food' when no categories provided", () => {
    const result = cleanProduct(makeRawProduct({ categories_tags: [], categories: undefined }));
    expect(result.category).toBe("Food");
  });

  // 15
  test("maps allergens and additives from tags", () => {
    const result = cleanProduct(makeRawProduct());
    expect(result.allergens).toContain("en:gluten");
    expect(result.additives).toContain("en:e330");
  });

  // 16
  test("thumbnail image prefers image_front_small_url", () => {
    const result = cleanProduct(makeRawProduct());
    expect(result.image).toBe("https://example.com/small.jpg");
  });
});

// ===========================================================================
// UNIT TESTS – formatProductForApp
// ===========================================================================

describe("Unit Tests – formatProductForApp", () => {
  // 17
  test("returns null for null input", () => {
    expect(formatProductForApp(null)).toBeNull();
  });

  // 18
  test("returns object with expected shape", () => {
    const result = formatProductForApp(makeRawProduct());
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("brand");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("nutriments");
  });

  // 19
  test("id matches product code", () => {
    const result = formatProductForApp(makeRawProduct({ code: "ABC789" }));
    expect(result.id).toBe("ABC789");
  });

  // 20
  test("score is a number between 0 and 100", () => {
    const result = formatProductForApp(makeRawProduct());
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ===========================================================================
// INTEGRATION TESTS – searchProducts (mocked fetch)
// ===========================================================================

describe("Integration Tests – searchProducts", () => {
  // 21
  test("empty query returns empty result without calling fetch", async () => {
    const result = await searchProducts("");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({ products: [], hasMore: false });
  });

  // 22
  test("whitespace-only query returns empty result", async () => {
    const result = await searchProducts("   ");
    expect(result).toEqual({ products: [], hasMore: false });
  });

  // 23
  test("successful fetch returns products and hasMore flag", async () => {
    mockFetchSuccess({
      products: [makeRawProduct(), makeRawProduct({ code: "654321" })],
      count: 50,
    });
    const result = await searchProducts("oats", 10, 1);
    expect(result.products).toHaveLength(2);
    expect(result.hasMore).toBe(true); // 1*10 < 50
  });

  // 24
  test("API error (non-ok response) returns empty result", async () => {
    mockFetchError(500);
    const result = await searchProducts("oats");
    expect(result).toEqual({ products: [], hasMore: false });
  });

  // 25
  test("network failure returns empty result", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await searchProducts("oats");
    expect(result).toEqual({ products: [], hasMore: false });
  });
});

// ===========================================================================
// INTEGRATION TESTS – getProductByBarcode (mocked fetch)
// ===========================================================================

describe("Integration Tests – getProductByBarcode", () => {
  // 26
  test("null barcode returns null without calling fetch", async () => {
    const result = await getProductByBarcode(null);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  // 27
  test("successful fetch returns product data", async () => {
    const mockProduct = makeRawProduct();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 1, product: mockProduct }),
    });
    const result = await getProductByBarcode("123456");
    expect(result).toEqual(mockProduct);
  });

  // 28
  test("status 0 (product not found) returns null", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 0, product: null }),
    });
    const result = await getProductByBarcode("000000");
    expect(result).toBeNull();
  });

  // 29
  test("non-ok (4xx) response returns null", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await getProductByBarcode("000000");
    expect(result).toBeNull();
  });
});

// ===========================================================================
// SYSTEM TESTS – multi-step flows
// ===========================================================================

describe("System Tests – multi-step flows", () => {
  // 30
  test("search then format: products from search can be formatted for app", async () => {
    const raw = makeRawProduct();
    mockFetchSuccess({ products: [raw], count: 1 });

    const { products } = await searchProducts("cereal");
    expect(products).toHaveLength(1);

    const formatted = formatProductForApp(products[0]);
    expect(formatted).not.toBeNull();
    expect(formatted.id).toBe(raw.code);
    expect(formatted.score).toBeGreaterThanOrEqual(0);
  });

  // 31
  test("barcode lookup then clean: product flows through cleanProduct correctly", async () => {
    const raw = makeRawProduct({ code: "987654" });
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 1, product: raw }),
    });

    const product = await getProductByBarcode("987654");
    const cleaned = cleanProduct(product);
    expect(cleaned.code).toBe("987654");
    expect(cleaned.nutriments.sodium_mg).toBeCloseTo(120, 1);
  });

  // 32
  test("findHealthierAlternatives returns empty when score >= 90", async () => {
    const result = await findHealthierAlternatives("cereals", 90, "123");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  // 33
  test("findHealthierAlternatives returns empty on API failure", async () => {
    mockFetchError(500);
    const result = await findHealthierAlternatives("cereals", 50, "123");
    expect(result).toEqual([]);
  });

  // 34
  test("score difference: healthy vs unhealthy product", () => {
    const healthy   = formatProductForApp(makeRawProduct({
      nutriments: {
        energy_100g: 300, "energy-kcal_100g": 72,
        fat_100g: 1, "saturated-fat_100g": 0.2,
        carbohydrates_100g: 10, sugars_100g: 2,
        proteins_100g: 10, fiber_100g: 5, salt_100g: 0.05,
      },
    }));
    const unhealthy = formatProductForApp(makeRawProduct({
      nutriments: {
        energy_100g: 2500, "energy-kcal_100g": 600,
        fat_100g: 30, "saturated-fat_100g": 15,
        carbohydrates_100g: 60, sugars_100g: 40,
        proteins_100g: 2, fiber_100g: 0, salt_100g: 2.5,
      },
    }));
    expect(healthy.score).toBeGreaterThan(unhealthy.score);
  });
});
