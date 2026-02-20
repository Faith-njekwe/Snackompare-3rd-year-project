// Minimal Firebase mock – prevents real network calls during Jest tests

const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((cb) => { cb(null); return jest.fn(); }),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: "test-uid" } })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: "test-uid" } })),
  signOut: jest.fn(() => Promise.resolve()),
};

const mockDb = {};

// firebase/app
const initializeApp = jest.fn(() => ({}));
const getApp = jest.fn(() => ({}));
const getApps = jest.fn(() => []);

// firebase/auth
const initializeAuth = jest.fn(() => mockAuth);
const getAuth = jest.fn(() => mockAuth);
const getReactNativePersistence = jest.fn();
const onAuthStateChanged = jest.fn((auth, cb) => { cb(null); return jest.fn(); });
const signInWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: { uid: "test-uid" } }));
const createUserWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: { uid: "test-uid" } }));
const signOut = jest.fn(() => Promise.resolve());

// firebase/firestore
const getFirestore = jest.fn(() => mockDb);
const doc = jest.fn(() => ({}));
const collection = jest.fn(() => ({}));
const getDocs = jest.fn(() => Promise.resolve({ docs: [] }));
const getDoc = jest.fn(() => Promise.resolve({ exists: () => false, data: () => null }));
const setDoc = jest.fn(() => Promise.resolve());
const deleteDoc = jest.fn(() => Promise.resolve());
const writeBatch = jest.fn(() => ({
  set: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
}));

module.exports = {
  // app
  initializeApp,
  getApp,
  getApps,
  // auth
  auth: mockAuth,
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  // firestore
  db: mockDb,
  getFirestore,
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
};
