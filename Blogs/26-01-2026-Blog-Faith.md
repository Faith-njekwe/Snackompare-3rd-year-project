# Blog Entry - January 26, 2026
**Author:** Faith Njekwe

## Implementing the Meal Calorie Estimator and OpenAI-Based Chatbot

I implemented the meal calorie estimator and OpenAI-based chatbot. First, I looked through the OpenAI documentation to learn how to integrate it with our app. I found this challenging at first, as the integration process was different from the chatbots I had previously built. Since we were using React Native to test the app directly on our phones, I had to edit the app.json to allow my iphone to accept HTTP traffic and adjust the encryption settings too.

## OpenAI chatbot 

After that, I started on the OpenAI-based chatbot, as I thought it would be easier to implement. While building it, I discovered that since I was testing on my Iphone, I had to set the API_URL to my IP address, and my phone and laptop had to be on the same network. On the backend, I made a ChatView setting my client as OpenAI and wrote an informative DIET_SYSTEM_PROMPT telling the llm to provide safe, evidence-based dietary guidance while encouraging sustainable and healthy eating habits.

## Meal Photo Screen

After I was done implementing the dietary advice chatbot, I started on the meal scanner/calorie estimator feature. The goal was to be able to allow users to take a photo of a meal within the app and send it to OpenAI, which would analyse the meal image and return the food items, estimated calorie values, and an overall confidence score. One downside to this approach is that the scanner isn't always accurate with the portion size, and if time allows, we could improve on this with user-assisted portion correction to improve accuracy.

On the frontend, I implemented a camera screen using react-native-vision-camera, allowing users to take photos of their meals directly within the app. This involved handling camera permissions, capturing images, and uploading them to the backend using a multipart form data request. While the image was being analysed, a loading overlay displayed progress messages. Once the response was received, I presented the calorie estimation results in a formatted modal, showing the detected food items, estimated calorie values, and confidence scores, along with the total estimated calories, ensuring the results were clear and easy to understand. Overall, this feature added an interactive and practical way for users to track their meals and calorie intake within the app.