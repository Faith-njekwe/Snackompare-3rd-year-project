# Software Requirements Specification
for
# Snackompare

Prepared by Faith Njekwe and Daniel Obazuaye  
21/10/2025

## Table of Contents

| Section | Title | Page |
|---------|-------|------|
| ii | Table of Contents | ii |
| ii | Revision History | ii |
| 1 | Introduction | 1 |
| 1.1 | Purpose | 1 |
| 1.2 | Document Conventions | 1 |
| 1.3 | Intended Audience and Reading Suggestions | 1 |
| 1.4 | Product Scope | 1 |
| 1.5 | References | 1 |
| 2 | Overall Description | 2 |
| 2.1 | Product Perspective | 2 |
| 2.2 | Product Functions | 2 |
| 2.3 | User Classes and Characteristics | 2 |
| 2.4 | Operating Environment | 2 |
| 2.5 | Design and Implementation Constraints | 2 |
| 2.6 | User Documentation | 2 |
| 2.7 | Assumptions and Dependencies | 3 |
| 3 | External Interface Requirements | 3 |
| 3.1 | User Interfaces | 3 |
| 3.2 | Hardware Interfaces | 3 |
| 3.3 | Software Interfaces | 3 |
| 3.4 | Communications Interfaces | 3 |
| 4 | System Features | 4 |
| 4.1 | System Feature 1 | 4 |
| 4.2 | System Feature 2 (and so on) | 4 |
| 5 | Other Nonfunctional Requirements | 4 |
| 5.1 | Performance Requirements | 4 |
| 5.2 | Safety Requirements | 5 |
| 5.3 | Security Requirements | 5 |
| 5.4 | Software Quality Attributes | 5 |
| 5.5 | Business Rules | 5 |
| 6 | Other Requirements | 5 |
| Appendix A | Glossary | 5 |
| Appendix B | Analysis Models | 5 |
| Appendix C | To Be Determined List | 6 |

## Revision History

| Name | Date | Reason For Changes | Version |
|------|------|-------------------|---------|
|      |      |                   |         |
|      |      |                   |         |

## 1. Introduction

### 1.1 Overview
The system is a food comparison and meal planner application. It will allow users to find healthier options based on their preferences and dietary requirements and give balanced meal plans based on users' preferred weight and preferences.

This application is designed to help people find better food alternatives, considering their preferred foods and dietary requirements. This application will let users select food either by scanning the barcode or searching for it in the database and view possible alternatives that best align with them considering each item's health score and the user's profile. This application will also make structured meal plan suggestions on a week-by-week basis by calling on an LLM. We'll also add a shuffle button to allow users to switch up their meal plans.

### 1.2 Document Conventions
This SRS uses Times New Roman for all text, with 11 pt font for paragraphs and 12 pt font for tables. All sections follow a numbered structure (e.g., 1, 1.1, 1.1.1) to maintain clarity and hierarchy throughout the document. Requirement statements and subsections consistently follow this numbering format for easy reference.

### 1.3 Intended Audience and Reading Suggestions
This Software Requirements Specification is intended for all stakeholders involved in the design, development, and evaluation of the SnacKompare mobile application, including developers, project supervisors, testers, and any future maintainers of the system. The document provides an overview of the application's purpose, major features, system constraints, and detailed functional and non-functional requirements. Readers should begin with the introductory sections to understand the vision and context of the product, then move to the functional requirements for insight into the application's behaviour, and finally consult the design constraints and technical specifications as needed for implementation or testing activities.

### 1.4 Product Scope and Business Context
The SnacKompare application is being developed as a third-year academic project within the School of Computing and is not sponsored by any external organization. The purpose of the system is educational—allowing the team to gain experience in mobile development, backend engineering, API integration, AI-assisted features, and full-stack application design. To keep the project affordable and sustainable for students, the system will rely on free or low-cost tools and APIs, such as OpenFoodFacts for nutritional data and limited-use LLM APIs for meal-plan generation. Should deployment be required for demonstration or testing, the team intends to use low-cost hosting options such as AWS Free Tier, Render, Railway, or Firebase, ensuring that operational costs remain minimal. Here are the apis and frameworks we plan on using:

