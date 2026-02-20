/**
 * In-memory AsyncStorage mock.
 * Resets between tests via jest.clearAllMocks() in jest.setup.js.
 */
let store = {};

const AsyncStorage = {
  getItem: jest.fn((key) => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key, value) => {
    store[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete store[key];
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => delete store[k]);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    store = {};
    return Promise.resolve();
  }),
};

// Reset the in-memory store each time clearAllMocks is called
beforeEach(() => {
  store = {};
});

export default AsyncStorage;
