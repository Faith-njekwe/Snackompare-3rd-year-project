# Screen Designs

This document describes every screen in SnacKompare; its purpose, key design decisions, layout structure, and the rationale behind those decisions. Screenshots are included for each screen to illustrate the final implementation.

The app contains 14 screens in total: 3 onboarding screens, 1 authentication screen, and 10 main application screens.

---

## Authentication

### Sign In / Sign Up

**Purpose:** Allow users to create an account or log in to an existing one.

**Design decisions:**
- Single screen handles both login and registration via a toggle, reducing navigation friction for new users
- Form uses large input fields (44px height) with clear labels
- The green "Sign Up / Login" button is the only prominent colour on the screen, drawing the eye to the primary action
- Error messages appear inline below the relevant field ([Nielsen, 1994](https://www.nngroup.com/articles/ten-usability-heuristics/) - heuristic: help users recognise, diagnose and recover from errors)

<img src="../../User_manual/images/creatinganaccount.JPG" alt="Creating an Account" width="300"/>

---

## Onboarding

The onboarding flow collects the user's profile information before they reach the main app. It runs once after sign-up and is skipped on subsequent logins. The three-screen flow breaks a potentially long form into digestible steps, reducing cognitive load (Miller, 1956).

### Onboarding Screen 1 - Goal & Gender

**Purpose:** Capture the user's primary health goal and gender.

**Design decisions:**
- Chip-based selectors for goal (Lose Weight / Maintain / Gain Muscle) and gender; visible options reduce decision time (Hick, 1952)
- Weight change input only appears if "Lose" or "Gain" is selected; progressive disclosure reduces the form's perceived complexity (Lidwell, Holden & Butler, 2010)
- Progress indication (step 1 of 3) gives users a sense of completion

<img src="../../User_manual/images/onboarding1.JPG" alt="Onboarding Step 1" width="300"/>

### Onboarding Screen 2 - Stats & Activity

**Purpose:** Capture age, height, weight, and activity level.

**Design decisions:**
- Numeric inputs for body metrics with placeholder hints (e.g. "e.g. 25")
- Activity level uses a horizontal chip row; all options visible at once
- Data feeds directly into the AI chatbot's personalised responses

<img src="../../User_manual/images/onboarding2.JPG" alt="Onboarding Step 2" width="300"/>

### Onboarding Screen 3 - Diet & Allergens

**Purpose:** Capture dietary preferences and allergens.

**Design decisions:**
- Multi-select chips for diet preferences (Vegetarian, Vegan, Gluten-Free, etc.) and allergens
- Chip selection uses `accentSoft` green background to clearly indicate selected state
- This screen directly powers the vegan/vegetarian product filter in search and the AI chatbot's advice

<img src="../../User_manual/images/onboarding3.JPG" alt="Onboarding Step 3" width="300"/>

---

## Main App Screens

### Home Screen

**Purpose:** The app's central hub, the first screen users see after login. Provides quick access to the three core features.

**Key design decisions:**

| Decision | Reasoning |
|---|---|
| Three large gradient cards | Makes the primary actions immediately visible and tappable without scrolling |
| Blue (Scan), Green (Search), Red (Favourites) | Each feature has a distinct colour identity to build visual memory |
| Spring press animation (scale to 0.97) | Provides tactile feedback without navigating away, confirming the tap registered |
| Stats bar ("2M+ Products", "100% Accurate", "Instant Results") | Builds trust and communicates the app's value proposition at a glance |
| Profile icon top-right | Consistent with iOS convention ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines), 2024); users expect settings/profile in the top corner |

<img src="../../User_manual/images/homepage.jpg" alt="Home Screen" width="300"/>

---

### Search Screen

**Purpose:** Allow users to search for any food product by name or brand and view detailed nutritional information.

**Key design decisions:**

| Decision | Reasoning |
|---|---|
| Search bar at top | Standard iOS/Android pattern; thumb-accessible on most phones |
| 10 results per page with "Load More" | Avoids overwhelming users; improves API response time |
| Product cards with image, name, brand, score badge | Scannable at a glance; image aids recognition (Norman, 2013) |
| Floating comparison bar slides in when 2 products selected | Contextual UI, appearing only when relevant, avoiding clutter |
| Animated comparison bar | Draws attention to the new action without interrupting the user's browsing |

<img src="../../User_manual/images/search.JPG" alt="Search Screen" width="300"/>

### Healthier Alternatives

When a user opens any product detail, healthier alternatives are shown at the bottom of the modal. This is a core differentiator of SnacKompare.

**Design decisions:**
- Alternatives sorted by health score (highest first)
- Each alternative shows score improvement delta (e.g. "+15 score") to make the benefit immediately clear
- Tapping an alternative opens a nested modal, maintaining context without navigating away

<img src="../../User_manual/images/healthyalternatives.jpg" alt="Healthier Alternatives" width="300"/>

---

### Barcode Scan Screen

**Purpose:** Allow users to scan a physical product barcode using the device camera to instantly retrieve nutritional information.

**Key design decisions:**