**React Native**: We plan to use an Expo-managed React Native setup for the frontend since we plan to build a mobile application, so we don't need to deal with native Android/iOS configuration that much.

**Django**: We'll use this Python Framework for the backend of our application since we are both familiar with it from the Full Stack Programming module in second year. Django is ideal for building rest apis for mobile applications with its rest framework; it also has built in security and good admin dashboards.

**Expo-barcode-scanner**: We'll use this barcode scanner library, as its simple, "out of the box", and takes minimal configuration with an Expo-managed React Native setup.

**PostgreSQL**: We'll use PostgreSQL for the database because it's free, integrates well with Django and handles structured and messy data extremely well. It's also production ready if we ever plan to scale our application.

**Openai** - We'll need to call an LLM to make the personalised meal plans and for a short explanation of the difference in nutritional values for alternative suggestions based on a user's profile.

### 1.5 References

| Reference | Description |
|-----------|-------------|
| 1 | Openai (2025) OpenAI platform, OpenAI Platform. Available at: https://platform.openai.com/docs/overview (Accessed: 23 November 2025). |
| 2 | React Native (2025) Introduction · React Native, React Native RSS. Available at: https://reactnative.dev/docs/getting-started (Accessed: 23 November 2025). |
| 3 | Expo (2025) Expo Camera, Expo Documentation. Available at: https://docs.expo.dev/versions/latest/sdk/camera/ (Accessed: 18 November 2025). |
| 4 | Christie, T. (2025) Django rest framework, Home - Django REST framework. Available at: https://www.django-rest-framework.org/ (Accessed: 28 November 2025). |
| 5 | ProsgreSQL (2025) PostgreSQL 18.1 documentation, PostgreSQL Documentation. Available at: https://www.postgresql.org/docs/current/ (Accessed: 22 November 2025). |
| 6 | OpenFoodFacts (2025) Open Food Facts Documentation, Open Food Facts Wiki. Available at: https://wiki.openfoodfacts.org/Documentation#Documentation (Accessed: 15 November 2025). |

## 2. Overall Description

### 2.1 Product Perspective
SnacKompare is a new, self-contained mobile application designed to help users make healthier food choices by scanning items, comparing nutritional information, and suggesting healthier alternatives. Although similar applications exist (e.g., Yuka for barcode scanning and nutritional evaluation, and Mealime for personalised meal plans), these tools focus on only one aspect of healthy eating. SnacKompare combines barcode scanning, nutritional comparison, and alternative suggestions, and meal planning, into a single cohesive product that encourages healthier eating habits without requiring users to drastically change the foods they enjoy.

The idea for this product originates from observing that many existing health and nutrition apps feel overwhelming, confusing, or too restrictive. Users often want a simple answer when looking at food items: "Is this healthy?" and "Is there a healthier version of this?" SnacKompare aims to address this need by providing an intuitive and accessible way to compare foods and explore better options without compromising personal tastes or favourite foods.

### 2.2 Product Functions
The SnacKompare system will provide the following major functions:

