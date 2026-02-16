# Blog Entry - February 16, 2026
**Author:** Daniel Obazuaye

## Calorie tracker now persists across app restarts
Previously all calorie tracker data lived in React state only, so closing the app or reloading Metro meant losing everything. I added `saveCalorieLog` and `getCalorieLog` to `storage.js` following the existing dual-save pattern (AsyncStorage first, then Firestore if signed in). The food log is stamped with today's date — on load, if the saved date matches today the items are restored, otherwise the food log resets but the daily goal carries over. The `syncOnLogin` and `deleteAllUserData` functions were also updated to include the calorie log.

## "Add to Calorie Tracker" button in product detail modal
When viewing a product's details (from search or favourites), there is now an "Add to Calorie Tracker" button alongside the existing favourites button. Tapping it pushes the product name and energy value into a shared context (`CalorieTotalContext`), which the calorie tracker screen then picks up and adds as a new food row. This makes it much faster to log foods you've already looked up.

## CalorieTotalContext extended with pending food items
The context was refactored to support a `pendingFoodItems` queue. Any screen can call `addFoodItem(name, calories)` and the calorie tracker screen consumes the queue on render. This replaced the old `addCalories` bulk approach, so individual food items now appear as separate rows with names intact.

## Pagination for product search
Search results now load 10 at a time instead of pulling 25 in one go. A "Load More" button appears at the bottom of the results list when more pages are available. The `searchProducts` service function was updated to accept a `page` parameter and return a `hasMore` flag based on the total count from the Open Food Facts API.

## Redesigned meal photo screens
The meal photo entry screen got a visual overhaul with a hero section, a prominent CTA card, and a "How it works" three-step explainer. The calorie estimation modal after taking a photo was also redesigned — each detected food item now has an icon badge, a kcal pill, and confidence percentage. Items are added individually to the calorie tracker instead of as a single lump sum.

## Energy info on favourites cards
Favourite product cards now show the energy value (kcal per 100g) when available, and the hint text was changed from "Tap trash to remove" to "Tap to view details" to better reflect the current interaction.
