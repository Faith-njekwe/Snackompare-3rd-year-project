# Blog Entry - February 15, 2026
**Author:** Daniel Obazuaye

## Switched to Firebase JS SDK
The native `@react-native-firebase/*` packages had an unresolvable CocoaPods conflict with the barcode scanner (`react-native-vision-camera-barcodes-scanner`). Both pulled in incompatible versions of `GTMSessionFetcher` and `nanopb`, so `pod install` would always fail. I replaced the native SDK with the pure JavaScript `firebase` package, which has no native iOS dependencies and eliminates the conflict entirely. Auth persistence uses `getReactNativePersistence` backed by AsyncStorage.

## Dedicated sign-in/sign-up screen
Previously the auth form was buried inside the Settings screen. I built a standalone `AuthScreen` that gates the entire app — if you're not signed in, you see the sign-in page; once authenticated, the main tab navigator loads. The screen toggles between sign-in and sign-up modes and shows friendly, human-readable error messages instead of raw Firebase error codes (e.g. "Incorrect email or password" instead of `auth/invalid-credential`).

## Account deletion with data cleanup
When a user deletes their account, the app now wipes all their Firestore data first (favourites subcollection, profile, and chat history), clears local AsyncStorage, and then removes the Firebase Auth account. If the session is too old, Firebase prompts for the password to re-authenticate before proceeding.

## Chat history syncs to Firestore
The Diet Coach chatbot now loads saved conversation history on launch and saves after every bot response. Messages are capped at the last 20 to keep database usage minimal. On login, `syncOnLogin` pulls cloud chat history so conversations carry across devices.

## Profile screen and UI tweaks
Renamed Settings to Profile, added a profile icon (`person-circle-outline`) in the top-right corner of the home screen, and centred the SnacKompare title. Also centred the Diet Coach header and adjusted the keyboard offset so the text input floats above the keyboard when typing.
