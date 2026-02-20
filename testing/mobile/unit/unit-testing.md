# Mobile Unit Tests

Unit tests verify individual JavaScript functions in isolation. These tests cover the core logic of the SnacKompare mobile app: health score calculation, product data cleaning, and product formatting. All tests use Jest and run entirely in memory with no network calls.

**Source file:** `mobile/src/__tests__/openFoodFacts.test.js`
**Run with:** `cd mobile && npm test`
**Total unit tests:** 20

---

## Health Score Computation (`computeHealthScore`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_M_U_01 | Returns 0 for null input | None | Call `computeHealthScore(null)` | Returns 0 | Pass |
| TC_M_U_02 | Returns 0 for undefined input | None | Call `computeHealthScore(undefined)` | Returns 0 | Pass |
| TC_M_U_03 | Healthy food (high fibre and protein) scores above 70 | None | Call `computeHealthScore` with energy_kj=300, sugar=2, saturatedFat=0.5, sodium_mg=50, fiber=5, protein=10, category="General" | Score > 70 | Pass |
| TC_M_U_04 | Unhealthy food (high sugar, fat, sodium) scores below 50 | None | Call `computeHealthScore` with energy_kj=2000, sugar=35, saturatedFat=8, sodium_mg=700, fiber=0, protein=2, category="General" | Score < 50 | Pass |
| TC_M_U_05 | Score is always bounded between 0 and 100 | None | Step 1: Call with worst-case values (energy_kj=9999, sugar=999, saturatedFat=999, sodium_mg=9999). Step 2: Call with best-case values (energy_kj=0, sugar=0, saturatedFat=0, sodium_mg=0, fiber=10, protein=20) | Both scores are >= 0 AND <= 100 | Pass |
| TC_M_U_06 | Beverages category uses stricter sugar thresholds | None | Score same nutriments (sugar=5) with category="General" then category="Beverages" | Beverage score <= general score | Pass |
| TC_M_U_07 | FruitVeg category receives bonus points | None | Score same nutriments with category="General" then category="FruitVeg" | FruitVeg score >= general score | Pass |

---

## Product Cleaning (`cleanProduct`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_M_U_08 | Returns null for null input | None | Call `cleanProduct(null)` | Returns null | Pass |
| TC_M_U_09 | Returns null for undefined input | None | Call `cleanProduct(undefined)` | Returns null | Pass |
| TC_M_U_10 | Maps basic product fields correctly | None | Call `cleanProduct` with code="123456", product_name="Test Cereal", brands="BrandX" | result.code="123456", result.name="Test Cereal", result.brand="BrandX" | Pass |
| TC_M_U_11 | Missing product name defaults to "Unknown Product" | None | Call `cleanProduct` with product_name=undefined | result.name = "Unknown Product" | Pass |
| TC_M_U_12 | Derives sodium_mg from salt using 400x multiplier | None | Call `cleanProduct` with salt_100g=0.3 | result.nutriments.sodium_mg ≈ 120 (0.3 × 400) | Pass |
| TC_M_U_13 | Derives category from categories_tags array | None | Call `cleanProduct` with categories_tags=["en:breakfast-cereals"] | result.category = "Breakfast-cereals" | Pass |
| TC_M_U_14 | Defaults to "Food" when no categories are provided | None | Call `cleanProduct` with categories_tags=[] and categories=undefined | result.category = "Food" | Pass |
| TC_M_U_15 | Maps allergens and additives from tag arrays | None | Call `cleanProduct` with allergens_tags=["en:gluten"], additives_tags=["en:e330"] | result.allergens contains "en:gluten", result.additives contains "en:e330" | Pass |
| TC_M_U_16 | Thumbnail image prefers image_front_small_url | None | Call `cleanProduct` with image_front_small_url="https://example.com/small.jpg" | result.image = "https://example.com/small.jpg" | Pass |

---

## Product Formatting (`formatProductForApp`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_M_U_17 | Returns null for null input | None | Call `formatProductForApp(null)` | Returns null | Pass |
| TC_M_U_18 | Returns object with required shape | None | Call `formatProductForApp` with a standard test product | Result contains id, name, brand, score, and nutriments properties | Pass |
| TC_M_U_19 | Product ID matches original product code | None | Call `formatProductForApp` with code="ABC789" | result.id = "ABC789" | Pass |
| TC_M_U_20 | Score is a number bounded between 0 and 100 | None | Call `formatProductForApp` with a standard test product | typeof result.score === "number" AND 0 <= score <= 100 | Pass |
