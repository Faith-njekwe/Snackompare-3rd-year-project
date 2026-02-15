import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { syncOnLogin } from "../services/storage";
import { palette } from "../theme";

export default function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      await syncOnLogin();
    } catch (e) {
      const code = e.code || "";
      const friendly = {
        "auth/invalid-email": "That email address doesn't look right. Please check and try again.",
        "auth/user-disabled": "This account has been disabled. Please contact support.",
        "auth/user-not-found": "No account found with that email. Would you like to sign up instead?",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Incorrect email or password. Please try again.",
        "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
        "auth/weak-password": "Password is too weak. Please use at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
        "auth/network-request-failed": "No internet connection. Please check your network and try again.",
        "auth/operation-not-allowed": "This sign-in method is not enabled. Please contact support.",
        "auth/missing-password": "Please enter your password.",
      };
      setError(friendly[code] || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="nutrition" size={48} color="#fff" />
            </View>
            <Text style={styles.appName}>SnacKompare</Text>
            <Text style={styles.tagline}>
              Make healthier food choices with AI-powered nutrition insights
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>

            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={palette.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={palette.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={palette.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={palette.muted}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, busy && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignUp ? "Create Account" : "Sign In"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
            >
              <Text style={styles.switchText}>
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
              </Text>
              <Text style={styles.switchLink}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 14,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    textAlign: "center",
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: {
    color: palette.muted,
    fontSize: 14,
  },
  switchLink: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: "700",
  },
});
