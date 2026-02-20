import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config";
import { useFocusEffect } from "@react-navigation/native";
import { getProfile } from "../services/storage";


const welcomeMsg = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm your nutrition coach! 🥗\n\nAsk me anything! I can build you a meal plan, or give you general advice.",
};

const ALLOWED_GOALS = new Set(["lose", "maintain", "gain"]);
const ALLOWED_ACTIVITY = new Set(["sedentary", "light", "moderate", "very"]);
const ALLOWED_GENDERS = new Set(["male", "female", "other", "prefer_not"]);

function toIntOrNull(value, min, max) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  if (i < min || i > max) return null;
  return i;
}

function toCleanStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);
}

function buildProfileContext(profile) {
  if (!profile || typeof profile !== "object") return null;

  const ctx = {};

  // Goal + activity
  if (ALLOWED_GOALS.has(profile.goal)) ctx.goal = profile.goal;
  if (ALLOWED_ACTIVITY.has(profile.activityLevel)) ctx.activityLevel = profile.activityLevel;

  // Gender if present
  if (ALLOWED_GENDERS.has(profile.gender)) ctx.gender = profile.gender;

  // Body metrics
  const age = toIntOrNull(profile.age, 1, 120);
  const heightCm = toIntOrNull(profile.heightCm, 80, 250);
  const weightKg = toIntOrNull(profile.weightKg, 20, 350);
  const targetChangeKg6mo = toIntOrNull(profile.targetChangeKg6mo, 0, 30);

  if (age !== null) ctx.age = age;
  if (heightCm !== null) ctx.heightCm = heightCm;
  if (weightKg !== null) ctx.weightKg = weightKg;
  if (targetChangeKg6mo !== null) ctx.targetChangeKg6mo = targetChangeKg6mo;

  // Constraints/preferences
  const dietPrefs = toCleanStringArray(profile.dietPrefs);
  const allergens = toCleanStringArray(profile.allergens);
  const healthConditions = toCleanStringArray(profile.healthConditions).filter((x) => x !== "N/A");

  if (dietPrefs.length) ctx.dietPrefs = dietPrefs;
  if (allergens.length) ctx.allergens = allergens;
  if (healthConditions.length) ctx.healthConditions = healthConditions;

  return Object.keys(ctx).length ? ctx : null;
}

export default function DietChatScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([welcomeMsg]);
  const [isSending, setIsSending] = useState(false);
  const [profile, setProfile] = useState(null);
  const scrollRef = useRef(null);

  const loadLatestProfile = useCallback(async () => {
    try {
      const p = await getProfile();
      setProfile(p);
      return p;
    } catch (e) {
      console.error("Failed to load profile:", e);
      return null;
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadLatestProfile();
    }, [loadLatestProfile])
  );


// used API_BASE_URL from config.js so as to not hardcode the URL here (hosted on railway)
  const API_URL = `${API_BASE_URL}/api/chat/`;

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const latestProfile = await loadLatestProfile();
    const profileContext = buildProfileContext(latestProfile);

    const userMsg = { id: String(Date.now()), role: "user", text: trimmed };

    // Append the user's message to the current conversation state
    const nextMessages = [...messages, userMsg];

    // Update UI immediately
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    const history = nextMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          history,
          profileContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errText = data?.error || "Request failed";
        setMessages((prev) => [
          ...prev,
          { id: String(Date.now() + 1), role: "assistant", text: `Error: ${errText}` },
        ]);
        return;
      }

      setMessages((prev) => {
        return [
          ...prev,
          { id: String(Date.now() + 2), role: "assistant", text: data.aiResponse || "(no response)" },
        ];
      });
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 3), role: "assistant", text: "Network error. Check your server URL." },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
  <KeyboardAvoidingView
  style={styles.container}
  behavior={Platform.OS === "ios" ? "padding" : undefined}
  keyboardVerticalOffset={Platform.OS === "ios" ? 95 : 0}
>
  <View style={styles.innerContainer}>

    <ScrollView
      ref={scrollRef}
      style={styles.scrollView}
      contentContainerStyle={styles.chatContainer}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
      onContentSizeChange={() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      }
    >
      {messages.map((m) => (
        <View
          key={m.id}
          style={[
            styles.messageContainer,
            m.role === "assistant" ? styles.botMessage : styles.userMessage,
          ]}
        >
          <Markdown style={{ body: styles.messageText }}>{m.text}</Markdown>
        </View>
      ))}
    </ScrollView>

    {/* Input Area */}
    <View style={styles.bottomContainer}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask your diet coach..."
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold" }}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>

  </View>
</KeyboardAvoidingView>

  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  innerContainer: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 8,
  },
  prefsBanner: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  clearButton: {
    padding: 8,
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  chatContainer: {
    paddingBottom: 8,
    flexGrow: 1,
  },

  messageContainer: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: "85%",
  },
  botMessage: {
    backgroundColor: palette.card,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: palette.border,
  },
  userMessage: {
    backgroundColor: palette.accent,
    alignSelf: "flex-end",
  },
  messageText: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
  },

  bottomContainer: {
    backgroundColor: palette.bg,
    paddingBottom: Platform.OS === "ios" ? 12 : 6,
    paddingHorizontal: 8,
    paddingTop: 16,
    borderTopColor: palette.border,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    width: "100%",
    borderWidth: 1,
    borderColor: palette.border,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.accent,
  },
});


