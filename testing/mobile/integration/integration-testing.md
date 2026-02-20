# Mobile Integration Tests

Integration tests verify that the mobile app's service functions correctly call external APIs and handle all possible responses. The network layer (`fetch`) is mocked so tests run offline, but the full request-building and response-parsing logic is exercised.

**Source file:** `mobile/src/__tests__/openFoodFacts.test.js`
**Run with:** `cd mobile && npm test`
**Total integration tests:** 9

---

## Product Search (`searchProducts`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_M_I_01 | Empty query returns empty result without calling fetch | None | Call `searchProducts("")` | fetch is not called; returns `{ products: [], hasMore: false }` | Pass |
| TC_M_I_02 | Whitespace-only query returns empty result without calling fetch | None | Call `searchProducts("   ")` | fetch is not called; returns `{ products: [], hasMore: false }` | Pass |
| TC_M_I_03 | Successful fetch returns formatted products and pagination flag | Mocked fetch returning `{ products: [2 products], count: 50 }` | Call `searchProducts("oats", 10, 1)` | result.products.length === 2, result.hasMore === true | Pass |
| TC_M_I_04 | API error (non-ok response) returns empty result | Mocked fetch returning ok=false, status=500 | Call `searchProducts("oats")` | Returns `{ products: [], hasMore: false }` | Pass |
| TC_M_I_05 | Network failure returns empty result | Mocked fetch throws Error("Network error") | Call `searchProducts("oats")` | Returns `{ products: [], hasMore: false }` | Pass |

---

## Barcode Lookup (`getProductByBarcode`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_M_I_06 | Null barcode returns null without calling fetch | None | Call `getProductByBarcode(null)` | fetch is not called; returns null | Pass |
| TC_M_I_07 | Successful fetch returns cleaned product data | Mocked fetch returning `{ status: 1, product: mockProduct }` | Call `getProductByBarcode("123456")` | Returns the mock product | Pass |
| TC_M_I_08 | Status 0 (product not found in OpenFoodFacts) returns null | Mocked fetch returning `{ status: 0, product: null }` | Call `getProductByBarcode("000000")` | Returns null | Pass |
| TC_M_I_09 | HTTP error response (4xx) returns null | Mocked fetch returning ok=false, status=404 | Call `getProductByBarcode("000000")` | Returns null | Pass |
