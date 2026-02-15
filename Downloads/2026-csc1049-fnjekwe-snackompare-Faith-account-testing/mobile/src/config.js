import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Accept either env name; strip trailing slashes and optional /api suffix so callers can append /api/*
const rawApiBase =
  process.env.EXPO_PUBLIC_API_BASE ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://snackompare.up.railway.app";

export const API_BASE_URL = rawApiBase
  .replace(/\/$/, "")
  .replace(/\/api$/, "");


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// For Firebase JS SDK v7.20.0 and later
const firebaseConfig = {
  apiKey: "AIzaSyDI8v91yBsdcBPmMymJMgMRO_00H_nhe54",
  authDomain: "snackompare.firebaseapp.com",
  projectId: "snackompare",
  storageBucket: "snackompare.firebasestorage.app",
  messagingSenderId: "364837310288",
  appId: "1:364837310288:web:420040cabeabc35d54a655",
};

// Prevent re-initializing in dev / fast refresh
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getApps().length === 1
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
export const db = getFirestore(app);
