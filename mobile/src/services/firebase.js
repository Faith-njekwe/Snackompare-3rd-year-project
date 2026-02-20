import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDI8v91yBsdcBPmMymJMgMRO_00H_nhe54",
  authDomain: "snackompare.firebaseapp.com",
  projectId: "snackompare",
  storageBucket: "snackompare.firebasestorage.app",
  messagingSenderId: "364837310288",
  appId: "1:364837310288:web:ad24cf76808e9d1754a655",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
