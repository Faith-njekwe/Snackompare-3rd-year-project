# SnacKompare Mobile (Expo)

This folder contains a React Native / Expo version of the SnacKompare app that matches the features in the SRS (barcode scanning, search, comparison, alternatives, AI-style meal plans, and user profile). It now calls the Django backend for OpenFoodFacts search/barcode and LLM meal plans, with mocked fallbacks so you can still demo offline.

## Quick start

```bash
cd mobile
npm install   # installs expo, react-native, expo-barcode-scanner
EXPO_PUBLIC_API_BASE=http://localhost:8000/api npx expo start
```

This runs in Expo Go (managed workflow).

## What’s implemented

- **Navigation** via React Navigation native stack (Home, Scan, Search, Compare, Meals, Profile).
- **Barcode scanning flow** using `expo-barcode-scanner` (works in Expo Go), with “simulate scan” fallback.
- **Manual search** hitting the Django backend `/api/search/` with pagination, diet/allergen filters, recent-search chips, and a mock fallback when offline.
- **Comparison view** showing two products and nutrient differences.
- **Health scoring + alternatives**: category-aware thresholds and diet flags to rank healthier options.
- **AI meal planner call** to backend `/api/meal-plan/` (uses OpenAI if key present, otherwise deterministic fallback).
- **AI explain endpoint** `/api/explain/` hook (UI ready via Assistant screen; set OpenAI key to enable).
- **Profile + favourites persistence** using AsyncStorage, with backend POST/DELETE for favourites.
- **Loading/error states** with retries and offline-friendly messages.
- **Recent scans + bottom-sheet picker** for comparisons; skeleton loaders for search.
- **Auth-lite** register/login storing a token for API calls (backend DRF token).

## Next steps to go production

- Wire auth and JWTs, then persist favourites/profile on the server.
- Add form validation, loading states, and offline caching of saved items.
- Handle paginated search and richer nutrition display (additives, allergens).
- Expand LLM prompt with saved comparisons and dietary constraints.
