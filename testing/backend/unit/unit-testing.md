# Backend Unit Tests

Unit tests verify individual functions and models in isolation, without making HTTP requests or hitting external services. These tests cover the core business logic of SnacKompare's backend: health score computation, nutriment cleaning, product mapping, and database model behaviour.

**Source file:** `backend/api/tests/test_comprehensive.py`
**Run with:** `python manage.py test api.tests.test_comprehensive`
**Total unit tests:** 26

---

## Health Score Computation (`compute_health_score`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_01 | Returns 0 for null nutriments | None | Call `compute_health_score(None)` | Returns 0 | Pass |
| TC_B_U_02 | Returns 0 for empty nutriments | None | Call `compute_health_score({})` | Returns 0 | Pass |
| TC_B_U_03 | All-zero nutriments returns baseline score of 80 | None | Call `compute_health_score` with all fields set to 0 (energy, fat, sugar, salt, etc.) | Returns exactly 80 | Pass |
| TC_B_U_04 | High protein boosts score | None | Call `compute_health_score` twice — once with protein=0, once with protein=30 | High protein score > low protein score | Pass |
| TC_B_U_05 | High fibre boosts score | None | Call `compute_health_score` twice — once with fiber=0, once with fiber=15 | High fibre score > low fibre score | Pass |
| TC_B_U_06 | Sugar above threshold (25g) penalises score | None | Call `compute_health_score` twice — once with sugar=10, once with sugar=60 | High sugar score < normal sugar score | Pass |
| TC_B_U_07 | Salt above threshold (1g) penalises score | None | Call `compute_health_score` twice — once with salt=0.5, once with salt=5.0 | High salt score < normal salt score | Pass |
| TC_B_U_08 | Saturated fat penalises score | None | Call `compute_health_score` twice — once with saturatedFat=0, once with saturatedFat=20 | High fat score < lean score | Pass |
| TC_B_U_09 | Score never drops below 10 | None | Call `compute_health_score` with extreme values (sugar=200, salt=20, saturatedFat=50) | Score >= 10 | Pass |
| TC_B_U_10 | Score never exceeds 100 | None | Call `compute_health_score` with best-case values (protein=100, fiber=100, sugar=0, salt=0) | Score <= 100 | Pass |
| TC_B_U_11 | Snack category allows higher sugar before penalty | None | Score same nutriments (sugar=28) with category=None then category="Snacks" | Snack score > default score | Pass |
| TC_B_U_12 | Low-sugar diet flag amplifies sugar penalty | None | Score same 50g sugar product with diet_flags={} then diet_flags={"low_sugar": True} | Low-sugar score < normal score | Pass |

---

## Nutriment Cleaning (`clean_nutriments`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_13 | Maps OpenFoodFacts keys to standard keys | None | Call `clean_nutriments` with raw OFF keys (energy-kcal_100g, fat_100g, etc.) | Returns dict with standardised keys: energy, fat, saturatedFat, carbs, sugar, protein, fiber, salt | Pass |
| TC_B_U_14 | Missing keys return None instead of raising error | None | Call `clean_nutriments({})` on empty dict | All keys in result are None | Pass |
| TC_B_U_15 | Falls back to energy_100g when primary key missing | None | Call `clean_nutriments` with only energy_100g=200 (no energy-kcal_100g) | result["energy"] == 200 | Pass |

---

## Product Cleaning (`clean_product`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_16 | Extracts name, brand and code from raw product | None | Call `clean_product` with code="abc123", product_name="Test Cereal", brands="BrandX" | Result contains correct code, name, and brand | Pass |
| TC_B_U_17 | Missing product name defaults to "Unknown" | None | Call `clean_product` with product_name="" | result["name"] == "Unknown" | Pass |
| TC_B_U_18 | Health score is computed during product cleaning | None | Call `clean_product` with valid product dict | result["health_score"] is int between 10 and 100 | Pass |

---

## Health Delta (`health_delta`)

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_19 | Calculates correct nutriment differences between two products | None | Call `health_delta` with base and alternative nutriment dicts | Delta dict contains correct differences (e.g. sugar: -5.0, protein: +5.0) and a score_delta | Pass |
| TC_B_U_20 | Missing nutriment keys are treated as zero | None | Call `health_delta({}, {})` | All keys in delta result equal 0.0 | Pass |

---

## Product Model

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_21 | String representation includes name and code | None | Create Product(code="P001", name="Oats"), call str() | str(product) contains both "Oats" and "P001" | Pass |
| TC_B_U_22 | Duplicate product code raises integrity error | Product with code="DUP" already exists | Attempt to create second Product with code="DUP" | IntegrityError is raised | Pass |

---

## Favourite Model

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_23 | Deleting a product cascades to delete its favourites | Product and Favourite both created | Call product.delete() | Favourite.objects.filter(user_id="user1").count() == 0 | Pass |
| TC_B_U_24 | Duplicate user-product combination raises integrity error | Favourite for same user and product already exists | Attempt to create second Favourite with same user and product | IntegrityError is raised | Pass |

---

## UserProfile Model

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_25 | Default values are applied on creation | None | Create UserProfile(user_id="uid-defaults") | goal="maintain", activity_level="light", gender="prefer_not", health_conditions=["N/A"] | Pass |
| TC_B_U_26 | String representation includes user_id | None | Create UserProfile(user_id="uid-str"), call str() | str(profile) contains "uid-str" | Pass |

---

## MealPlan Model

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_U_27 | Saves and retrieves nested plan structure correctly | None | Create MealPlan with plan={"structured": [{"day": "Mon", "breakfast": "Oats"}]}, fetch from DB | Fetched plan has plan["structured"][0]["day"] == "Mon" | Pass |
