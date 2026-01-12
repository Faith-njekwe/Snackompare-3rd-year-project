# SnacKompare Backend (Django + DRF)

REST API that fronts OpenFoodFacts for product search/barcode lookups, caches cleaned products, stores favourites, and generates meal plans (OpenAI-capable with a deterministic fallback).

## Quick start
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # set DB + OpenAI credentials
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Endpoints
- `GET /api/ping/` – health check.
- `GET /api/search/?query=` – proxy to OpenFoodFacts search, cleans and caches products. Pagination: `page`, `page_size`. Dietary filters: `diet=vegan|vegetarian`, `exclude_allergens=...`.
- `GET /api/barcode/<code>/` – lookup by barcode, caches cleaned product.
- `GET/POST/DELETE /api/favourites/` – manage favourites (by `user_id` + product code).
- `POST /api/meal-plan/` – generates a weekly meal plan using OpenAI if `OPENAI_API_KEY` is set; otherwise returns a deterministic fallback.
- `POST /api/explain/` – LLM-backed “why is this alternative healthier?” with deterministic fallback and deltas.
- `POST /api/auth/register/`, `POST /api/auth/login/` – token-based auth (DRF token).

## Configuration
- `.env` controls DB connection (defaults to SQLite) and OpenAI settings; throttling via DRF envs.
- Switch to PostgreSQL by setting `DB_ENGINE=django.db.backends.postgresql` and providing `DB_*` values.
- Health scores are computed server-side; cached products reuse the latest score.

## Next steps
- Harden auth (JWT) and link favourites/profile to users.
- Add more pagination/error handling and retry around OpenFoodFacts.
- Add tests for services and views; wire CI to run `python manage.py test`.
- Add data quality surfacing (additives/allergens/eco-score) to clients.
