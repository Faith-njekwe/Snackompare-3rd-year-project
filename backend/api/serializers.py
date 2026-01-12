from rest_framework import serializers
from .models import Product, Favorite, MealPlan


class ProductSerializer(serializers.ModelSerializer):
  class Meta:
    model = Product
    fields = [
      "code",
      "name",
      "brand",
      "category",
      "nutriments",
      "additives",
      "allergens",
      "ingredients",
      "ecoscore",
      "health_score",
    ]


class FavoriteSerializer(serializers.ModelSerializer):
  product = ProductSerializer()

  class Meta:
    model = Favorite
    fields = ["user_id", "product", "created_at"]


class MealPlanSerializer(serializers.ModelSerializer):
  class Meta:
    model = MealPlan
    fields = ["user_id", "profile", "plan", "created_at"]
