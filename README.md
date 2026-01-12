# SnacKompare

Mobile-first food comparison and meal-planning app built to match the SRS. A React Native/Expo implementation lives in `mobile/` with mocked data so you can demo offline; a legacy web prototype remains in `frontend/`.

## Project structure
- `mobile/` – Expo/React Native app with scan, search, comparison, alternatives, meal plan, and profile flows (calls backend with mocked fallbacks).
- `frontend/` – Vite + React web prototype (kept for reference).
- `backend/` – Django + DRF API for OpenFoodFacts search/barcode, favourites, explain, auth-lite, and meal-plan generation (OpenAI-capable).
- `foodcomparison.py` – CLI helper for OpenFoodFacts lookups/comparisons.
- `snackompare-srs/` – Functional specification and diagrams.

## Run the mobile app (Expo)
```bash
cd mobile
npm install
 EXPO_PUBLIC_API_BASE=http://localhost:8000/api npx expo start
```
Use Expo Go on a device or an emulator. Barcode scanning uses `expo-barcode-scanner`; a “simulate scan” button works offline.

## Run the backend (Django + DRF)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # set DB + OpenAI key
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
Backend endpoints: `/api/ping/`, `/api/search/?query=&page=&page_size=&diet=&exclude_allergens=`, `/api/barcode/<code>/`, `/api/favourites/` (GET/POST/DELETE), `/api/meal-plan/` (POST), `/api/explain/`, `/api/auth/register/`, `/api/auth/login/`. Throttling + caching on search/barcode.

## Features covered
- Barcode scan flow (or simulated scan) and cleaned nutrition display.
- Manual search by name/brand/category.
- Two-item nutrition comparison with health scoring, nutrient deltas, AI “why healthier” explanations, and ranked alternatives.
- Dietary filters (vegan/vegetarian, low sugar/salt, gluten-free), recent searches, recent scans, bottom-sheet picker.
- Favourites and user profile inputs feeding a weekly meal-plan generator (mocked AI fallback).
- Auth-lite (register/login token) stored client-side for API calls.

## Next implementation steps
1) Add authentication/JWT, hook favourites/profile to server-side storage, and add tests.
2) Harden error handling and add pagination/loading states in the mobile app.
3) Deploy Postgres + Django, point Expo app to the hosted API, and enable LLM explanations for alternatives.