| Function | Description |
|----------|-------------|
| 1. Barcode Scanning | Allow users to scan product barcodes using the device's camera. Automatically retrieve product data based on the scanned barcode. |
| 2. Product Search | Allow users to manually search for food items by name. Should display a list of search results with product names, brands, and potentially images. |
| 3. Product Data Retrieval | Fetch detailed nutritional information from OpenFoodFacts. Clean, validate, and normalise messy API data before use. |
| 4. Nutrition Display | Present nutritional values in a clear, readable format. Highlight missing or unreliable values. |
| 5. Product Comparison | Compare products with similar ones based on nutritional values. Display differences (e.g., sugar %, fat %, salt content). Recommend healthier alternatives. |
| 6. Meal Planner | Produce AI-generated meal ideas by a weekly schedule using users' favourite foods and previous suggested alternatives. |
| 7. Alternative foods AI summary | Provides personalised summaries explaining why a suggested food alternative is healthier or better aligned with the user's profile and also provides a health score. Tailors the explanation to user preferences, goals (e.g., bulking, cutting), and dietary restrictions (e.g., coeliac, lactose intolerance). |
| 8. User Account & Preferences | Allow users to create accounts. Store favourite products, saved comparisons, and dietary preferences. |
| 9. Backend Administration | Manage product records through Django admin. Monitor API usage and scanning behaviour. |

### 2.3 User Classes and Characteristics
Users may rely on the app to simplify decision-making around food choices. The primary users of SnacKompare fall into three main classes:

| User Class | Characteristics | Priority |
|------------|----------------|----------|
| Casual health-conscious users | Make up the largest and most important group. They use the app occasionally, mainly while shopping or preparing meals. They will require the barcode scanner, easy to understand comparisons, and alternative suggestions. | High |
| Users with specific dietary restrictions | Includes coeliac users, individuals monitoring sugar or salt intake, or those following vegan or allergy-sensitive diets. These users rely heavily on accurate ingredient information, personalised warnings, and reliable nutrient filtering. | High |
| Fitness and nutrition enthusiasts | More experienced users who engage with the app more frequently and expect detailed nutritional data, breakdowns, and advanced comparisons. While not the largest group, they are still important as they benefit from deeper insights and may use features such as AI-generated meal plans. | Medium |
| Low digital literacy users | A less important user class, but are important to take into account during user testing. | Low |

### 2.4 Operating Environment
The application will operate as a mobile app built using React Native and will run on both Android and iOS devices. It will require a smartphone, preferably Android 8.0 or iOS 13 or later, to ensure compatibility with Expo-based components such as the barcode scanner. Camera functionality is necessary for barcode scanning, and an active internet connection is needed to communicate with the Django backend API and external services such as the OpenFoodFacts API and LLM providers. The backend will run on a server-hosted environment using Python, Django, and a PostgreSQL database.

### 2.5 Design and Implementation Constraints

| Constraint | Description | Impact |
|------------|-------------|--------|
| OpenFoodFacts Data Quality and Coverage | The system relies heavily on the OpenFoodFacts API for product and nutrition data. As this is an open, community-driven database, many entries are incomplete, inconsistent, or unverified. This limits the quality of comparisons and recommendations we can provide. We plan to mitigate this later by introducing fallback strategies (e.g. a secondary API such as FatSecret) when key nutritional values are missing, but this adds extra integration and logic complexity. | High |
| External Data Sources and Web Scraping Restrictions | While web scraping food retailer websites could theoretically improve data completeness, many grocers do not allow scraping in their terms of service. This legal and ethical restriction limits our ability to automatically enrich product data and forces us to depend primarily on permitted APIs such as OpenFoodFacts (and possibly paid/limited backup APIs). | Medium |
| LLM Meal Planning and Cost Constraints | Generating personalised meal plans using a Large Language Model is constrained by both cost and technical feasibility. Embedding or indexing the entire OpenFoodFacts database would be computationally expensive and not realistic for a low- or no-cost student project. Instead, the system will likely give the LLM a little free reign while also making suggestions use user specific data like a user's favourites, previous searches, and suggested alternatives, and dietary restrictions, which limits how "global" or exhaustive the meal plans can be. | Medium |
| Budget and Infrastructure Limitations | The project is intended to run with minimal or zero ongoing cost. This constrains our choice of APIs (free tiers where possible), hosting providers, database size, and any paid AI features. It may also limit how much historical user data or product data we can store and process. | High |
| Time Constraints | The application must be designed, implemented, and tested within the module timeline, with a final deadline of 20 February 2026. This restricts how many features can realistically be built and may require us to prioritise core functionality (barcode scanning, product comparison, basic recommendations, meal-plans) over more advanced features. | High |

