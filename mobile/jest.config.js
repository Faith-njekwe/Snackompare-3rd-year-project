module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/__tests__/**/*.test.js"],
  // Transform ESM packages (superset of jest-expo defaults, adding firebase)
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|firebase|@firebase))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
  moduleNameMapper: {
    // AsyncStorage mock
    "@react-native-async-storage/async-storage":
      "<rootDir>/__mocks__/async-storage.js",
    // Firebase mock – keeps tests free of real network calls
    "^firebase/(.*)$": "<rootDir>/__mocks__/firebase.js",
    "^../services/firebase$": "<rootDir>/__mocks__/firebase.js",
    "^\\.\\./services/firebase$": "<rootDir>/__mocks__/firebase.js",
    // Stub the expo ImportMetaRegistry to avoid lazy-require scope errors in jest 30
    "expo/src/winter/ImportMetaRegistry":
      "<rootDir>/__mocks__/expoImportMetaRegistry.js",
  },
};
