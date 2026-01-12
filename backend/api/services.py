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
