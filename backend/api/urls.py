from django.urls import path
from .views import (
  BarcodeView,
  ExplainView,
  FavoriteView,
  LoginView,
  MealPlanView,
  PingView,
  ProfileView,
  RegisterView,
  SearchView,
  ChatView,
  MealPhotoCaloriesView
)

urlpatterns = [
  path("ping/", PingView.as_view(), name="ping"),
  path("search/", SearchView.as_view(), name="search"),
  path("barcode/<str:code>/", BarcodeView.as_view(), name="barcode"),
  path("favourites/", FavoriteView.as_view(), name="favourites"),
  path("meal-plan/", MealPlanView.as_view(), name="meal-plan"),
  path("explain/", ExplainView.as_view(), name="explain"),
  path("profile/", ProfileView.as_view(), name="profile"),
  path("auth/register/", RegisterView.as_view(), name="register"),
  path("auth/login/", LoginView.as_view(), name="login"),
  path("chat/", ChatView.as_view()),
  path("meals/photo-calories/", MealPhotoCaloriesView.as_view()),
]
