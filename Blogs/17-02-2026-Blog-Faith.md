# Blog Entry - February 17, 2026
**Author:** Faith Njekwe

## Onboarding Screens

This week, I created onboarding screens to collect a user’s health information, including their age, weight, height, activity level, dietary preferences, health conditions, and allergens. I also implemented automatic saving so that once the user presses finish, their information is stored both in their profile locally and in the Firebase database. This ensures the data is immediately available for personalisation features without requiring additional setup later.

I intentionally limited the onboarding flow to three screens because overly long onboarding processes can frustrate users and reduce completion rates. The three screens — `GoalScreen`
, `StatsActivityScreen`, and `DietScreen` — were designed to balance usability and completeness. This approach avoids overcrowding individual screens while still keeping the overall process short and efficient.

## Adding Context to the Chatbot

After implementing the onboarding screens, I focused on adding personalised context to the chatbot. I connected the user’s account details to the chatbot by retrieving their profile data after login and attaching relevant fields to the chat context before each request is sent. To support this, I added helper functions in `views.py` to sanitise the profile data, ensuring that only valid and relevant fields are included in the chatbot context. I also implemented a safe fallback so that if profile data is missing, the chatbot still responds using a default generic context rather than failing.

While testing, I noticed that the chatbot responses were returned in markdown format. To handle this properly on the frontend, I integrated `react-native-markdown-display`, which converts markdown into properly formatted readable text within the app. This ensures responses display cleanly and improves the overall user experience.