### 2.6 User Documentation
The application will be accompanied by user documentation delivered as a markdown file within the Git repository, detailing steps for installation and running the program, feature descriptions, and instructions for using the barcode scanner, food comparison tool, and meal-planning features. If development time permits, the mobile app will also include integrated help buttons or tips that guide users through key features directly within the interface. Additional in-app prompts or onboarding screens may be incorporated to improve usability and assist first-time users.

### 2.7 Assumptions and Dependencies

#### Assumptions

| Assumption | Description |
|------------|-------------|
| 1 | Users have a mobile device with a functional camera. The system assumes the device camera is capable of scanning standard product barcodes (EAN-13, UPC-A). Extremely low-quality or damaged cameras may reduce scanning accuracy. |
| 2 | Users have an active internet connection. All product searches, barcode lookups, and AI-generated insights rely on external API calls. Offline use is not supported. |
| 3 | OpenFoodFacts continues to provide free and stable access. It is assumed that the OpenFoodFacts API remains available, free to use, and does not introduce breaking changes during development. |
| 4 | AI provider APIs remain accessible and affordable. The project assumes that the LLM provider will offer stable API endpoints and predictable pricing appropriate for a student/low-budget project. |
| 5 | Users will input accurate dietary preferences. Any AI-generated insights or recommendations depend on the user providing truthful dietary restrictions or health goals. |

#### Dependencies

| Dependency | Description | Criticality |
|------------|-------------|-------------|
| 1 | OpenFoodFacts API | The system depends heavily on OpenFoodFacts for product and nutritional information. Incomplete or inaccurate entries will directly affect recommendation quality. A fallback solution (such as an alternative API) may be required if OpenFoodFacts data is missing. | High |
| 2 | React Native + Expo ecosystem | The mobile app depends on the compatibility and ongoing maintenance of React Native, Expo, and the expo-barcode-scanner library. Any breaking updates could require changes in implementation. | High |
| 3 | Django Backend and PostgreSQL Database | The backend relies on Django and PostgreSQL functioning correctly for user accounts, saved foods, alternative suggestions, and history tracking. | High |
| 4 | LLM / AI API Provider | The meal-plan generation, nutritional summaries, and personalised explanations depend on a third-party AI service. Any change in API pricing, rate limits, or availability could have an impact on those features. | Medium |
| 5 | Project Timeline | The system is dependent on the development being completed before the February 20th, 2026 deadline, meaning some features may need to be simplified or cut if time is insufficient. | High |

## 3. External Interface Requirements

### 3.1 Barcode Scanning Functionality

| Attribute | Description |
|-----------|-------------|
| Description | The system shall allow users to scan food product barcodes using their mobile device's camera to retrieve product information quickly and accurately. |
| Criticality | Essential - core method of product retrieval |
| Technical Issues | Requires camera permissions on Android/iOS. Depends on Expo-barcode-scanner accuracy and device camera quality. Some barcodes may be unreadable due to damage or low lighting. |
| Dependencies | Depends on functional backend connection to OpenFoodFacts API. Requires user to grant camera permissions. |

### 3.2 Manual Product Search

| Attribute | Description |
|-----------|-------------|
| Description | The system shall allow users to manually search for food products by entering keywords or product names. |
| Criticality | High, needed when barcode scans fail or products lack barcodes |
| Technical Issues | Search results may vary due to messy OpenFoodFacts data. Requires input validation and rate limiting to avoid excessive API calls. |
| Dependencies | Relies on OpenFoodFacts API and internal database cache. |

### 3.3 Fetching Nutritional Information

