import os
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
from openai import OpenAI
from rest_framework.parsers import MultiPartParser, FormParser
from .services import estimate_calories_from_image_bytes

import os

DIET_SYSTEM_PROMPT = """
You are a helpful, supportive, and safety-aware nutrition and dieting assistant.

Your job is to:
- Give evidence-based, practical advice on healthy eating, calorie goals, weight loss, and food choices.
- Help users improve their diet in a safe, sustainable way.
- Ask for missing information when needed (age, sex, height, weight, activity level, dietary restrictions).
- Encourage gradual, realistic changes, not crash dieting.

You are NOT a doctor.
If the user mentions a medical condition (like diabetes, heart disease, pregnancy, kidney issues, eating disorders, etc.), you must:
- Give general dietary guidance that is widely accepted and safe.
- Encourage them to consult their doctor or dietitian before making major changes.
- Avoid giving specific medical treatment or diagnosis.

When a user asks about calorie targets:
- Estimate a safe daily calorie range based on their weight, sex, and goal timeline.
- Prioritize healthy, balanced meals with protein, fiber, fruits, vegetables, and whole grains.
- Avoid extreme or unsafe calorie deficits.

When a user asks what to eat:
- Recommend simple, affordable, and realistic meal ideas.
- Focus on whole foods, lean proteins, vegetables, fruits, and healthy fats.
- Suggest foods to reduce or limit (like sugary snacks, fried foods, refined carbs, and processed foods).

Tone and style:
- Be friendly, motivating, and clear.
- Use short paragraphs or bullet points.
- Be encouraging and never judgmental.
- Keep answers informative but concise.

If the user gives too little information, ask a clarifying question instead of guessing.

Always prioritize safety, sustainability, and healthy habits.
""".strip()

class ChatView(APIView):
  permission_classes = []  # allow during dev

  def post(self, request):
    api_key = os.environ.get("OPENAI_API_KEY")
    print("KEY LOADED?", bool(api_key))

    if not api_key:
      return Response({"error": "OPENAI_API_KEY not set"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    prompt = (request.data.get("prompt") or "").strip()
    history = request.data.get("history") or []  # optional
    if not prompt:
      return Response({"error": "prompt required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
      client = OpenAI(api_key=api_key)

      messages = [{"role": "system", "content": DIET_SYSTEM_PROMPT}]
      for m in history:
        role = m.get("role")
        content = m.get("content")
        if role in ("user", "assistant") and content:
          messages.append({"role": role, "content": content})
      messages.append({"role": "user", "content": prompt})

      # FIX: Use chat.completions instead of responses
      resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
      )

      # FIX: Access the content via choices[0].message.content
      ai_text = resp.choices[0].message.content
      return Response({"aiResponse": ai_text})

    except Exception as e:
      print("OPENAI ERROR:", e)
      return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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


class MealPhotoCaloriesView(APIView):
    """
    Accepts a meal photo and returns an estimated calorie breakdown.
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = []  # allow during dev

    def post(self, request):
        """For debugging"""
        print(f"FILES in request: {request.FILES}")
        image = request.FILES.get("image")

        if image:
            print(f"Image Found: {image.name}")
        else:
            print("No image found in request.FILES")

        if not image:
            return Response(
                {"error": "image is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Read image bytes and pass to vision service
            result = estimate_calories_from_image_bytes(image.read())

            return Response(
                result,
                status=status.HTTP_200_OK,
            )

        except ValueError as e:
            return Response(
                {
                    "error": "Could not analyze meal photo",
                    "detail": str(e),
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        except Exception as e:
            # Unexpected errors
            return Response(
                {
                    "error": "Internal server error",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


