"""
Comprehensive test suite for the SnacKompare backend.

Organised into three layers:
  - Unit Tests        : isolated functions, models, serializers
  - Integration Tests : API endpoints with mocked external services
  - System Tests      : multi-step end-to-end user flows
"""

import os
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from api.models import Favorite, MealPlan, Product, UserProfile
from api.services import health_delta
from api.utils import clean_nutriments, clean_product, compute_health_score


# ---------------------------------------------------------------------------
# Shared throttle override so tests never hit rate limits
# ---------------------------------------------------------------------------
THROTTLE_OVERRIDE = override_settings(
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework.authentication.TokenAuthentication",
            "rest_framework.authentication.SessionAuthentication",
        ],
        "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
        "DEFAULT_THROTTLE_CLASSES": [],
        "DEFAULT_THROTTLE_RATES": {},
    }
)


class ThrottleFreeMixin:
    """Mixin that clears the Django cache and patches check_throttles to a
    no-op before every test, so throttle counters never block test requests."""

    def setUp(self):
        super().setUp()
        cache.clear()
        patcher = patch("rest_framework.views.APIView.check_throttles", lambda self, request: None)
        patcher.start()
        self.addCleanup(patcher.stop)


# ===========================================================================
# UNIT TESTS – Utility Functions (api/utils.py)
# ===========================================================================

class TestComputeHealthScore(TestCase):
    """Unit tests for the compute_health_score utility."""

    # 1
    def test_empty_nutriments_returns_zero(self):
        """None/empty nutriments short-circuits to 0."""
        self.assertEqual(compute_health_score(None), 0)
        self.assertEqual(compute_health_score({}), 0)

    # 2
    def test_zero_nutriments_returns_baseline_80(self):
        """All-zero nutriments scores exactly 80 (the baseline)."""
        n = {k: 0 for k in ["energy", "fat", "saturatedFat", "carbs", "sugar", "protein", "fiber", "salt"]}
        self.assertEqual(compute_health_score(n), 80)

    # 3
    def test_protein_boosts_score(self):
        """Higher protein raises the score above 80."""
        low  = compute_health_score({"protein": 0,  "sugar": 0, "salt": 0})
        high = compute_health_score({"protein": 30, "sugar": 0, "salt": 0})
        self.assertGreater(high, low)

    # 4
    def test_fiber_boosts_score(self):
        """Higher fiber raises the score above 80."""
        low  = compute_health_score({"fiber": 0,  "sugar": 0, "salt": 0})
        high = compute_health_score({"fiber": 15, "sugar": 0, "salt": 0})
        self.assertGreater(high, low)

    # 5
    def test_sugar_above_default_limit_penalizes(self):
        """Sugar above the default limit (25 g) lowers the score."""
        normal = compute_health_score({"sugar": 10, "salt": 0})
        sweet  = compute_health_score({"sugar": 60, "salt": 0})
        self.assertLess(sweet, normal)

    # 6
    def test_salt_above_default_limit_penalizes(self):
        """Salt above the default limit (1 g) lowers the score."""
        normal = compute_health_score({"sugar": 0, "salt": 0.5})
        salty  = compute_health_score({"sugar": 0, "salt": 5.0})
        self.assertLess(salty, normal)

    # 7
    def test_saturated_fat_penalizes(self):
        """Saturated fat reduces the score."""
        lean  = compute_health_score({"saturatedFat": 0,  "sugar": 0, "salt": 0})
        fatty = compute_health_score({"saturatedFat": 20, "sugar": 0, "salt": 0})
        self.assertLess(fatty, lean)

    # 8
    def test_score_never_below_10(self):
        """Score is clamped to a minimum of 10."""
        worst = compute_health_score({"sugar": 200, "salt": 20, "saturatedFat": 50})
        self.assertGreaterEqual(worst, 10)

    # 9
    def test_score_never_above_100(self):
        """Score is clamped to a maximum of 100."""
        best = compute_health_score({"protein": 100, "fiber": 100, "sugar": 0, "salt": 0})
        self.assertLessEqual(best, 100)

    # 10
    def test_snack_category_has_higher_sugar_allowance(self):
        """Snacks allow 30 g sugar before penalty vs 25 g default."""
        score_default = compute_health_score({"sugar": 28, "salt": 0}, category=None)
        score_snack   = compute_health_score({"sugar": 28, "salt": 0}, category="Snacks")
        self.assertGreater(score_snack, score_default)

    # 11
    def test_low_sugar_diet_flag_amplifies_sugar_penalty(self):
        """low_sugar flag multiplies total penalty by 1.1."""
        score_normal   = compute_health_score({"sugar": 50, "salt": 0}, diet_flags={})
        score_low_sugar = compute_health_score({"sugar": 50, "salt": 0}, diet_flags={"low_sugar": True})
        self.assertLess(score_low_sugar, score_normal)


