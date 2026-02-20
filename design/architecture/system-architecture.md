# System Architecture

This document describes the technical architecture of SnacKompare; the layers of the system, the technologies chosen for each layer, and the reasoning behind those choices. The architecture diagrams referenced here are maintained in the `Technical Specification/` folder.

---

## Overview

SnacKompare uses a **multi-layer architecture** with four principal components:

```
+---------------------------------------------+
|           React Native Mobile App            |  <- Frontend (iOS/Android)
|         (Expo, React Navigation)             |
+------------------+---------------------------+
                   | HTTP / REST API
+------------------v---------------------------+
|         Django REST Framework Backend        |  <- API Server
|              (Railway cloud)                 |
+----------+-------------------+--------------+
           |                   |
+----------v------+   +--------v------------+
|  OpenFoodFacts  |   |  OpenAI API          |  <- External Services
|  (Product Data) |   |  (GPT-4o-mini)       |
+-----------------+   +---------------------+

+---------------------------------------------+
|              Firebase (Google)               |  <- Auth & Cloud Storage
|   Authentication  |  Cloud Firestore         |
+---------------------------------------------+
```

The layers are deliberately separated so that the UI, API logic, and external services can be developed, tested, and deployed independently, a principle known as **separation of concerns** (Dijkstra, 1974).

---

## Layer 1 - React Native Mobile Frontend

**Location:** `mobile/`

