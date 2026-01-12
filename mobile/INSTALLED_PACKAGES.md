# Installed React Native Packages

Your project is now set up with a comprehensive set of React Native packages. You won't need to rebuild for most common features.

## Authentication
- `@react-native-google-signin/google-signin` - Google Sign-In integration
- `@invertase/react-native-apple-authentication` - Apple Sign In (iOS)
- `expo-local-authentication` - Biometric authentication (Face ID, Touch ID, fingerprint)
- `expo-secure-store` - Secure encrypted storage for sensitive data

## Media & Camera
- `react-native-vision-camera` - High-performance camera library with frame processors
- `vision-camera-code-scanner` - Barcode/QR code scanning for VisionCamera
- `expo-image-picker` - Pick images from gallery or take photos
- `expo-media-library` - Access device photo library
- `expo-av` - Audio and video playback/recording

## Storage & Files
- `expo-file-system` - File system access
- `expo-document-picker` - Document picker for various file types
- `expo-sharing` - Share files with other apps
- `@react-native-async-storage/async-storage` - Async key-value storage

## Location & Maps
- `expo-location` - GPS location services
- `react-native-maps` - Map views and markers

## UI & Navigation
- `@react-navigation/native` - Navigation framework
- `@react-navigation/native-stack` - Native stack navigator
- `react-native-gesture-handler` - Gesture handling
- `react-native-reanimated` - Smooth animations
- `react-native-safe-area-context` - Safe area handling
- `react-native-screens` - Native screen components
- `react-native-svg` - SVG support
- `expo-splash-screen` - Splash screen control
- `expo-status-bar` - Status bar styling
- `expo-font` - Custom fonts
- `expo-haptics` - Haptic feedback

## Web & Networking
- `react-native-webview` - Web view component
- `expo-web-browser` - Open web browser
- `expo-linking` - Deep linking
- `@react-native-community/netinfo` - Network connectivity info
- `axios` - HTTP client

## System & Utilities
- `expo-notifications` - Push notifications
- `expo-contacts` - Access device contacts
- `expo-clipboard` - Clipboard access
- `expo-dev-client` - Development build support

## Build Configuration

### App Configuration
- [app.json](./app.json) - Main app configuration with all permissions
- [eas.json](./eas.json) - EAS Build configuration
- [babel.config.js](./babel.config.js) - Babel configuration with Reanimated plugin

### Permissions Configured
**iOS:** Camera, Photo Library, Microphone, Location, Contacts, Calendar, Reminders, Face ID
**Android:** Camera, Storage, Location, Audio Recording, Biometric

## Creating Your Development Build

Since you have native modules, you need a development build (not Expo Go).

### Option 1: Cloud Build (Recommended)
```bash
# Login to Expo
eas login

# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

### Option 2: Local Build
```bash
# iOS (requires Mac with Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android
```

## Running the App

After installing your development build:

```bash
cd mobile
npx expo start --dev-client
```

Then scan the QR code with your development build app.

## Adding More Packages

If you need to add more native modules in the future:
1. Install the package: `npm install package-name`
2. Update [app.json](./app.json) plugins if needed
3. Rebuild your development build

For JS-only packages, you don't need to rebuild - just install and reload.

## Google Sign-In Setup

To use Google Sign-In, you'll need to:
1. Create a project in Google Cloud Console
2. Configure OAuth consent screen
3. Create OAuth 2.0 credentials (iOS and Android)
4. Add the credentials to your app.json

See: https://github.com/react-native-google-signin/google-signin

## Apple Sign-In Setup

Apple Sign-In requires:
1. Enable "Sign In with Apple" capability in Xcode
2. Add the capability to your Apple Developer account
3. iOS 13+ required

See: https://github.com/invertase/react-native-apple-authentication