class TestCleanNutriments(TestCase):
    """Unit tests for the clean_nutriments utility."""

    # 12
    def test_maps_openfoodfacts_keys_to_standard_keys(self):
        """OpenFoodFacts-style keys are translated correctly."""
        raw = {
            "energy-kcal_100g": 350,
            "fat_100g": 10,
            "saturated-fat_100g": 3,
            "carbohydrates_100g": 60,
            "sugars_100g": 15,
            "proteins_100g": 8,
            "fiber_100g": 4,
            "salt_100g": 0.5,
        }
        result = clean_nutriments(raw)
        self.assertEqual(result["energy"], 350)
        self.assertEqual(result["fat"], 10)
        self.assertEqual(result["saturatedFat"], 3)
        self.assertEqual(result["carbs"], 60)
        self.assertEqual(result["sugar"], 15)
        self.assertEqual(result["protein"], 8)
        self.assertEqual(result["fiber"], 4)
        self.assertEqual(result["salt"], 0.5)

    # 13
    def test_missing_keys_return_none(self):
        """Absent nutriment keys map to None, not raising errors."""
        result = clean_nutriments({})
        for key in ("energy", "fat", "saturatedFat", "carbs", "sugar", "protein", "fiber", "salt"):
            self.assertIsNone(result[key])

    # 14
    def test_energy_fallback_key(self):
        """Falls back to energy_100g when energy-kcal_100g is absent."""
        result = clean_nutriments({"energy_100g": 200})
        self.assertEqual(result["energy"], 200)


class TestCleanProduct(TestCase):
    """Unit tests for the clean_product utility."""

    def _raw(self, **overrides):
        base = {
            "code": "abc123",
            "product_name": "Test Cereal",
            "brands": "BrandX",
            "categories": "Breakfast",
            "nutriments": {
                "energy-kcal_100g": 380,
                "fat_100g": 5,
                "saturated-fat_100g": 1,
                "carbohydrates_100g": 70,
                "sugars_100g": 8,
                "proteins_100g": 12,
                "fiber_100g": 6,
                "salt_100g": 0.3,
            },
        }
        base.update(overrides)
        return base

    # 15
    def test_extracts_name_brand_and_code(self):
        result = clean_product(self._raw())
        self.assertEqual(result["code"], "abc123")
        self.assertEqual(result["name"], "Test Cereal")
        self.assertEqual(result["brand"], "BrandX")

    # 16
    def test_missing_product_name_defaults_to_unknown(self):
        result = clean_product(self._raw(product_name=""))
        self.assertEqual(result["name"], "Unknown")

    # 17
    def test_health_score_is_computed(self):
        result = clean_product(self._raw())
        self.assertIsInstance(result["health_score"], int)
        self.assertGreaterEqual(result["health_score"], 10)
        self.assertLessEqual(result["health_score"], 100)


# ===========================================================================
# UNIT TESTS – Services (api/services.py)
# ===========================================================================

class TestHealthDelta(TestCase):
    """Unit tests for the health_delta service function."""

    # 18
    def test_calculates_positive_deltas(self):
        base = {"sugar": 10, "protein": 5, "fiber": 2, "salt": 1}
        alt  = {"sugar": 5,  "protein": 10, "fiber": 4, "salt": 0.5}
        delta = health_delta(base, alt)
        self.assertEqual(delta["sugar"], -5.0)
        self.assertEqual(delta["protein"], 5.0)
        self.assertIn("score_delta", delta)

    # 19
    def test_missing_keys_treated_as_zero(self):
        delta = health_delta({}, {})
        for k in ("energy", "fat", "saturatedFat", "carbs", "sugar", "protein", "fiber", "salt"):
            self.assertEqual(delta[k], 0.0)


# ===========================================================================
# UNIT TESTS – Models (api/models.py)
# ===========================================================================

