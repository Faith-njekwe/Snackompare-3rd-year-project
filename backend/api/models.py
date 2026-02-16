from django.db import models


class Product(models.Model):
  code = models.CharField(max_length=64, unique=True)
  name = models.CharField(max_length=255)
  brand = models.CharField(max_length=255, blank=True)
  category = models.CharField(max_length=255, blank=True)
  nutriments = models.JSONField(default=dict)
  additives = models.JSONField(default=list, blank=True)
  allergens = models.JSONField(default=list, blank=True)
  ingredients = models.TextField(blank=True)
  ecoscore = models.CharField(max_length=8, blank=True)
  health_score = models.IntegerField(default=0)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"{self.name} ({self.code})"


class Favorite(models.Model):
  user_id = models.CharField(max_length=128)
  product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="favorites")
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    unique_together = ("user_id", "product")


class MealPlan(models.Model):
  user_id = models.CharField(max_length=128)
  profile = models.JSONField(default=dict)
  plan = models.JSONField(default=dict)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f"MealPlan for {self.user_id} at {self.created_at}"

# add this helper for health condictions
def default_health_conditions():
  return ["N/A"]


class UserProfile(models.Model):
  user_id = models.CharField(max_length=128, unique=True)
  name = models.CharField(max_length=255, blank=True, default="")

  # onboarding/profile fields
  gender = models.CharField(max_length=32, blank=True, default="prefer_not")
  goal = models.CharField(max_length=32, blank=True, default="maintain")
  activity_level = models.CharField(max_length=32, blank=True, default="light")
  target_change_kg_6mo = models.PositiveSmallIntegerField(null=True, blank=True)

  age = models.PositiveSmallIntegerField(null=True, blank=True)
  height_cm = models.PositiveSmallIntegerField(null=True, blank=True)
  weight_kg = models.PositiveSmallIntegerField(null=True, blank=True)

  diet_prefs = models.JSONField(default=list, blank=True)
  allergens = models.JSONField(default=list, blank=True)
  health_conditions = models.JSONField(default=default_health_conditions, blank=True)

  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"UserProfile for {self.user_id}"
