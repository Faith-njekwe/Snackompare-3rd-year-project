import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DietChatScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Hi! I'm your nutrition coach! 🥗\n\nTell me your goal, your height and weight, activity level, and any conditions (e.g., diabetes, celiac, allergies), and I'll help you build a plan.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  const API_URL = "http://192.168.1.15:8000/api/chat/"; // replace with your machine IP if testing on a phone

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMsg = { id: String(Date.now()), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    // Build history for backend
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.text }));

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          history,
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

      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 2), role: "assistant", text: data.aiResponse || "(no response)" },
      ]);
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
  keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
>
  <View style={styles.innerContainer}>

    <View style={styles.header}>
      <Text style={styles.title}>Diet Coach</Text>
    </View>

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
          <Text style={styles.messageText}>{m.text}</Text>
        </View>
      ))}
    </ScrollView>

    {/* Your bottom input area */}
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
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={{ color: "white", fontWeight: "bold" }}>➤</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: "700",
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
