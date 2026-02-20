# Navigation and User Flows

This document describes SnacKompare's navigation architecture and the key user journeys through the app. Navigation structure is a fundamental aspect of UX design, determining how quickly and intuitively users can find features (Morville & Rosenfeld, 2006).

---

## Navigation Architecture

SnacKompare uses [React Navigation](https://reactnavigation.org) with a combination of **Stack Navigators** and a **Bottom Tab Navigator**.

### Why Tabs + Stacks?

| Pattern | Reasoning |
|---|---|
| Bottom Tab Navigator | Provides persistent access to the 4 main areas of the app; tabs are always visible, so users never feel lost ([Nielsen, 1994](https://www.nngroup.com/articles/ten-usability-heuristics/) - visibility of system status) |
| Stack Navigators inside tabs | Allows deeper navigation within each tab (e.g. Home to Search to Compare) while maintaining the tab bar |
| Modal presentation for product detail | Product information is shown in a bottom-sheet modal rather than a new screen; preserves context and allows quick dismissal |

Bottom tabs are the standard iOS navigation pattern ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines), 2024) and are preferred over hamburger menus for apps with 3-5 top-level destinations, as they keep all destinations visible (Babich, 2016).

---

## Full Navigation Tree

```
App Root
|
+-- AuthScreen (if not logged in)
|
+-- Onboarding Flow (if logged in but not onboarded)
|   +-- GoalScreen           <- Goal, gender, weight change
|   +-- StatsActivityScreen  <- Age, height, weight, activity level
|   +-- DietScreen           <- Diet preferences, allergens
|
+-- Main Tab Navigator (once onboarded)
    |
    +-- Tab 1: Home (Stack Navigator)
    |   +-- HomeScreen              <- Hub with Scan / Search / Favourites cards
    |   +-- SearchProductsScreen    <- Search with ProductDetailModal (bottom sheet)
    |   +-- ScanScreen              <- Camera barcode scanner with ProductDetailModal
    |   +-- FavouritesScreen        <- Saved products list
    |   +-- CompareProductsScreen   <- Side-by-side nutrition comparison
    |   +-- SettingsScreen          <- Profile edit
    |
    +-- Tab 2: Calorie Counter
    |   +-- CalorieCountScreen      <- Daily intake log + circular progress
    |
    +-- Tab 3: Meal Tracker (Stack Navigator)
    |   +-- TakePhotoScreen         <- Entry point, camera permission
    |   +-- MealPhotoCameraScreen   <- Live camera + AI calorie estimation
    |
    +-- Tab 4: Diet Coach
        +-- AIChatbotScreen         <- Conversational AI nutrition assistant
```

---

## Key User Flows

### Flow 1 - New User Onboarding

A first-time user is taken through a three-screen onboarding flow before reaching the app.

```
Sign Up -> GoalScreen -> StatsActivityScreen -> DietScreen -> HomeScreen
```

| Step | Screen | Data Collected |
|---|---|---|
| 1 | GoalScreen | Health goal (lose/maintain/gain), gender, weekly weight change target |
| 2 | StatsActivityScreen | Age, height, weight, activity level |
| 3 | DietScreen | Diet preferences (vegan, vegetarian, etc.), allergens |
| 4 | HomeScreen | Onboarding complete; `onboardingComplete` flag saved to [Firestore](https://firebase.google.com/docs/firestore) |

**Design reasoning:** Breaking the profile setup into three logical steps (goal to body to diet) reduces cognitive load. Each screen has a clear theme, making the task feel smaller. This mirrors the progressive disclosure principle (Lidwell, Holden & Butler, 2010): only ask for information relevant to the current step.

On subsequent logins, the `onboardingComplete` flag is checked and the flow is skipped entirely.

---

### Flow 2 - Scanning a Product

The most common journey in a real-world context; a user in a shop scanning a product on a shelf.

```
HomeScreen -> ScanScreen -> [Camera active] -> Product found -> ProductDetailModal
                                            -> Add to Favourites
                                            -> Add to Calorie Tracker
                                            -> View Healthier Alternatives
```

| Step | Action | Design Detail |
|---|---|---|
| 1 | Tap "Scan Product" on HomeScreen | Spring animation on press |
| 2 | Camera opens with scanning frame | Animated corners and sweep line reinforce scanning metaphor |
| 3 | Barcode detected | Debounced (500ms); prevents duplicate calls |
| 4 | Product data fetched | Loading indicator shown |
| 5 | ProductDetailModal slides up | Full nutrition info, health score, allergens |
| 6 | Optionally save or add to tracker | Both actions available in the modal |

**Error states:**
- Product not found in [OpenFoodFacts](https://world.openfoodfacts.org); friendly message with option to search manually
- Network error; error message with retry option

---

### Flow 3 - Search and Compare

A user who wants to compare two products before buying.

```
HomeScreen -> SearchProductsScreen -> Search query -> Results list
                                   -> Select product -> ProductDetailModal
                                   -> Tap "Compare" -> Select second product
                                   -> CompareProductsScreen -> AI explanation
```

| Step | Action | Design Detail |
|---|---|---|
| 1 | Tap "Search Products" | Navigates to search screen |
| 2 | Type query | Results appear; 10 per page with "Load More" |
| 3 | Tap product | ProductDetailModal opens |
| 4 | Tap "Add to Compare" | Floating comparison bar slides in at bottom |
| 5 | Select second product | Comparison bar shows both products |
| 6 | Tap "Compare Now" | Navigates to CompareProductsScreen |
| 7 | View comparison | Colour-coded table, winner badge, AI explanation |

**Design reasoning:** The comparison bar appears contextually, only when a product has been selected for comparison. This avoids cluttering the search screen for users who are not comparing. The bar slides in with an animation that draws attention without interrupting the browsing flow.

---

### Flow 4 - Logging a Meal via Photo

A user who wants to estimate the calories in a meal they've just cooked or ordered.

```
Tab: Meal Tracker -> TakePhotoScreen -> Camera -> Take photo
                 -> AI analysis -> Per-item breakdown
                 -> Adjust portions -> Add to Calorie Counter
```

| Step | Action | Design Detail |
|---|---|---|
| 1 | Open Meal Tracker tab | Camera permission requested if not granted |
| 2 | Take photo of meal | Full-screen camera with capture button |
| 3 | AI analyses the image | Loading state while [GPT-4o-mini](https://platform.openai.com) processes |
| 4 | Items listed with estimated grams | Each item editable |
| 5 | Confirm and add to Calorie Counter | Seamless pipeline; items appear in the daily log |

---

### Flow 5 - Using the Diet Coach

A user seeking personalised nutrition advice.

```
Tab: Diet Coach -> AIChatbotScreen -> Type message -> AI response (personalised)
                                  -> Follow-up questions -> Ongoing conversation
```

The chatbot has full access to the user's stored profile (goal, age, weight, diet, allergens, health conditions) which is injected into every request as a system prompt. This means responses are immediately personalised without the user needing to re-explain their situation.

Chat history (up to 20 messages) is persisted to [Firestore](https://firebase.google.com/docs/firestore), so conversations continue across sessions.

---

### Flow 6 - Updating Profile

A user who wants to change their dietary preferences after initial onboarding.

```
HomeScreen -> Profile icon (top right) -> SettingsScreen -> Edit fields -> Save
```

Profile updates immediately affect AI responses and product filters across the entire app; the profile context is fetched fresh on each AI request.

---

## Navigation Design Decisions

### Why Modals for Product Detail (Not New Screens)?

Product detail (nutritional info, allergens, alternatives) is shown in a bottom-sheet modal rather than navigating to a new screen. This decision was deliberate:

1. **Context preservation**: The user's position in the search results list is maintained. They can dismiss the modal and immediately continue browsing without losing their scroll position.
2. **Speed**: Modals appear instantly via animation; no full screen transition
3. **iOS convention**: Bottom-sheet presentation is the iOS-native pattern for contextual detail ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines), 2024)
4. **Reduced navigation depth**: Keeps the stack shallow; users never feel buried in nested screens

### Why Bottom Tabs (Not Drawer)?

A bottom tab bar was chosen over a hamburger drawer for three reasons:
1. All 4 top-level destinations are permanently visible; users never have to open a menu to remember what features exist ([Nielsen, 1994](https://www.nngroup.com/articles/ten-usability-heuristics/))
2. Thumb-accessible on all phone sizes; bottom of the screen is easiest to reach with one hand
3. Research by Babich (2016) found that tab bars significantly outperform hamburger menus for task completion speed and user satisfaction in mobile apps

---

## References

- Apple (2024) [*Human Interface Guidelines*](https://developer.apple.com/design/human-interface-guidelines) (Accessed: 20 February 2026).
- Babich, N. (2016) [*Hamburger Menu Alternatives for Mobile Navigation*](https://www.smashingmagazine.com/2017/05/hamburger-menu-alternative-for-mobile-navigation/). Smashing Magazine.
- Lidwell, W., Holden, K. and Butler, J. (2010) *Universal Principles of Design*. 2nd edn. Beverly: Rockport Publishers.
- Morville, P. and Rosenfeld, L. (2006) *Information Architecture for the World Wide Web*. 3rd edn. Sebastopol: O'Reilly Media.
- Nielsen, J. (1994) [*10 Usability Heuristics for User Interface Design*](https://www.nngroup.com/articles/ten-usability-heuristics/). Nielsen Norman Group.