| Attribute | Description |
|-----------|-------------|
| Description | The system shall retrieve, clean, and normalise nutritional data from OpenFoodFacts to ensure accurate comparison and display. |
| Criticality | Essential, required for all downstream features |
| Technical Issues | OpenFoodFacts data may be missing, inconsistent, or incorrectly structured. Requires data-cleaning logic and fallback behaviours. |
| Dependencies | Requires stable internet connection. Relies on OpenFoodFacts API responsiveness. |

### 3.4 Nutrition Display

| Attribute | Description |
|-----------|-------------|
| Description | SnacKompare requires continuous internet communication to function, as barcode lookups, product searches, nutritional data retrieval, and AI-generated insights all rely on external API calls. |
| Communication Protocol | The mobile app communicates with the backend server over HTTPS, using standard REST conventions such as GET, POST, PUT, and DELETE requests. |
| Security | All communication must be encrypted using TLS to ensure user privacy and protection of sensitive data such as login credentials and stored preferences. |
| External Services | The backend server communicates with third-party services—including OpenFoodFacts and the LLM provider—over HTTPS. API calls follow JSON-based request and response formats, complying with each provider's specified headers, authentication methods, and rate limits. Timeout handling and retry logic are required for services that may experience high latency or temporary downtime. |
| Error Handling | The application does not require email, SMS, or other communication protocols in its current specification. Synchronisation between mobile devices and the backend is handled through periodic API polling or request-based data retrieval. Network errors, poor connectivity, or rate limit issues must be communicated clearly to the user with appropriate messages such as "Unable to load product data" or "AI service temporarily unavailable." |

### 3.5 Product Comparison & Alternate Suggestions

#### FR-5: Product Comparison Engine

| Attribute | Description |
|-----------|-------------|
| Description | The system shall compare the selected product against similar alternatives, highlighting nutritional differences and providing health scores. |
| Criticality | Essential, main purpose of the application |
| Technical Issues | Requires an internal scoring algorithm. Needs filtering logic for dietary restrictions and preferences. |
| Dependencies | Dependent on FR-3 (clean nutritional data). Uses user profile data (FR-8). |

#### FR-6: Alternative Product Recommendation

| Attribute | Description |
|-----------|-------------|
| Description | The system shall recommend healthier alternatives to the base product, ranking them based on nutritional score and user profile alignment. |
| Criticality | Essential, core functionality |
| Technical Issues | Requires consistent scoring algorithm. Needs efficient product similarity matching. |
| Dependencies | Depends on FR-5 and FR-8 (User Profile). |

### 3.6 AI-Generated Explanations

#### FR-7: AI Summary Generation

| Attribute | Description |
|-----------|-------------|
| Description | The system shall generate personalised AI summaries explaining why a suggested alternative is healthier or better aligned with the user profile. |
| Criticality | Medium, valuable but not core |
| Technical Issues | Requires stable LLM access. LLM responses may vary; requires prompt-engineering. Requires cost management for API calls. |
| Dependencies | Depends on FR-5 (comparison engine) and FR-8 (user profile). Requires stored health scores and cleaned nutritional data. |

### 3.7 Meal Planning

#### FR-8: Weekly AI Meal Plan Generation

| Attribute | Description |
|-----------|-------------|
| Description | The system shall generate weekly meal plans using an LLM based on the user's saved foods, dietary restrictions, and health goals. |
| Criticality | Medium, important but secondary |
| Technical Issues | LLM may produce inconsistent formatting; requires prompt constraints. Requires caching to reduce cost. Needs error handling if API limits are hit. |
| Dependencies | Depends on User Profile (FR-9). Depends on LLM provider availability. |

### 3.8 User Profile & Preference

#### FR-9: User Profile Management