### What it does
- Renders all user-facing screens (11 main screens + 3 onboarding + auth)
- Handles device-level features: camera (barcode scanning, meal photos), local storage
- Makes API calls to the [Django](https://www.django-rest-framework.org) backend for AI features
- Fetches product data directly from [OpenFoodFacts](https://world.openfoodfacts.org) for search and scan
- Manages authentication state via [Firebase Authentication](https://firebase.google.com/docs/auth)
- Persists user preferences, favourites, and calorie logs via AsyncStorage and Firestore

### Technology - [React Native](https://reactnative.dev) + [Expo](https://expo.dev)

| Factor | Reasoning |
|---|---|
| Cross-platform | Single codebase for both iOS and Android |
| Expo managed workflow | Pre-built native modules for camera, storage, secure keys; no Xcode/Android Studio configuration required for most features |
| React familiarity | Team had existing React skills from the web prototype phase |
| Large ecosystem | Thousands of compatible libraries; extensive documentation |
| Native rendering | Unlike web-based frameworks (Ionic, Cordova), React Native renders actual native UI components |

Nawrocki et al. (2021) found that React Native achieves near-native performance for data-intensive apps while significantly reducing development time versus writing separate iOS and Android codebases.

### Key Libraries

| Library | Purpose |
|---|---|
| [`react-navigation`](https://reactnavigation.org) | Tab and stack navigation |
| [`expo-barcode-scanner`](https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/) | Real-time barcode scanning |
| [`react-native-vision-camera`](https://mrousavy.com/react-native-vision-camera/) | Full camera control for meal photos |
| [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) | Local key-value persistence |
| [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/) | Encrypted token storage |
| [`firebase`](https://firebase.google.com/docs) | Authentication and Firestore sync |
| [`axios`](https://axios-http.com) | HTTP client for backend API calls |

---

## Layer 2 - [Django REST Framework](https://www.django-rest-framework.org) Backend

**Location:** `backend/`
**Deployed on:** [Railway](https://railway.app) (https://snackompare.up.railway.app)

### What it does
- Exposes RESTful API endpoints for AI-powered features (chat, meal plan, photo calorie estimation, product explanation)
- Manages server-side business logic: product search caching, health scoring, user profiles, favourites
- Stores structured data in a SQLite database (product cache, user profiles, favourites)
- Acts as a secure intermediary for [OpenAI](https://platform.openai.com) API calls (keeps the API key server-side)

### Technology - [Django REST Framework](https://www.django-rest-framework.org)

| Factor | Reasoning |
|---|---|
| Python ecosystem | Python has the richest AI/ML ecosystem; integrating OpenAI, image processing, and data manipulation is straightforward |
| Django ORM | Rapid model definition and database management without writing raw SQL |
| DRF serializers | Clean, validated input/output handling for all API endpoints |
| Throttling | DRF's built-in rate limiting protects AI endpoints from abuse |
| Railway deployment | Simple cloud deployment with automatic HTTPS, environment variables, and no server management |

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/ping/` | GET | Health check |
| `/api/search/` | GET | Product search (proxies OpenFoodFacts, applies filters) |
| `/api/barcode/<code>/` | GET | Barcode lookup |
| `/api/favourites/` | GET/POST/DELETE | Favourites management |
| `/api/profile/` | GET/PUT | User profile |
| `/api/auth/register/` | POST | User registration |
| `/api/auth/login/` | POST | User login |
| `/api/explain/` | POST | AI product comparison explanation |
| `/api/chat/` | POST | AI diet coach chatbot |
| `/api/meals/photo-calories/` | POST | AI meal photo calorie estimation |

### Why Not Serverless / Node.js?

Serverless functions ([AWS Lambda](https://aws.amazon.com/lambda/), [Vercel](https://vercel.com)) were considered but rejected: AI image processing requires persistent memory and longer execution times than serverless allows. Node.js was considered but the team's Python proficiency and the richness of Python's AI libraries made Django the clear choice.

---

## Layer 3 - [Firebase](https://firebase.google.com)

**Services used:** [Firebase Authentication](https://firebase.google.com/docs/auth), [Cloud Firestore](https://firebase.google.com/docs/firestore)

### Authentication

[Firebase Authentication](https://firebase.google.com/docs/auth) handles user identity; sign-up, login, token issuance, and session management. It was chosen over building a custom auth system because:
- Managed service; no password hashing, token rotation, or session management to implement
- Handles email/password, OAuth providers, and anonymous auth
- Generates secure JWTs automatically
- Industry-standard; used by millions of applications (Google, 2024)

### Cloud Firestore

[Firestore](https://firebase.google.com/docs/firestore) stores user-specific data that needs to sync across devices:
- User profiles (goal, diet preferences, allergens, health conditions)
- Favourites list (`users/{uid}/favourites` subcollection)
- AI chat history (up to 20 messages)
- Calorie logs

**Why Firestore over Django's SQLite for user data?**

| Consideration | Firebase Firestore | Django SQLite |
|---|---|---|
| Real-time sync | Yes; changes reflect instantly on all devices | No; requires polling |
| Authentication binding | Native; documents are naturally scoped to authenticated users via security rules | Requires custom auth middleware |
| Offline support | Built-in caching | Not available |
| Scalability | Managed, auto-scales | Would require migration to PostgreSQL at scale |

A dual-storage approach is used: data is saved locally in AsyncStorage for offline-first responsiveness, then synced to Firestore when online.

---

## Layer 4 - [OpenFoodFacts](https://world.openfoodfacts.org)

**API:** [https://world.openfoodfacts.org/api/](https://world.openfoodfacts.org/api/)

OpenFoodFacts is a free, open, community-maintained food database with over 3 million products globally.

### Why OpenFoodFacts

| Factor | Reasoning |
|---|---|
| Free with no API key | No cost, no rate-limit registration required |
| 3M+ products | Comprehensive global coverage |
| Rich nutritional data | Includes allergens, ingredients, Nutri-Score, additives, categories |
| Open licence | Data can be freely used and redistributed |
| Active community | Regular updates, increasing product coverage |

The frontend fetches OpenFoodFacts directly for search and barcode queries (faster response, no backend round-trip). The backend proxies these calls when server-side filtering (diet/allergen exclusion) or caching is needed.

---

## Architecture Diagrams

The following diagrams are maintained in `Technical Specification/`:

### Context Diagram
Shows SnacKompare's interactions with external entities (users, OpenFoodFacts API, AI provider).

![Context Diagram](../../Technical%20Specification/ContextDiagram.png)

### Data Flow Diagram
Shows data movements within the system; scanning, searching, comparing, generating meal plans, storing preferences.

![Data Flow Diagram](../../Technical%20Specification/DataFlowDiagram.png)

### Logical Data Structure
Shows the main data entities and relationships (user accounts, products, alternatives, meal plans).

![Logical Data Structure](../../Technical%20Specification/LogicalDataStructure.png)

---

## Key Architectural Decisions

### 1. Direct OpenFoodFacts Calls from Mobile (Not Always Via Backend)

Product search and barcode lookups call OpenFoodFacts directly from the mobile app rather than proxying through the Django backend. This was a deliberate performance decision: removing the backend round-trip reduces latency. The backend is only involved when server-side processing is needed (AI features, filtering, caching).

This is consistent with the **API Gateway pattern** (Richardson & Smith, 2016): use a backend for complex logic, bypass it for simple data retrieval.

### 2. Firebase for User Data, SQLite for Product Cache

User profile data lives in Firestore (real-time sync, user-scoped security rules). Product data is cached in Django's SQLite database (fast server-side cache, no auth required). This hybrid approach uses the right storage technology for each data type.

### 3. Deterministic AI Fallbacks

All three AI endpoints (`/api/chat/`, `/api/explain/`, `/api/meals/photo-calories/`) include deterministic fallback responses that activate when the [OpenAI](https://platform.openai.com) API key is absent. This ensures the app remains usable without an API key, which is important for open-source deployments and testing.

---

## References

- Dijkstra, E.W. (1974) 'On the Role of Scientific Thought', in *Selected Writings on Computing: A Personal Perspective*. New York: Springer.
- Google (2024) [*Firebase Documentation*](https://firebase.google.com/docs) (Accessed: 20 February 2026).
- Nawrocki, P., Wrona, K., Marczak, M. and Sniezynski, B. (2021) 'A Comparison of Native and Cross-Platform Frameworks for Mobile Applications', *Computer*, 54(3), pp. 18-27.
- Richardson, C. and Smith, F. (2016) *Microservices: From Design to Deployment*. O'Reilly Media.
- Christie, T. (2026) [*Django REST Framework*](https://www.django-rest-framework.org) (Accessed: 12 January 2026).
- OpenFoodFacts (2026) [*Open Food Facts Documentation*](https://wiki.openfoodfacts.org/Documentation) (Accessed: 12 January 2026).