class TestProductModel(TestCase):
    """Unit tests for the Product model."""

    def _product(self, code="P001", name="Oats"):
        return Product.objects.create(
            code=code, name=name, brand="B", category="Breakfast", nutriments={}, health_score=70
        )

    # 20
    def test_str_representation(self):
        p = self._product()
        self.assertIn("Oats", str(p))
        self.assertIn("P001", str(p))

    # 21
    def test_duplicate_code_raises_integrity_error(self):
        self._product(code="DUP")
        with self.assertRaises(Exception):
            self._product(code="DUP")


class TestFavoriteModel(TestCase):
    """Unit tests for the Favorite model."""

    def setUp(self):
        self.product = Product.objects.create(
            code="FAV1", name="Fav Product", brand="B", category="Snacks",
            nutriments={}, health_score=60
        )

    # 22
    def test_cascade_delete_removes_favourite(self):
        Favorite.objects.create(user_id="user1", product=self.product)
        self.product.delete()
        self.assertEqual(Favorite.objects.filter(user_id="user1").count(), 0)

    # 23
    def test_unique_together_prevents_duplicates(self):
        Favorite.objects.create(user_id="user1", product=self.product)
        with self.assertRaises(Exception):
            Favorite.objects.create(user_id="user1", product=self.product)


class TestUserProfileModel(TestCase):
    """Unit tests for the UserProfile model."""

    # 24
    def test_defaults_are_applied(self):
        p = UserProfile.objects.create(user_id="uid-defaults")
        self.assertEqual(p.goal, "maintain")
        self.assertEqual(p.activity_level, "light")
        self.assertEqual(p.gender, "prefer_not")
        self.assertEqual(p.health_conditions, ["N/A"])

    # 25
    def test_str_representation(self):
        p = UserProfile.objects.create(user_id="uid-str")
        self.assertIn("uid-str", str(p))


class TestMealPlanModel(TestCase):
    """Unit tests for the MealPlan model."""

    # 26
    def test_saves_and_retrieves_plan(self):
        plan = {"structured": [{"day": "Mon", "breakfast": "Oats"}]}
        mp = MealPlan.objects.create(user_id="uid-mp", profile={"goal": "lose"}, plan=plan)
        fetched = MealPlan.objects.get(pk=mp.pk)
        self.assertEqual(fetched.plan["structured"][0]["day"], "Mon")


# ===========================================================================
# INTEGRATION TESTS – API Endpoints
# ===========================================================================

