# Backend Integration Tests

Integration tests verify that the API endpoints behave correctly end-to-end, from receiving an HTTP request to returning a response. External services (OpenFoodFacts, OpenAI) are mocked where needed so tests remain fast and deterministic.

**Source files:** `backend/api/tests/test_api_endpoints.py`, `backend/api/tests/test_comprehensive.py`
**Run with:** `python manage.py test api.tests`
**Total integration tests:** 31

---

## Health & Ping

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_01 | Ping endpoint confirms server is running | None | GET `/api/ping/` | HTTP 200, JSON `{"status": "ok"}` | Pass |

---

## Search Endpoint

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_02 | Search requires a query parameter | None | GET `/api/search/` with no query param | HTTP 400 | Pass |
| TC_B_I_03 | Search returns results with mocked data | Mocked `fetch_search` returning a product with full nutriments | GET `/api/search/?query=oats` | HTTP 200, response contains "results" key | Pass |
| TC_B_I_04 | Vegan filter excludes non-vegan products | Mocked fetch returning product tagged "en:non-vegan" | GET `/api/search/?query=oats&diet=vegan` | HTTP 200, results array is empty | Pass |
| TC_B_I_05 | Vegetarian filter excludes non-vegetarian products | Mocked fetch returning product tagged "en:non-vegetarian" | GET `/api/search/?query=oats&diet=vegetarian` | HTTP 200, results array is empty | Pass |
| TC_B_I_06 | Allergen exclusion filter removes matching products | Mocked fetch returning product with allergens_tags=["en:gluten"] | GET `/api/search/?query=oats&exclude_allergens=en:gluten` | HTTP 200, results array is empty | Pass |
| TC_B_I_07 | Search persists returned products to the database | Mocked fetch returning product with code="111" | GET `/api/search/?query=oats` | HTTP 200, Product.objects.filter(code="111").exists() == True | Pass |
| TC_B_I_08 | Products without a name are filtered out | Mocked fetch returning product with product_name="" | GET `/api/search/?query=unknown` | HTTP 200, results array is empty | Pass |

---

## Barcode Endpoint

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_09 | Unknown barcode returns 200 or 404, never 500 | Mocked `fetch_barcode` returning empty dict | GET `/api/barcode/0000000000/` | HTTP 200 or 404 | Pass |
| TC_B_I_10 | Known barcode returns serialised product | Product in DB, mocked fetch_barcode and get_or_cache_product | GET `/api/barcode/737628064502/` | HTTP 200, response contains correct product code | Pass |

---

## Favourites Endpoint

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_11 | GET favourites requires user_id parameter | None | GET `/api/favourites/` with no user_id | HTTP 400 | Pass |
| TC_B_I_12 | POST favourites requires product code | None | POST `/api/favourites/` with only user_id="u1", no code | HTTP 400 | Pass |
| TC_B_I_13 | POST with non-existent product code returns 404 | None | POST `/api/favourites/` with user_id and code="DOES-NOT-EXIST" | HTTP 404 | Pass |
| TC_B_I_14 | DELETE non-existent favourite is idempotent | None | DELETE `/api/favourites/` for a favourite that doesn't exist | HTTP 200 | Pass |
| TC_B_I_15 | Users only see their own favourites | Product FAV-P1 added for user_a, Product FAV-P2 added for user_b | Step 1: GET favourites for user_a. Step 2: GET favourites for user_b | user_a list contains FAV-P1 only; user_b list contains FAV-P2 only | Pass |
| TC_B_I_16 | Full add, list, delete cycle | Product with code="111" in DB | Step 1: POST to add favourite. Step 2: GET list (expect 1 item). Step 3: DELETE favourite. | Add returns 200, list shows 1 item, delete returns 200 | Pass |

---

## Profile Endpoint

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_17 | GET profile requires user_id parameter | None | GET `/api/profile/` with no user_id | HTTP 400 | Pass |
| TC_B_I_18 | GET profile returns default profile for unknown user | None | GET `/api/profile/?user_id=test-user-001` | HTTP 200, response contains the provided user_id | Pass |
| TC_B_I_19 | PUT profile accepts camelCase field names | None | PUT `/api/profile/` with name="Alice", activityLevel="moderate", heightCm=165 | HTTP 200, response contains name="Alice" and activityLevel="moderate" | Pass |
| TC_B_I_20 | PUT profile converts legacy "diet" field to dietPrefs array | None | PUT `/api/profile/` with diet="vegetarian" | HTTP 200, "vegetarian" present in dietPrefs array | Pass |

---

## Auth Endpoints

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_21 | Register requires email | None | POST `/api/auth/register/` with only password="pass123" | HTTP 400 | Pass |
| TC_B_I_22 | Register requires password | None | POST `/api/auth/register/` with only email="test@example.com" | HTTP 400 | Pass |
| TC_B_I_23 | Login rejects incorrect password | User registered with password="correctpass" | POST `/api/auth/login/` with password="wrongpass" | HTTP 401 | Pass |

---

## Chat Endpoint

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_24 | Chat rejects empty prompt | OPENAI_API_KEY set | POST `/api/chat/` with empty prompt | HTTP 400 with error message | Pass |
| TC_B_I_25 | Chat handles excessively long prompts | Mocked OpenAI client | POST `/api/chat/` with 50,000 character prompt | HTTP 200, 400, 413, or 500 (no unhandled crash) | Pass |
| TC_B_I_26 | Rate limiting blocks chat spam | Mocked OpenAI client | Send 30 rapid consecutive POST requests to `/api/chat/` | Mix of HTTP 200 and 429 responses; at least one 200 | Pass |

---

## Meal Photo Endpoint

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_27 | Meal photo endpoint requires an image | None | POST `/api/meals/photo-calories/` with no image file | HTTP 400 | Pass |
| TC_B_I_28 | Meal photo endpoint rejects oversized images | None | POST `/api/meals/photo-calories/` with 5MB+ image | HTTP 413 | Pass |
| TC_B_I_29 | Meal photo returns 422 when no food items detected | Mocked `estimate_calories_from_image_bytes` raising ValueError("No items recognised") | POST `/api/meals/photo-calories/` with a valid image | HTTP 422 with error message | Pass |

---

## Explain Endpoint

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_I_30 | Explain requires a base product | None | POST `/api/explain/` with alternative only, no base | HTTP 400 | Pass |
| TC_B_I_31 | Explain requires an alternative product | None | POST `/api/explain/` with base only, no alternative | HTTP 400 | Pass |
