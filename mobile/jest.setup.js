// ---------------------------------------------------------------------------
// Expo winter runtime – replace all lazy getters installed by jest-expo/expo
// setup with concrete values, preventing "import outside scope" errors in
// jest 30 when babel-preset-expo's metro transform accesses these globals.
// ---------------------------------------------------------------------------

function safeDefine(name, value) {
  const desc = Object.getOwnPropertyDescriptor(global, name);
  if (!desc || desc.configurable) {
    Object.defineProperty(global, name, {
      value,
      configurable: true,
      writable: true,
      enumerable: false,
    });
  }
}

// Stub the expo import-meta registry
safeDefine("__ExpoImportMetaRegistry", { url: null });

// Use native structuredClone (Node 17+) or a JSON round-trip fallback
safeDefine(
  "structuredClone",
  global.structuredClone ??
    ((v) => JSON.parse(JSON.stringify(v)))
);

// Silence expected console.error/warn noise from tested modules
jest.spyOn(console, "error").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});

// Provide a global fetch mock (replaced per-test as needed)
global.fetch = jest.fn();

// Reset all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
