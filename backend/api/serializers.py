from rest_framework import serializers
from .models import Product, Favorite, MealPlan, UserProfile


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


class UserProfileSerializer(serializers.ModelSerializer):
  activityLevel = serializers.CharField(source="activity_level", required=False, allow_blank=True)
  heightCm = serializers.IntegerField(source="height_cm", required=False, allow_null=True, min_value=0)
  weightKg = serializers.IntegerField(source="weight_kg", required=False, allow_null=True, min_value=0)
  targetChangeKg6mo = serializers.IntegerField(
    source="target_change_kg_6mo", required=False, allow_null=True, min_value=0
  )
  dietPrefs = serializers.ListField(source="diet_prefs", child=serializers.CharField(), required=False)
  healthConditions = serializers.ListField(
    source="health_conditions", child=serializers.CharField(), required=False
  )

  # legacy read-only keys (for compatibility)
  diet = serializers.SerializerMethodField(read_only=True)
  filters = serializers.SerializerMethodField(read_only=True)

  class Meta:
    model = UserProfile
    fields = [
      "user_id",
      "name",
      "gender",
      "goal",
      "activityLevel",
      "targetChangeKg6mo",
      "age",
      "heightCm",
      "weightKg",
      "dietPrefs",
      "allergens",
      "healthConditions",
      "updated_at",
      "diet",
      "filters",
    ]
    read_only_fields = ["updated_at"]

  def get_diet(self, obj):
    return obj.diet_prefs[0] if obj.diet_prefs else "None"

  def get_filters(self, obj):
    return {}
