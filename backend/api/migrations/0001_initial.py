from django.db import migrations, models


class Migration(migrations.Migration):
  initial = True

  dependencies = []

  operations = [
    migrations.CreateModel(
      name="Product",
      fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("code", models.CharField(max_length=64, unique=True)),
        ("name", models.CharField(max_length=255)),
        ("brand", models.CharField(blank=True, max_length=255)),
        ("category", models.CharField(blank=True, max_length=255)),
        ("nutriments", models.JSONField(default=dict)),
        ("additives", models.JSONField(blank=True, default=list)),
        ("allergens", models.JSONField(blank=True, default=list)),
        ("ingredients", models.TextField(blank=True)),
        ("ecoscore", models.CharField(blank=True, max_length=8)),
        ("health_score", models.IntegerField(default=0)),
        ("created_at", models.DateTimeField(auto_now_add=True)),
        ("updated_at", models.DateTimeField(auto_now=True)),
      ],
    ),
    migrations.CreateModel(
      name="MealPlan",
      fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("user_id", models.CharField(max_length=128)),
        ("profile", models.JSONField(default=dict)),
        ("plan", models.JSONField(default=dict)),
        ("created_at", models.DateTimeField(auto_now_add=True)),
      ],
    ),
    migrations.CreateModel(
      name="Favorite",
      fields=[
        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
        ("user_id", models.CharField(max_length=128)),
        ("created_at", models.DateTimeField(auto_now_add=True)),
        ("product", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="favorites", to="api.product")),
      ],
      options={"unique_together": {("user_id", "product")}},
    ),
  ]
