# Design Evolution

This document traces the full design journey of SnacKompare, from a terminal-based prototype to a polished React Native mobile application. Each stage is documented with its purpose, what was learned, and how it informed the next iteration. This iterative approach is grounded in established software design methodology: prototyping early and often allows teams to validate concepts before investing in full implementation (Preece, Rogers & Sharp, 2015).

---

## Stage 1 - CLI Prototype (`foodcomparison.py`)

### Overview

The very first version of SnacKompare was a command-line Python script (`foodcomparison.py`) that allowed users to search for or scan two food products and compare their nutritional values side by side in the terminal.

### What It Did

- Connected directly to the [OpenFoodFacts API](https://world.openfoodfacts.org/api/) to fetch real product data
- Supported two input methods: text search and barcode lookup
- Displayed up to 5 search results, letting the user pick one
- Extracted 8 nutritional values per product (energy, fat, saturated fat, carbohydrates, sugars, protein, fibre, salt)
- Printed a formatted comparison table showing the difference between the two products

**Example terminal output:**
```
=== OPEN FOOD FACTS PRODUCT COMPARATOR ===
Compare nutritional information of two food products

=== PRODUCT 1 ===
Choose input method:
1. Search by product name
2. Enter barcode
3. Go back

================================================================================
NUTRITION COMPARISON
================================================================================
Nutrient (per 100g/ml)    Coca Cola                           Pepsi                               Difference
----------------------------------------------------------------------------------------------------------
Energy (kcal)             42.0                                41.0                                -1.0
Fat (g)                   0.0                                 0.0                                 +0.0
Sugars (g)                10.6                                10.9                                +0.3
...
```

### Design Decisions Made at This Stage

| Decision | Reasoning |
|---|---|
| [OpenFoodFacts](https://world.openfoodfacts.org) as the data source | Free, open, no API key required, 3M+ products globally |
| Comparison as the core feature | Differentiated the tool from a simple nutrition lookup; the value is in the *difference* |
| Per 100g/ml values | Industry-standard nutritional comparison unit (EU food labelling regulations) |
| Simple CLI interface | Fastest way to validate the concept end-to-end with real data |

### What Was Learned

The prototype confirmed that:
1. The OpenFoodFacts API was reliable and rich enough to build on
2. Side-by-side nutrition comparison was genuinely useful
3. A CLI was too limited; no visual hierarchy, no colour coding, no ability to scan a physical barcode

### Limitations That Prompted the Next Stage

- No visual design; all output was plain text
- No health scoring; users had to interpret raw numbers themselves
- No mobile access; impossible to use in a supermarket aisle
- No barcode scanning; had to manually type the barcode number
- No user accounts or saved history
- No way to present the data in an accessible, beginner-friendly way

---

## Stage 2 - Web Prototype (React + Vite)

### Overview

The second iteration was a web application built with [React](https://react.dev) 19 and [Vite](https://vite.dev), exploring how the CLI concepts could be translated into a visual interface. This stage was never deployed and was later removed from the repository as the team committed fully to mobile.

### What It Introduced

- A tabbed navigation structure (Home, Scan, Search, Compare, Meals, Profile)
- Visual product cards with product name, brand, and health score
- A comparison screen showing colour-coded nutrition differences
- A mock health scoring system
- User profile and meal plan concepts
- A favourites management system

### Why It Was Abandoned

| Issue | Impact |
|---|---|
| Hardcoded mock data | Could not use real OpenFoodFacts data reliably |
| No real barcode scanning | Browser camera APIs are limited and unreliable for barcode detection |
| Web is not mobile-native | Users want to scan products in shops; a web app in a mobile browser is a poor experience |
| Native feel missing | [React Native](https://reactnative.dev) could provide platform-native animations, gestures, and components |

The web prototype served as a **layout and information architecture experiment**, confirming which screens were needed and how navigation should flow, before being superseded entirely by the React Native implementation.

This is consistent with [Nielsen's (1994)](https://www.nngroup.com/articles/ten-usability-heuristics/) recommendation to test with low-fidelity prototypes early, then discard them once higher-fidelity implementations are underway.

---

## Stage 3 - React Native Mobile App (Current)

### Overview

The final and current version is a full [React Native](https://reactnative.dev) application built with [Expo](https://expo.dev), targeting iOS (with Android compatibility). It addresses every limitation of the previous two stages: real barcode scanning, real API data, user accounts, health scoring, AI features, and a polished visual design.

### Why React Native

| Factor | Decision |
|---|---|
| Cross-platform | One codebase targets both iOS and Android |
| Native camera access | `expo-barcode-scanner` and `react-native-vision-camera` provide real-time barcode scanning |
| Native feel | React Native renders actual native UI components, not web elements |
| Expo ecosystem | Rapid development with pre-built native modules (camera, storage, secure store) |
| Large community | Extensive documentation, libraries, and support |
| JavaScript/React familiarity | Team had existing React skills from the web prototype |

This choice aligns with research by Nawrocki et al. (2021), who found that React Native achieves near-native performance for data-intensive mobile apps while significantly reducing development time compared to writing separate iOS and Android codebases.

### Key Design Improvements Over Prior Stages

| Feature | CLI | Web Prototype | Mobile App |
|---|---|---|---|
| Real product data | Yes | No (mocked) | Yes |
| Barcode scanning | No (manual entry) | No | Yes (camera) |
| Health scoring | No | Yes (mock) | Yes (Nutri-Score algorithm) |
| Visual design | No | Yes | Yes (polished) |
| User accounts | No | No | Yes ([Firebase](https://firebase.google.com) Auth) |
| AI features | No | No | Yes (GPT-4o-mini) |
| Animations | No | No | Yes (spring, stagger, pulse) |
| Saved favourites | No | Yes (mock) | Yes (Firestore + AsyncStorage) |
| Calorie tracking | No | No | Yes |
| Diet coach | No | No | Yes |

### Figma Design

Before implementing the mobile screens, wireframes and high-fidelity mockups were created in [Figma](https://www.figma.com). The Figma design established:
- The colour palette and typography system
- Screen layouts for all 11 main screens
- Component specifications (modals, cards, badges, input fields)
- The navigation flow between screens
- Onboarding user journey

<img src="../../figma.png" alt="Figma Wireframes" width="600"/>

The Figma wireframes above show the early-stage mockups for the Sign In/Up screen, Onboarding flow, Home screen, and Calorie Counter. These were used as a direct reference during React Native implementation, ensuring visual consistency across all screens.

---

## Design Principles Applied Throughout

The final design was guided by established HCI and UX principles:

### 1. Nielsen's 10 Usability Heuristics ([Nielsen, 1994](https://www.nngroup.com/articles/ten-usability-heuristics/))
- **Visibility of system status**: Loading spinners, scan animations, and progress indicators keep users informed
- **Match between system and real world**: Nutrition terms match EU food label conventions
- **User control and freedom**: Users can dismiss modals, cancel scans, and undo actions
- **Consistency and standards**: All screens use the same colour palette, typography, and component patterns
- **Error prevention**: Barcode debouncing prevents duplicate scan events; form validation prevents empty submissions
- **Recognition over recall**: Bottom navigation tabs are always visible; product images aid recognition

### 2. Mobile-First Design
The entire application was designed for mobile from the outset, following the principle that constraints drive good design (Wroblewski, 2011). Every interaction was designed for thumb reach, one-handed use, and short sessions in a supermarket environment.

### 3. Iterative Prototyping
The three-stage evolution (CLI to Web to Mobile) reflects the double diamond design process (Design Council, 2005): diverge to explore possibilities, then converge on the best solution through successive refinement.

---

## References

- Design Council (2005) *The Double Diamond Design Process*. London: Design Council.
- Nielsen, J. (1994) [*10 Usability Heuristics for User Interface Design*](https://www.nngroup.com/articles/ten-usability-heuristics/). Nielsen Norman Group.
- Nawrocki, P., Wrona, K., Marczak, M. and Sniezynski, B. (2021) 'A Comparison of Native and Cross-Platform Frameworks for Mobile Applications', *Computer*, 54(3), pp. 18-27.
- Preece, J., Rogers, Y. and Sharp, H. (2015) *Interaction Design: Beyond Human-Computer Interaction*. 4th edn. Chichester: Wiley.
- Wroblewski, L. (2011) [*Mobile First*](https://abookapart.com/products/mobile-first). New York: A Book Apart.