| Decision | Reasoning |
|---|---|
| Full-screen camera view | Maximises the scanning area; reduces errors from poor framing |
| Animated scanning frame with pulsing corners | Guides the user where to position the barcode; the animation signals the app is active and listening |
| Animated horizontal sweep line | Reinforces the "scanning" metaphor; familiar from real-world barcode scanners |
| Debounced scan processing (500ms) | Prevents duplicate events from triggering multiple API calls on one barcode |
| Error states for "not found" and "server error" | Graceful error handling with clear messages ([Nielsen, 1994](https://www.nngroup.com/articles/ten-usability-heuristics/) - heuristic: help users recover from errors) |

<img src="../../User_manual/images/barcodescanner.JPG" alt="Barcode Scanner" width="300"/>

---

### Compare Products Screen

**Purpose:** Show a detailed side-by-side nutritional comparison of two selected products, with an AI-generated recommendation.

**Key design decisions:**

| Decision | Reasoning |
|---|---|
| Two product headers side by side | Parallel layout makes comparison immediate; no need to scroll between pages |
| Gold "Winner" badge on the healthier product | Instantly communicates the recommendation without requiring the user to read the table |
| Colour-coded rows (green = better, red = worse) | Traffic light system; same convention as EU nutritional labels (Food Standards Agency, 2013) |
| Win count for each product | Summarises the comparison quantitatively ("5 nutrients better") |
| AI explanation below the table | Provides context and reasoning for users who want to understand *why* one product is healthier |
| Staggered row animations on load | Rows appear in sequence rather than all at once, focusing attention and feeling more intentional |

<img src="../../User_manual/images/compareproducts.JPG" alt="Compare Products" width="300"/>

---

### Favourites Screen

**Purpose:** Display the user's saved products for quick reference on repeat shopping trips.

**Key design decisions:**
- Cards match the style of search results; visual consistency means users immediately recognise product cards
- Delete button on each card for single-tap removal
- Synced to [Firestore](https://firebase.google.com/docs/firestore); favourites persist across devices and app reinstalls
- Empty state message encourages first use

---

### Calorie Counter Screen

**Purpose:** Allow users to log and track their daily calorie intake.

**Key design decisions:**

| Decision | Reasoning |
|---|---|
| Circular progress ring | Circular progress indicators are a well-established pattern for quota/goal tracking (used in Apple Health, Fitbit, etc.) |
| Daily goal input | Personalises the tracker to the individual's calorie target |
| Per-item list with manual delete | Gives users full control over their log |
| Multiple add methods (search, meal tracker, manual) | Accommodates different user workflows; some scan, some search, some know the calories |

<img src="../../User_manual/images/caloriecounter.JPG" alt="Calorie Counter" width="300"/>

---

### Meal Tracker (Photo AI)

**Purpose:** Allow users to photograph a meal and receive an AI-powered calorie breakdown per food item.

**Key design decisions:**
- Camera permission handled gracefully with an explanation before the OS prompt
- Users can adjust gram weights after AI detection, acknowledging that AI estimates are approximations
- Items flow directly into the calorie counter for a seamless pipeline from photo to log

---

### Diet Coach Screen

**Purpose:** Provide an AI-powered conversational nutrition assistant that gives personalised dietary advice.

**Key design decisions:**

| Decision | Reasoning |
|---|---|
| Chat bubble UI | Familiar messaging pattern; no learning curve |
| User messages right-aligned, AI messages left-aligned | Universal chat convention; immediately distinguishes the two parties |
| Profile context injected into every AI request | Responses are personalised to the user's age, goal, diet, allergens, and health conditions |
| Markdown rendering in AI responses | Allows structured responses (lists, bold text) for more readable meal plans |
| Chat history persisted to [Firestore](https://firebase.google.com/docs/firestore) | Users can refer back to previous advice across sessions |

<img src="../../User_manual/images/dietcoach.JPG" alt="Diet Coach" width="300"/>

---

### Profile and Settings Screen

**Purpose:** Allow users to view and update their personal profile, which drives AI personalisation across the entire app.

**Key design decisions:**
- Same chip-based UI as onboarding; consistency means users immediately know how to interact
- Changes save immediately on pressing "Save" with a success toast
- "Delete Account" is placed below a visual separator and styled in red; it is destructive and should require deliberate action (Norman, 2013 - affordances for destructive actions)

<img src="../../User_manual/images/profileandsettings.JPG" alt="Profile and Settings" width="300"/>

---

## References

- Apple (2024) [*Human Interface Guidelines*](https://developer.apple.com/design/human-interface-guidelines) (Accessed: 20 February 2026).
- Food Standards Agency (2013) *Guide to Creating a Front of Pack Nutrition Label*. London: FSA.
- Hick, W.E. (1952) 'On the Rate of Gain of Information', *Quarterly Journal of Experimental Psychology*, 4(1), pp. 11-26.
- Lidwell, W., Holden, K. and Butler, J. (2010) *Universal Principles of Design*. 2nd edn. Beverly: Rockport Publishers.
- Miller, G.A. (1956) 'The Magical Number Seven, Plus or Minus Two', *Psychological Review*, 63(2), pp. 81-97.
- Nielsen, J. (1994) [*10 Usability Heuristics for User Interface Design*](https://www.nngroup.com/articles/ten-usability-heuristics/). Nielsen Norman Group.
- Norman, D.A. (2013) *The Design of Everyday Things*. Revised edn. New York: Basic Books.
