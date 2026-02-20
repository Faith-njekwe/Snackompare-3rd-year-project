# Mobile System Tests

System tests (end-to-end) verify complete multi-step flows in the mobile app's service layer. Each test chains multiple functions together — simulating a real user journey from fetching data through to displaying it — to confirm the pipeline works correctly as a whole.

**Source file:** `mobile/src/__tests__/openFoodFacts.test.js`
**Run with:** `cd mobile && npm test`
**Total system tests:** 5

---

## End-to-End Flows

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_M_S_01 | Search then format: products from search can be formatted for the app | Mocked search API returning 1 product | Step 1: Call `searchProducts("oats")` — expect 1 product returned. Step 2: Call `formatProductForApp` on the first result | Search returns 1 product; formatted product has correct id matching the code; score >= 0 | Pass |
| TC_M_S_02 | Barcode lookup then clean: product flows through cleanProduct correctly | Mocked barcode API returning product with code="987654", salt_100g=0.3 | Step 1: Call `getProductByBarcode("987654")`. Step 2: Call `cleanProduct` on the result | cleaned.code = "987654"; cleaned.nutriments.sodium_mg ≈ 120 | Pass |
| TC_M_S_03 | findHealthierAlternatives returns empty when product score is already >= 90 | None | Call `findHealthierAlternatives("cereals", 90, "123")` | fetch is not called; returns [] | Pass |
| TC_M_S_04 | findHealthierAlternatives returns empty on API failure | Mocked fetch returning ok=false, status=500 | Call `findHealthierAlternatives("cereals", 50, "123")` | Returns [] | Pass |
| TC_M_S_05 | Healthy and unhealthy products produce significantly different scores | None | Step 1: Format healthy product (energy=72kcal, sugar=2, saturatedFat=0.2, salt=0.05, fiber=5, protein=10). Step 2: Format unhealthy product (energy=600kcal, sugar=40, saturatedFat=15, salt=2.5, fiber=0, protein=2) | healthy.score > unhealthy.score | Pass |
