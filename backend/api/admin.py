from django.contrib import admin
from .models import Product, Favorite, MealPlan

admin.site.register(Product)
admin.site.register(Favorite)
admin.site.register(MealPlan)
