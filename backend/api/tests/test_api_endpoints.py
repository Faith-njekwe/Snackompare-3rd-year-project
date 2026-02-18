import os
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from api.models import Product


@override_settings(
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": [
            "rest_framework.authentication.TokenAuthentication",
            "rest_framework.authentication.SessionAuthentication",
        ],
        "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
        "DEFAULT_THROTTLE_CLASSES": [
            "rest_framework.throttling.AnonRateThrottle",
            "rest_framework.throttling.UserRateThrottle",
        ],
        "DEFAULT_THROTTLE_RATES": {"anon": "60/min", "user": "120/min"},
    }
)
class SnackompareApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _mock_openai_client(self, text="Mocked AI response"):
        client = Mock()
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=text))]
        )
        client.chat.completions.create.return_value = response
        return client

    # 1) Basic endpoint health
    def test_ping_endpoint(self):
        resp = self.client.get("/api/ping/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json().get("status"), "ok")

    # 2) Search validation
    def test_search_requires_query(self):
        resp = self.client.get("/api/search/")
        self.assertEqual(resp.status_code, 400)

    # 3) Search works with mocked external call
    @patch("api.views.fetch_search")
    def test_search_success(self, mock_fetch_search):
        mock_fetch_search.return_value = [
            {
                "code": "12345",
                "product_name": "Test Oats",
                "brands": "BrandX",
                "categories": "Breakfast",
                "nutriments": {
                    "energy-kcal_100g": 380,
                    "fat_100g": 7,
                    "saturated-fat_100g": 1,
                    "carbohydrates_100g": 67,
                    "sugars_100g": 1,
                    "proteins_100g": 13,
                    "fiber_100g": 9,
                    "salt_100g": 0.01,
                },
            }
        ]
        resp = self.client.get("/api/search/?query=oats")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("results", resp.json())

    # 4) Barcode endpoint
    @patch("api.views.fetch_barcode", return_value={})
    def test_barcode_unknown_returns_200_or_404(self, _):
        resp = self.client.get("/api/barcode/0000000000/")
        self.assertIn(resp.status_code, (200, 404))

    # 5) Chatbot empty message
    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"})
    def test_chat_empty_prompt(self):
        resp = self.client.post("/api/chat/", {"prompt": ""}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("error", resp.json())

    # 6) Chatbot too long message
    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"})
    @patch("api.views.OpenAI")
    def test_chat_too_long_message(self, mock_openai_cls):
        mock_openai_cls.return_value = self._mock_openai_client("Long prompt handled")
        very_long_prompt = "x" * 50000
        resp = self.client.post("/api/chat/", {"prompt": very_long_prompt}, format="json")
        self.assertIn(resp.status_code, (200, 400, 413, 500))

    # 7) Chatbot spam lots of messages
    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"})
    @patch("api.views.OpenAI")
    def test_chat_spam_multiple_requests(self, mock_openai_cls):
        mock_openai_cls.return_value = self._mock_openai_client("OK")
        statuses = []
        for i in range(30):
            resp = self.client.post("/api/chat/", {"prompt": f"spam {i}"}, format="json")
            statuses.append(resp.status_code)
            self.assertIn(resp.status_code, (200, 429))
        self.assertTrue(any(s == 200 for s in statuses))

    # 8) Meal scanner: no image
    def test_meal_photo_requires_image(self):
        resp = self.client.post("/api/meals/photo-calories/", {}, format="multipart")
        self.assertEqual(resp.status_code, 400)

    # 9) Meal scanner: too large image
    def test_meal_photo_rejects_large_image(self):
        big_file = SimpleUploadedFile(
            "large.jpg",
            b"a" * (5 * 1024 * 1024 + 1),
            content_type="image/jpeg",
        )
        resp = self.client.post(
            "/api/meals/photo-calories/",
            {"image": big_file},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 413)

    # 10) Meal scanner: no items recognised
    @patch("api.views.estimate_calories_from_image_bytes", side_effect=ValueError("No items recognised"))
    def test_meal_photo_no_items_recognised(self, _):
        img = SimpleUploadedFile("meal.jpg", b"fake-image-bytes", content_type="image/jpeg")
        resp = self.client.post(
            "/api/meals/photo-calories/",
            {"image": img},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 422)
        self.assertIn("error", resp.json())

    # 11) Profile endpoint default payload for unknown user
    def test_profile_get_default_when_missing(self):
        resp = self.client.get("/api/profile/?user_id=test-user-001")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json().get("user_id"), "test-user-001")

    # 12) Favourites flow: add, list, delete
    def test_favourites_crud_flow(self):
        Product.objects.create(
            code="111",
            name="Protein Bar",
            brand="BrandY",
            category="Snacks",
            nutriments={},
            health_score=50,
        )

        add_resp = self.client.post(
            "/api/favourites/",
            {"user_id": "u1", "code": "111"},
            format="json",
        )
        self.assertEqual(add_resp.status_code, 200)

        list_resp = self.client.get("/api/favourites/?user_id=u1")
        self.assertEqual(list_resp.status_code, 200)
        self.assertEqual(len(list_resp.json()), 1)

        del_resp = self.client.delete(
            "/api/favourites/",
            {"user_id": "u1", "code": "111"},
            format="json",
        )
        self.assertEqual(del_resp.status_code, 200)