@THROTTLE_OVERRIDE
class TestSearchEndpoint(ThrottleFreeMixin, TestCase):
    """Integration tests for GET /api/search/."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def _mock_products(self, extra_tags=None):
        """Return a minimal list of products from the mocked external API."""
        return [
            {
                "code": "111",
                "product_name": "Vegan Oats",
                "brands": "BrandA",
                "categories": "Breakfast",
                "ingredients_analysis_tags": extra_tags or [],
                "nutriments": {
                    "energy-kcal_100g": 350, "fat_100g": 5, "saturated-fat_100g": 1,
                    "carbohydrates_100g": 65, "sugars_100g": 2, "proteins_100g": 10,
                    "fiber_100g": 8, "salt_100g": 0.1,
                },
            }
        ]

    # 27
    @patch("api.views.fetch_search")
    def test_vegan_filter_excludes_non_vegan_products(self, mock_fetch):
        mock_fetch.return_value = self._mock_products(extra_tags=["en:non-vegan"])
        resp = self.client.get("/api/search/?query=oats&diet=vegan")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["results"]), 0)

    # 28
    @patch("api.views.fetch_search")
    def test_vegetarian_filter_excludes_non_vegetarian_products(self, mock_fetch):
        mock_fetch.return_value = self._mock_products(extra_tags=["en:non-vegetarian"])
        resp = self.client.get("/api/search/?query=oats&diet=vegetarian")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["results"]), 0)

    # 29
    @patch("api.views.fetch_search")
    def test_allergen_exclusion_filters_matching_products(self, mock_fetch):
        products = self._mock_products()
        products[0]["allergens_tags"] = ["en:gluten"]
        mock_fetch.return_value = products
        resp = self.client.get("/api/search/?query=oats&exclude_allergens=en:gluten")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["results"]), 0)

    # 30
    @patch("api.views.fetch_search")
    def test_search_persists_products_to_database(self, mock_fetch):
        mock_fetch.return_value = self._mock_products()
        self.client.get("/api/search/?query=oats")
        self.assertTrue(Product.objects.filter(code="111").exists())

    # 31
    @patch("api.views.fetch_search")
    def test_products_without_name_are_skipped(self, mock_fetch):
        mock_fetch.return_value = [{"code": "999", "product_name": "", "nutriments": {}}]
        resp = self.client.get("/api/search/?query=unknown")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["results"]), 0)


@THROTTLE_OVERRIDE
class TestBarcodeEndpoint(ThrottleFreeMixin, TestCase):
    """Integration tests for GET /api/barcode/<code>/."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 32
    @patch("api.views.get_or_cache_product")
    @patch("api.views.fetch_barcode")
    def test_returns_serialized_product(self, mock_fetch, mock_cache):
        product = Product.objects.create(
            code="737628064502", name="Peanut Butter", brand="BrandZ",
            category="Spreads", nutriments={}, health_score=65
        )
        mock_fetch.return_value = {"code": "737628064502", "product_name": "Peanut Butter"}
        mock_cache.return_value = product
        resp = self.client.get("/api/barcode/737628064502/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["code"], "737628064502")


@THROTTLE_OVERRIDE
class TestFavouriteEndpoint(ThrottleFreeMixin, TestCase):
    """Integration tests for GET/POST/DELETE /api/favourites/."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.product = Product.objects.create(
            code="FAV-P1", name="Fav Snack", brand="B", category="Snacks",
            nutriments={}, health_score=55
        )

    # 33
    def test_get_without_user_id_returns_400(self):
        resp = self.client.get("/api/favourites/")
        self.assertEqual(resp.status_code, 400)

    # 34
    def test_post_without_code_returns_400(self):
        resp = self.client.post("/api/favourites/", {"user_id": "u1"}, format="json")
        self.assertEqual(resp.status_code, 400)

    # 35
    def test_post_with_nonexistent_code_returns_404(self):
        resp = self.client.post(
            "/api/favourites/", {"user_id": "u1", "code": "DOES-NOT-EXIST"}, format="json"
        )
        self.assertEqual(resp.status_code, 404)

    # 36
    def test_delete_nonexistent_favourite_returns_200(self):
        resp = self.client.delete(
            "/api/favourites/", {"user_id": "u1", "code": "FAV-P1"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)

    # 37
    def test_different_users_see_only_their_own_favourites(self):
        product2 = Product.objects.create(
            code="FAV-P2", name="Other Snack", brand="B", category="Snacks",
            nutriments={}, health_score=50
        )
        self.client.post("/api/favourites/", {"user_id": "user_a", "code": "FAV-P1"}, format="json")
        self.client.post("/api/favourites/", {"user_id": "user_b", "code": "FAV-P2"}, format="json")

        resp_a = self.client.get("/api/favourites/?user_id=user_a")
        resp_b = self.client.get("/api/favourites/?user_id=user_b")

        codes_a = [f["product"]["code"] for f in resp_a.json()]
        codes_b = [f["product"]["code"] for f in resp_b.json()]
        self.assertIn("FAV-P1", codes_a)
        self.assertNotIn("FAV-P2", codes_a)
        self.assertIn("FAV-P2", codes_b)
        self.assertNotIn("FAV-P1", codes_b)


@THROTTLE_OVERRIDE
class TestProfileEndpoint(ThrottleFreeMixin, TestCase):
    """Integration tests for GET/PUT /api/profile/."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 38
    def test_get_without_user_id_returns_400(self):
        resp = self.client.get("/api/profile/")
        self.assertEqual(resp.status_code, 400)

    # 39
    def test_put_creates_profile_with_camelcase_fields(self):
        payload = {
            "user_id": "new-user-cc",
            "name": "Alice",
            "gender": "female",
            "goal": "lose",
            "activityLevel": "moderate",
            "heightCm": 165,
            "weightKg": 65,
            "age": 28,
            "dietPrefs": ["vegan"],
            "healthConditions": ["N/A"],
        }
        resp = self.client.put("/api/profile/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["name"], "Alice")
        self.assertEqual(resp.json()["activityLevel"], "moderate")

    # 40
    def test_put_accepts_legacy_diet_field_and_converts_it(self):
        payload = {
            "user_id": "legacy-diet-user",
            "diet": "vegetarian",
            "healthConditions": ["N/A"],
        }
        resp = self.client.put("/api/profile/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("vegetarian", resp.json()["dietPrefs"])


@THROTTLE_OVERRIDE
class TestAuthEndpoints(ThrottleFreeMixin, TestCase):
    """Integration tests for /api/auth/register/ and /api/auth/login/."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 41
    def test_register_without_email_returns_400(self):
        resp = self.client.post("/api/auth/register/", {"password": "pass123"}, format="json")
        self.assertEqual(resp.status_code, 400)

    # 42
    def test_register_without_password_returns_400(self):
        resp = self.client.post("/api/auth/register/", {"email": "test@example.com"}, format="json")
        self.assertEqual(resp.status_code, 400)

    # 43
    def test_login_with_wrong_password_returns_401(self):
        self.client.post(
            "/api/auth/register/",
            {"email": "login_test@example.com", "password": "correctpass"},
            format="json",
        )
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "login_test@example.com", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(resp.status_code, 401)


@THROTTLE_OVERRIDE
class TestExplainEndpoint(ThrottleFreeMixin, TestCase):
    """Integration tests for POST /api/explain/."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 44
    def test_missing_base_returns_400(self):
        resp = self.client.post(
            "/api/explain/",
            {"alternative": {"name": "Alt", "nutriments": {}}},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    # 45
    def test_missing_alternative_returns_400(self):
        resp = self.client.post(
            "/api/explain/",
            {"base": {"name": "Base", "nutriments": {}}},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)


# ===========================================================================
# SYSTEM TESTS – Multi-step end-to-end flows
# ===========================================================================

@THROTTLE_OVERRIDE
class TestSystemAuthFlow(ThrottleFreeMixin, TestCase):
    """System tests: full authentication flow."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 46
    def test_register_then_login_returns_same_token(self):
        email, password = "sys_auth@example.com", "securepass"
        reg = self.client.post(
            "/api/auth/register/", {"email": email, "password": password}, format="json"
        )
        self.assertEqual(reg.status_code, 200)
        token_reg = reg.json()["token"]

        login = self.client.post(
            "/api/auth/login/", {"email": email, "password": password}, format="json"
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()["token"], token_reg)

    # 47
    def test_duplicate_registration_is_rejected(self):
        payload = {"email": "dupe@example.com", "password": "pass"}
        self.client.post("/api/auth/register/", payload, format="json")
        resp = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(resp.status_code, 400)


@THROTTLE_OVERRIDE
class TestSystemProfileLifecycle(ThrottleFreeMixin, TestCase):
    """System tests: create → update → verify profile."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user_id = "sys-profile-user"

    # 48
    def test_new_user_gets_default_profile(self):
        resp = self.client.get(f"/api/profile/?user_id={self.user_id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["user_id"], self.user_id)
        self.assertEqual(data["goal"], "maintain")

    # 49
    def test_create_then_update_then_retrieve_profile(self):
        # Create
        self.client.put(
            "/api/profile/",
            {"user_id": self.user_id, "name": "Bob", "goal": "lose", "healthConditions": ["N/A"]},
            format="json",
        )
        # Update
        self.client.put(
            "/api/profile/",
            {"user_id": self.user_id, "name": "Bob Updated", "goal": "gain", "healthConditions": ["N/A"]},
            format="json",
        )
        # Retrieve
        resp = self.client.get(f"/api/profile/?user_id={self.user_id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["name"], "Bob Updated")
        self.assertEqual(resp.json()["goal"], "gain")


@THROTTLE_OVERRIDE
class TestSystemFavouritesLifecycle(ThrottleFreeMixin, TestCase):
    """System tests: add → list → delete → confirm empty."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user_id = "sys-fav-user"
        self.product = Product.objects.create(
            code="SYS-P1", name="System Snack", brand="SysBrand",
            category="Snacks", nutriments={}, health_score=70
        )

    # 50
    def test_full_add_list_delete_cycle(self):
        # Add
        add = self.client.post(
            "/api/favourites/", {"user_id": self.user_id, "code": "SYS-P1"}, format="json"
        )
        self.assertEqual(add.status_code, 200)

        # List – should have 1 item
        lst = self.client.get(f"/api/favourites/?user_id={self.user_id}")
        self.assertEqual(len(lst.json()), 1)

        # Delete
        delete = self.client.delete(
            "/api/favourites/", {"user_id": self.user_id, "code": "SYS-P1"}, format="json"
        )
        self.assertEqual(delete.status_code, 200)

        # List – should be empty
        lst2 = self.client.get(f"/api/favourites/?user_id={self.user_id}")
        self.assertEqual(len(lst2.json()), 0)

    # 51
    def test_adding_same_favourite_twice_is_idempotent(self):
        self.client.post("/api/favourites/", {"user_id": self.user_id, "code": "SYS-P1"}, format="json")
        resp = self.client.post("/api/favourites/", {"user_id": self.user_id, "code": "SYS-P1"}, format="json")
        self.assertEqual(resp.status_code, 200)
        lst = self.client.get(f"/api/favourites/?user_id={self.user_id}")
        self.assertEqual(len(lst.json()), 1)


@THROTTLE_OVERRIDE
class TestSystemExplainFallback(ThrottleFreeMixin, TestCase):
    """System tests: explain endpoint deterministic fallback (no OpenAI key)."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 52
    def test_explain_returns_fallback_text_without_openai(self):
        payload = {
            "base": {"name": "Crisps", "nutriments": {"sugar": 2, "salt": 1.5, "saturatedFat": 5}},
            "alternative": {"name": "Rice Cakes", "nutriments": {"sugar": 0.5, "salt": 0.3, "saturatedFat": 0.2}},
        }
        with patch.dict(os.environ, {}, clear=True):
            if "OPENAI_API_KEY" in os.environ:
                del os.environ["OPENAI_API_KEY"]
            resp = self.client.post("/api/explain/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("explanation", resp.json())


@THROTTLE_OVERRIDE
class TestSystemMealPlan(ThrottleFreeMixin, TestCase):
    """System tests: meal plan generation and persistence."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 53
    @patch("api.views.generate_meal_plan_llm")
    def test_meal_plan_is_saved_to_database(self, mock_plan):
        mock_plan.return_value = {"structured": [{"day": "Mon", "breakfast": "Oats"}]}
        payload = {
            "user_id": "sys-meal-user",
            "profile": {"goal": "lose"},
            "favourites": [{"name": "Greek Yogurt"}],
        }
        resp = self.client.post("/api/meal-plan/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(MealPlan.objects.filter(user_id="sys-meal-user").exists())

    # 54
    @patch("api.views.generate_meal_plan_llm")
    def test_meal_plan_contains_seven_days(self, mock_plan):
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        mock_plan.return_value = {
            "structured": [{"day": d, "breakfast": "Oats"} for d in days]
        }
        payload = {
            "user_id": "sys-meal-user-2",
            "profile": {"goal": "maintain"},
            "favourites": [{"name": "Oats"}, {"name": "Banana"}],
        }
        resp = self.client.post("/api/meal-plan/", payload, format="json")
        self.assertEqual(resp.status_code, 200)
        plan = resp.json()["plan"]
        self.assertIn("structured", plan)
        self.assertEqual(len(plan["structured"]), 7)


@THROTTLE_OVERRIDE
class TestSystemChatValidation(ThrottleFreeMixin, TestCase):
    """System tests: chat endpoint input validation."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    # 55
    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"})
    @patch("api.views.OpenAI")
    def test_chat_with_profile_context_sanitized(self, mock_openai_cls):
        mock_client = Mock()
        mock_client.chat.completions.create.return_value = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="Eat more veggies."))]
        )
        mock_openai_cls.return_value = mock_client

        resp = self.client.post(
            "/api/chat/",
            {
                "prompt": "What should I eat?",
                "profileContext": {
                    "goal": "lose",
                    "activityLevel": "moderate",
                    "age": 30,
                    "weightKg": 75,
                    "heightCm": 175,
                    # This invalid field should be stripped by sanitize_profile_context
                    "injected_field": "<script>alert(1)</script>",
                },
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("aiResponse", resp.json())
        # Ensure the injected_field wasn't passed to the model as-is
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args[1]["messages"] if call_args[1] else call_args[0][0]
        system_texts = " ".join(m["content"] for m in messages if m["role"] == "system")
        self.assertNotIn("injected_field", system_texts)
