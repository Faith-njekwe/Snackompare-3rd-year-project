CATEGORY_LIMITS = {
  "Snacks": {"sugar": 30, "salt": 1.5},
  "Breakfast": {"sugar": 20, "salt": 1},
  "Beverages": {"sugar": 10, "salt": 0.5},
}


def compute_health_score(n, category=None, diet_flags=None):
  """Scoring: reward protein/fiber, penalise sugar/salt/sat fat with category thresholds and optional diet flags."""
  if not n:
    return 0
  diet_flags = diet_flags or {}
  limits = CATEGORY_LIMITS.get(category, {"sugar": 25, "salt": 1})
  sugar_penalty = max(0, (n.get("sugar", 0) - limits["sugar"])) * 1.2
  salt_penalty = max(0, (n.get("salt", 0) - limits["salt"])) * 8
  sat_penalty = (n.get("saturatedFat", 0) or 0) * 0.8
  penalties = sugar_penalty + salt_penalty + sat_penalty
  boosts = (n.get("fiber", 0) or 0) * 2 + (n.get("protein", 0) or 0) * 0.6
  if diet_flags.get("low_sugar"):
    penalties *= 1.1
  if diet_flags.get("low_salt"):
    penalties *= 1.1
  score = max(10, min(100, round(80 + boosts - penalties)))
  return score


def clean_nutriments(raw):
  """Map OpenFoodFacts keys into a tidy dict."""
  nutriments = raw or {}
  return {
    "energy": nutriments.get("energy-kcal_100g") or nutriments.get("energy_100g"),
    "fat": nutriments.get("fat_100g"),
    "saturatedFat": nutriments.get("saturated-fat_100g"),
    "carbs": nutriments.get("carbohydrates_100g"),
    "sugar": nutriments.get("sugars_100g"),
    "protein": nutriments.get("proteins_100g"),
    "fiber": nutriments.get("fiber_100g"),
    "salt": nutriments.get("salt_100g"),
  }


def clean_product(raw):
  nutriments = clean_nutriments(raw.get("nutriments", {}))
  additives = raw.get("additives_tags") or []
  allergens = raw.get("allergens_tags") or []
  ecoscore = raw.get("ecoscore_grade") or ""
  return {
    "code": raw.get("code") or raw.get("id") or "",
    "name": raw.get("product_name") or "Unknown",
    "brand": raw.get("brands") or "",
    "category": (raw.get("categories_tags") or [""])[0].replace("en:", "").title()
    if raw.get("categories_tags")
    else raw.get("categories") or "",
    "nutriments": nutriments,
    "additives": additives,
    "allergens": allergens,
    "ingredients": raw.get("ingredients_text") or "",
    "ecoscore": ecoscore,
    "health_score": compute_health_score(nutriments, category=None, diet_flags=None),
  }
