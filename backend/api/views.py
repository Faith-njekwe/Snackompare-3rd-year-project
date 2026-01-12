from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Favorite, MealPlan, Product
from .serializers import FavoriteSerializer, MealPlanSerializer, ProductSerializer
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .services import fetch_barcode, fetch_search, generate_meal_plan_llm, get_or_cache_product, health_delta
from .utils import clean_product, compute_health_score


class PingView(APIView):
  def get(self, request):
    return Response({"status": "ok"})


class SearchView(APIView):
  def get(self, request):
    query = request.query_params.get("query")
    page = int(request.query_params.get("page", 1))
    page_size = int(request.query_params.get("page_size", 10))
    diet = request.query_params.get("diet")
    exclude_allergens = request.query_params.getlist("exclude_allergens")
    if not query:
      return Response({"error": "query is required"}, status=status.HTTP_400_BAD_REQUEST)
    products = fetch_search(query, page=page, page_size=page_size)
    cleaned = []
    for p in products:
      if not p.get("product_name"):
        continue
      item = clean_product(p)
      if diet and diet.lower() in ["vegan", "vegetarian"]:
        if p.get("ingredients_analysis_tags"):
          tags = p.get("ingredients_analysis_tags", [])
          if diet.lower() == "vegan" and "en:non-vegan" in tags:
            continue
          if diet.lower() == "vegetarian" and "en:non-vegetarian" in tags:
            continue
      if exclude_allergens:
        if any(a in item.get("allergens", []) for a in exclude_allergens):
          continue
      cleaned.append(item)
    # cache cleaned items
    with transaction.atomic():
      for item in cleaned:
        Product.objects.update_or_create(
          code=item["code"],
          defaults={
            "name": item["name"],
            "brand": item["brand"],
            "category": item["category"],
            "nutriments": item["nutriments"],
            "health_score": item["health_score"],
          },
        )
    return Response({"results": cleaned})


class BarcodeView(APIView):
  def get(self, request, code):
    raw = fetch_barcode(code)
    if not raw:
      return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    product = get_or_cache_product(raw)
    return Response(ProductSerializer(product).data)


class FavoriteView(APIView):
  def get(self, request):
    user_id = request.query_params.get("user_id")
    if not user_id:
      return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
    favourites = Favorite.objects.filter(user_id=user_id).select_related("product")
    return Response(FavoriteSerializer(favourites, many=True).data)

  def post(self, request):
    user_id = request.data.get("user_id")
    code = request.data.get("code")
    if not user_id or not code:
      return Response({"error": "user_id and code are required"}, status=status.HTTP_400_BAD_REQUEST)
    product = get_object_or_404(Product, code=code)
    fav, _ = Favorite.objects.get_or_create(user_id=user_id, product=product)
    return Response({"status": "saved", "code": fav.product.code})

  def delete(self, request):
    user_id = request.data.get("user_id")
    code = request.data.get("code")
    if not user_id or not code:
      return Response({"error": "user_id and code are required"}, status=status.HTTP_400_BAD_REQUEST)
    Favorite.objects.filter(user_id=user_id, product__code=code).delete()
    return Response({"status": "deleted"})


class MealPlanView(APIView):
  def post(self, request):
    user_id = request.data.get("user_id", "anonymous")
    profile = request.data.get("profile") or {}
    favourites = request.data.get("favourites") or []
    plan = generate_meal_plan_llm(profile, favourites)
    meal_plan = MealPlan.objects.create(user_id=user_id, profile=profile, plan=plan)
    return Response(MealPlanSerializer(meal_plan).data)


class ExplainView(APIView):
  """Generate a short explanation comparing two products using LLM fallback."""

  def post(self, request):
    base = request.data.get("base")
    alternative = request.data.get("alternative")
    profile = request.data.get("profile") or {}
    if not base or not alternative:
      return Response({"error": "base and alternative are required"}, status=status.HTTP_400_BAD_REQUEST)

    delta = health_delta(base.get("nutriments", {}), alternative.get("nutriments", {}))
    prompt = (
      "Compare these two foods and explain in 4 concise bullet points why the alternative can be healthier. "
      f"Base: {base.get('name')} nutriments: {base.get('nutriments')}. "
      f"Alternative: {alternative.get('name')} nutriments: {alternative.get('nutriments')}. "
      f"User profile: {profile}. "
      f"Nutrient deltas: {delta}. Focus on sugar, salt, saturated fat, fiber, protein. Include score delta."
    )

    explanation = None
    try:
      explanation = generate_meal_plan_llm({"goal": "Explain"}, [])  # reuse LLM wrapper to access OpenAI client
    except Exception:
      explanation = None

    if explanation and "raw" in explanation:
      return Response({"explanation": explanation["raw"]})

    # deterministic fallback
    return Response(
      {
        "explanation": (
          "Alternative reduces sugar/salt vs base; saturated fat is lower; protein/fiber is higher; "
          "better fit for typical low-sugar/low-salt goals."
        )
      }
    )


class RegisterView(APIView):
  permission_classes = []

  def post(self, request):
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
      return Response({"error": "email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    username = email.split("@")[0]
    user, created = User.objects.get_or_create(username=username, defaults={"email": email})
    if not created:
      return Response({"error": "user exists"}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(password)
    user.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user_id": user.id})


class LoginView(APIView):
  permission_classes = []

  def post(self, request):
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
      return Response({"error": "email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    username = email.split("@")[0]
    user = User.objects.filter(username=username).first()
    if not user or not user.check_password(password):
      return Response({"error": "invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user_id": user.id})
