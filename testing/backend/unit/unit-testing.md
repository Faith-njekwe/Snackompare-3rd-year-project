# Backend Unit Tests

Unit tests verify individual functions and models in isolation, without making HTTP requests or hitting external services. These tests cover the core business logic of SnacKompare's backend: nutriment cleaning, product mapping, delta calculation, and database model behaviour.

**Source file:** `backend/api/tests/test_comprehensive.py`
**Run with:** `python manage.py test api.tests.test_comprehensive`
**Total unit tests:** 14

---

## Nutriment Cleaning (`clean_nutriments`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_01 | Maps OpenFoodFacts keys to standard keys | None | Call `clean_nutriments` with raw OFF keys (energy-kcal_100g, fat_100g, etc.) | Returns dict with standardised keys: energy, fat, saturatedFat, carbs, sugar, protein, fiber, salt | Pass |
| TC_B_U_02 | Missing keys return None instead of raising error | None | Call `clean_nutriments({})` on empty dict | All keys in result are None | Pass |
| TC_B_U_03 | Falls back to energy_100g when primary key missing | None | Call `clean_nutriments` with only energy_100g=200 (no energy-kcal_100g) | result["energy"] == 200 | Pass |

---

## Product Cleaning (`clean_product`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_04 | Extracts name, brand and code from raw product | None | Call `clean_product` with code="abc123", product_name="Test Cereal", brands="BrandX" | Result contains correct code, name, and brand | Pass |
| TC_B_U_05 | Missing product name defaults to "Unknown" | None | Call `clean_product` with product_name="" | result["name"] == "Unknown" | Pass |
| TC_B_U_06 | Health score is computed during product cleaning | None | Call `clean_product` with valid product dict | result["health_score"] is int between 10 and 100 | Pass |

---

## Health Delta (`health_delta`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_07 | Calculates correct nutriment differences between two products | None | Call `health_delta` with base and alternative nutriment dicts | Delta dict contains correct differences (e.g. sugar: -5.0, protein: +5.0) and a score_delta | Pass |
| TC_B_U_08 | Missing nutriment keys are treated as zero | None | Call `health_delta({}, {})` | All keys in delta result equal 0.0 | Pass |

---

## Product Model

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_09 | String representation includes name and code | None | Create Product(code="P001", name="Oats"), call str() | str(product) contains both "Oats" and "P001" | Pass |
| TC_B_U_10 | Duplicate product code raises integrity error | Product with code="DUP" already exists | Attempt to create second Product with code="DUP" | IntegrityError is raised | Pass |

---

## Favourite Model

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_11 | Deleting a product cascades to delete its favourites | Product and Favourite both created | Call product.delete() | Favourite.objects.filter(user_id="user1").count() == 0 | Pass |
| TC_B_U_12 | Duplicate user-product combination raises integrity error | Favourite for same user and product already exists | Attempt to create second Favourite with same user and product | IntegrityError is raised | Pass |

---

## UserProfile Model

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_13 | Default values are applied on creation | None | Create UserProfile(user_id="uid-defaults") | goal="maintain", activity_level="light", gender="prefer_not", health_conditions=["N/A"] | Pass |
| TC_B_U_14 | String representation includes user_id | None | Create UserProfile(user_id="uid-str"), call str() | str(profile) contains "uid-str" | Pass |