| Attribute | Description |
|-----------|-------------|
| Description | The system shall allow users to create and maintain a personalised profile including dietary restrictions, preferred foods, calorie goals, and other optional health metrics. |
| Criticality | High, required for personalised recommendations |
| Technical Issues | Must ensure secure storage of personal data. Requires validation logic for user inputs. GDPR-compliant handling required. |
| Dependencies | Supports FR-5 (comparison), FR-6 (alternatives), FR-7 (AI explanations), and FR-8 (meal planning). |

### 3.9 Nutrition Display

#### FR-10: Saving Favourites

| Attribute | Description |
|-----------|-------------|
| Description | The system shall allow users to save favourite food items for quick access and inclusion in future recommendations. |
| Criticality | Medium |
| Technical Issues | Requires persistent database storage. Requires link between product IDs and user accounts. |
| Dependencies | Depends on FR-9 (user accounts). |

## 4. System Architecture

This section describes the high-level architecture of the SnacKompare system. The architecture is modular, consisting of a mobile front-end, a Django-based backend, and a PostgreSQL database. It also incorporates OpenFoodFacts api for food information, expo camara for barcode scanning, and Open-AI for AI-generated meal plans.

### 4.1 Architectural Overview
SnacKompare adopts a client–server architecture, where the React Native mobile application serves as the client and the Django REST API acts as the server. Users interact with the application through the mobile client, which communicates with the backend via HTTPS requests.

At a high level, the system includes:

| Component | Description |
|-----------|-------------|
| React Native Mobile App | Handles user interactions, barcode scanning, browsing, comparing food items, viewing nutritional data, and receiving AI-generated meal plans. |
| Django Backend (REST API) | Provides business logic, comparison algorithms, user profile processing, and interfaces with external APIs and the database. |
| PostgreSQL Database | Stores structured user data, cached food items, cleaned nutrition records, preferences, dietary profiles, and meal-plan history. |
| External Services / 3rd Party Modules | 1. OpenFoodFacts API – Provides raw nutrition and product data for scanned or searched items. 2. Expo Barcode Scanner / react-native-camera – Enables barcode scanning via mobile device camera. 3. LLM API (OpenAI) – Generates personalised weekly meal plans based on user preferences, health goals, and dietary requirements. |

### 4.2 System Modules and Responsibilities

#### 4.2.1 Front-End (React Native)
Responsibilities:
- Provide the mobile user interface.
- Handle barcode scanning using expo-barcode-scanner / react-native-camera.
- Display nutritional comparisons and healthier alternatives.
- Send user preferences and dietary goals to backend.
- Present AI-generated meal plans and allow shuffling for alternatives.
- Manage navigation, user profile views, and interactive components.

Key technologies:
- React Native
- Expo framework
- react-native-camera / expo-barcode-scanner
- Axios/Fetch for API calls

#### 4.2.2 Back-End (Django + Django REST Framework)
Responsibilities:
- Expose REST API endpoints to serve food data, comparisons, meal plans, and user information.
- Query OpenFoodFacts API, then clean, normalise, and validate the returned data.
- Implement core comparison logic (e.g., ranking by health scores, nutrition deltas).
- Generate prompt structures and interact with the LLM API for meal plan creation.
- Perform authentication, profile management, and error handling.
- Cache or store frequently accessed food items to improve responsiveness.

#### 4.2.3 Database Layer (PostgreSQL)
Responsibilities:
- Store structured and cleaned food metadata fetched from OpenFoodFacts.
- Persist user profiles, preferences, dietary restrictions, and goals.
- Hold saved comparisons, favorites, and generated meal plans.
- Support query operations for fast retrieval in the mobile app.

## 5. High-Level Design

### 5.1 Context Diagram
*[Context Diagram - Refer to diagrams/context_diagram.png]*

This diagram shows how SnacKompare interacts with its external entities, including users, the OpenFoodFacts API, and the AI provider. It illustrates the flow of information between the system and these entities.

### 5.2 Data Flow Diagram
*[Data Flow Diagram - Refer to diagrams/data_flow_diagram.png]*

