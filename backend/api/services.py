import logging
import os
from typing import List

import requests

from django.core.cache import cache

from .models import Product
from .utils import clean_product, compute_health_score

try:
  import openai
except ImportError:  # pragma: no cover - optional dependency
  openai = None

import base64
import json
from openai import OpenAI

logger = logging.getLogger(__name__)

OPENFOODFACTS_BASE = "https://world.openfoodfacts.org"
DEFAULT_DIET_FLAGS = {"low_sugar": False, "low_salt": False}


def fetch_search(query: str, page: int = 1, page_size: int = 10) -> List[dict]:
  cache_key = f"search:{query}:{page}:{page_size}"
  cached = cache.get(cache_key)
  if cached is not None:
    return cached
  params = {
    "search_terms": query,
    "search_simple": 1,
    "json": 1,
    "page_size": page_size,
    "page": page,
  }
  resp = requests.get(f"{OPENFOODFACTS_BASE}/cgi/search.pl", params=params, timeout=10)
  resp.raise_for_status()
  data = resp.json()
  products = data.get("products", [])
  cache.set(cache_key, products, timeout=300)
  return products


def fetch_barcode(barcode: str) -> dict:
  cache_key = f"barcode:{barcode}"
  cached = cache.get(cache_key)
  if cached is not None:
    return cached
  resp = requests.get(f"{OPENFOODFACTS_BASE}/api/v0/product/{barcode}.json", timeout=10)
  resp.raise_for_status()
  data = resp.json()
  if data.get("status") != 1:
    return {}
  product = data.get("product", {})
  cache.set(cache_key, product, timeout=600)
  return product


def get_or_cache_product(raw: dict) -> Product:
  cleaned = clean_product(raw)
  if not cleaned.get("code"):
    raise ValueError("Product has no code")
  product, _ = Product.objects.update_or_create(
    code=cleaned["code"],
    defaults={
      "name": cleaned["name"],
      "brand": cleaned["brand"],
      "category": cleaned["category"],
      "nutriments": cleaned["nutriments"],
      "additives": cleaned.get("additives", []),
      "allergens": cleaned.get("allergens", []),
      "ingredients": cleaned.get("ingredients", ""),
      "ecoscore": cleaned.get("ecoscore", ""),
      "health_score": cleaned["health_score"],
    },
  )
  return product


def health_delta(base: dict, alt: dict) -> dict:
  keys = ["energy", "fat", "saturatedFat", "carbs", "sugar", "protein", "fiber", "salt"]
  deltas = {}
  for k in keys:
    try:
      deltas[k] = round((alt.get(k) or 0) - (base.get(k) or 0), 2)
    except Exception:
      deltas[k] = None
  deltas["score_delta"] = compute_health_score(alt) - compute_health_score(base)
  return deltas


def generate_meal_plan_llm(profile: dict, favourites: List[dict]) -> dict:
  """Call OpenAI if available, otherwise return a deterministic mocked plan."""
  api_key = os.getenv("OPENAI_API_KEY")
  if openai and api_key:
    openai.api_key = api_key
    prompt = _build_prompt(profile, favourites)
    completion = openai.ChatCompletion.create(
      model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
      messages=[{"role": "system", "content": "You are a meal planner."}, {"role": "user", "content": prompt}],
      temperature=0.3,
    )
    content = completion.choices[0].message["content"]
    return {"raw": content}

  # Fallback: deterministic pseudo-plan using favourites
  days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  meals = []
  for i, day in enumerate(days):
    base = favourites[i % len(favourites)] if favourites else {"name": "Oats", "brand": "Generic"}
    meals.append(
      {
        "day": day,
        "breakfast": base["name"],
        "lunch": "Lean chicken salad",
        "dinner": "Grilled salmon + greens",
        "snack": "Greek yogurt + berries",
      }
    )
  return {"structured": meals, "profile_used": profile}


def _build_prompt(profile: dict, favourites: List[dict]) -> str:
  favourite_names = ", ".join([f.get("name", "") for f in favourites]) or "no favourites provided"
  return (
    "Create a 7-day meal plan with breakfast, lunch, dinner, and a snack. "
    f"Respect goal: {profile.get('goal')}, diet: {profile.get('diet')}, allergens: {profile.get('allergens')}, "
    f"calorie target: {profile.get('calorie_target')}. "
    f"Prefer these foods when reasonable: {favourite_names}. "
    "Respond concisely in bullet form per day."
  )

# For meal photo analysis

VISION_SYSTEM_PROMPT = """
You are a food image calorie estimation system.

You MUST:
- Analyze the provided food image
- Identify visible foods
- Estimate portion size in grams
- Estimate calories per item
- Return ONLY valid JSON
- Follow the exact schema provided
- Use assumptions when uncertain
- Include confidence scores between 0 and 1

You MUST NOT:
- Ask questions
- Include explanations
- Include markdown
- Include comments
- Include extra keys
- Include text outside JSON

If uncertain, lower confidence instead of refusing.
""".strip()

VISION_USER_PROMPT = """
Estimate calories from this meal photo.

Return JSON using this exact schema:

{
  "items": [
    {
      "name": "string",
      "estimated_grams": number,
      "calories": number,
      "confidence": number,
      "assumptions": ["string"]
    }
  ],
  "total_calories": number,
  "overall_confidence": number
}
""".strip()

_vision_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _validate_vision_json(raw: str) -> dict:
    try:
        cleaned_raw = raw.replace("```json", "").replace("```", "").strip()
        data = json.loads(cleaned_raw)
    except json.JSONDecodeError:
        logger.error("Vision returned invalid JSON: %s", raw)
        raise ValueError("Vision model returned invalid JSON")

    required_top = {"items", "total_calories", "overall_confidence"}
    if not required_top.issubset(data):
        raise ValueError("Missing top-level keys")

    for item in data["items"]:
        for k in ("name", "estimated_grams", "calories", "confidence", "assumptions"):
            if k not in item:
                raise ValueError("Invalid item schema")

        item["confidence"] = max(0.0, min(1.0, float(item["confidence"])))

    data["overall_confidence"] = max(
        0.0, min(1.0, float(data["overall_confidence"]))
    )

    return data


def estimate_calories_from_image_bytes(image_bytes: bytes) -> dict:
    """
    Vision-based calorie estimation using GPT-4o-mini.
    Returns validated structured JSON.
    """
    if not image_bytes:
        raise ValueError("Empty image")

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    resp = _vision_client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.2,
        max_tokens=700,
        messages=[
            {"role": "system", "content": VISION_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": VISION_USER_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_b64}"
                        }
                    },
                ],
            },
        ],
    )

    raw = resp.choices[0].message.content
    return _validate_vision_json(raw)

