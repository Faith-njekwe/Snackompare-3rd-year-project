import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { deleteAllUserData } from "../services/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const api = useMemo(() => {
    const signUp = async (email, password) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return credential.user;
    };

    const signIn = async (email, password) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    };

    const signOut = async () => {
      await firebaseSignOut(auth);
    };

    const deleteAccount = async (password) => {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user signed in");
      if (password) {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }
      // Delete all Firestore data and local storage before removing the account
      await deleteAllUserData();
      await deleteUser(currentUser);
    };

    return { user, loading, signUp, signIn, signOut, deleteAccount };
  }, [user, loading]);

  return (
    <AuthContext.Provider value={api}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