This diagram shows the data movements within SnacKompare, illustrating the major processes, data stores, and external entities. It represents how the system handles scanning, searching, comparing products, generating meal plans, and storing user preferences.

### 5.3 Logical Data Structure
*[Logical Data Structure Diagram - Refer to diagrams/logical_data_structure.png]*

This diagram presents the main data entities used in SnacKompare and the relationships between them. It represents how user accounts, scanned products, alternatives, and meal plans relate through cardinalities.

## 6. Preliminary Schedule
This section provides an initial project plan for SnacKompare, including major tasks, estimated durations, dependencies, and required resources. Since the project must be completed by February 2026, the schedule is structured to allow incremental development while ensuring early delivery of core features (barcode scanning, product search, nutrition comparison) with sufficient buffer time for testing and integration.

The schedule includes:
- A breakdown of major project tasks
- Estimated start and end dates
- Dependencies between tasks
- Required hardware, software, and personnel resources
- A PERT / dependency flow diagram
- A Gantt chart representing the full timeline

### 6.1 Major Tasks and Dependencies

| Task ID | Task Description | Dependencies |
|---------|------------------|--------------|
| T1 | Requirements Finalisation | - |
| T2 | High-Level System Design (DFD, Context, LDS) | T1 |
| T3 | Backend Setup (Django + PostgreSQL) | T2 |
| T4 | Frontend Setup (React Native + Expo) | T2 |
| T5 | Barcode Scanner Feature | T4 |
| T6 | Product Search & Results UI | T4 |
| T7 | API Integration with OpenFoodFacts | T3 |
| T8 | Nutrition Processing & Health Scoring | T7 |
| T9 | Product Comparison Engine | T8 |
| T10 | AI Meal Planner Integration | T7 |
| T11 | User Accounts, Preferences, Authentication | T3 |
| T12 | Testing: Unit + Integration | T5-T11 |
| T13 | UX Polish, Styling & Bug Fixes | T12 |
| T14 | Documentation, Report Writing, Submission | T13 |

### 6.2 Pert/Dependency Diagram
*[PERT/Dependency Diagram - Refer to diagrams/pert_diagram.png]*

### 6.3 Gantt Chart
*[Gantt Chart - Refer to assets/gantt_chart.png]*

### 6.4 Resource Requirements

#### Hardware
- Student laptops capable of running React Native, Android emulator, and Django backend
- Smartphones for physical testing (Android required, iOS optional)
- Internet access for API testing

#### Software
- React Native + Expo CLI
- Django + Django REST Framework
- PostgreSQL
- OpenFoodFacts API
- OpenAI API
- GitLab for version control
- Postman for API testing

#### Wetware
As a rule, both developers will be involved with every major aspect of the project.

## 7. Appendices
Below are the appendices required to support this SRS.

### Appendix A – Glossary

| Term | Definition |
|------|------------|
| SnacKompare | The mobile application being developed |
| OpenFoodFacts (OFF) | Public API providing food and nutrition data |
| LLM | Large Language Model (OpenAI/Gemini) used for meal planning |
| Barcode Scanner | Feature that captures EAN/UPC codes via mobile camera |
| Health Score | A calculated rating of food healthiness |
| Meal Plan | AI-generated weekly set of meals personalised to user |
| Data Store | Persistent storage in PostgreSQL |
| API | Application Programming Interface |

### Appendix B – To Be Determined

| TBD ID | Description | Expected Resolution Date |
|--------|-------------|--------------------------|
| TBD-1 | Exact health scoring algorithm | During implementation |
| TBD-2 | Exact health scoring algorithm | Mid-project milestone |
| TBD-3 | Whether meal plan shuffle feature will be included | After MVP completion |
| TBD-4 | Fallback API for missing nutritional values | Before final deployment |
| TBD-5 | Feature where users can take a picture and receive a national estimate of the food based off AI | Optional, if time allows |