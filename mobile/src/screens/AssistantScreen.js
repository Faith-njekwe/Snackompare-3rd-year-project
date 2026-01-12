import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAT_HISTORY_KEY = "@snackompare_chat_history";

const AssistantScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      from: "bot",
      text: "Hey 👋 I'm your SnacKompare nutrition assistant. Ask me anything about healthy eating, nutrition, or food choices! ✨",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userPrefs, setUserPrefs] = useState({ diet: "None", filters: {}, allergens: [] });
  const scrollViewRef = useRef(null);

  // Load chat history
  useEffect(() => {
    (async () => {
      try {
        const historyJson = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
        if (historyJson) {
          const history = JSON.parse(historyJson);
          if (history.length) setMessages(history);
        }
        const prefsJson = await AsyncStorage.getItem("profilePrefs");
        if (prefsJson) setUserPrefs(JSON.parse(prefsJson));
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    })();
  }, []);

  // Save chat history
  const saveChatHistory = async (msgs) => {
    try {
      // Keep only last 20 messages
      const toSave = msgs.slice(-20);
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.error("Error saving chat history:", err);
    }
  };

  // Scroll to bottom (only when a new message is added)
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 80);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), from: "user", text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveChatHistory(newMessages);
    setInput("");
    setLoading(true);

    try {
      const loadingMsg = { id: "loading", from: "loading", text: "" };
      setMessages((prev) => [...prev, loadingMsg]);

      // Generate nutrition assistant response
      const reply = generateNutritionResponse(input.toLowerCase(), userPrefs);
      const bubbles = cleanAndSplit(reply);
      const botMessages = bubbles.map((text) => ({
        id: Date.now().toString() + Math.random(),
        from: "bot",
        text,
      }));

      const finalMessages = [
        ...newMessages,
        ...botMessages,
      ];

      setMessages(finalMessages);
      scrollToBottom(true);
      saveChatHistory(finalMessages);
    } catch (error) {
      console.error("AI Error:", error?.message || error);

      const errMsg = {
        id: Date.now().toString() + "_error",
        from: "bot",
        text: "I couldn't reply right now — please try again soon 💬",
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== "loading"), errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Simple rule-based responses for nutrition advice
  const generateNutritionResponse = (query, prefs) => {
    // Keywords and responses
    if (query.includes("sugar") || query.includes("sweet")) {
      return "High sugar intake can lead to weight gain and energy crashes. Try to keep added sugars under 25g per day. Choose whole fruits over processed sweets for natural sweetness with fiber! 🍎";
    }

    if (query.includes("protein") || query.includes("muscle")) {
      return "Protein is essential for muscle building and repair. Aim for 0.8-1g per kg of body weight daily. Great sources include lean meats, fish, eggs, legumes, and Greek yogurt. 💪";
    }

    if (query.includes("salt") || query.includes("sodium")) {
      return "High sodium intake can increase blood pressure. Try to limit sodium to under 2,300mg per day. Check food labels and opt for low-sodium alternatives when possible. 🧂";
    }

    if (query.includes("calorie") || query.includes("weight loss") || query.includes("diet")) {
      return "For healthy weight loss, create a moderate calorie deficit of 500 calories per day. Focus on whole foods, plenty of vegetables, lean proteins, and regular exercise. Crash diets don't work long-term! 🥗";
    }

    if (query.includes("fiber") || query.includes("digestive") || query.includes("gut")) {
      return "Fiber is crucial for digestive health! Aim for 25-30g daily. Excellent sources include whole grains, vegetables, fruits, legumes, and nuts. It helps you feel full and supports gut bacteria. 🌾";
    }

    if (query.includes("vitamin") || query.includes("nutrient")) {
      return "A balanced diet should provide most vitamins and minerals. Focus on eating a variety of colorful vegetables and fruits. If you have specific deficiencies, consult a healthcare provider about supplements. 🥦";
    }

    if (query.includes("water") || query.includes("hydration") || query.includes("drink")) {
      return "Staying hydrated is essential! Aim for 8 glasses (2 liters) of water daily, more if you're active. Water helps digestion, nutrient absorption, and keeps your skin healthy. 💧";
    }

    if (query.includes("breakfast") || query.includes("morning")) {
      return "A healthy breakfast jumpstarts your metabolism! Try combining protein (eggs, yogurt), whole grains (oats, whole wheat), and fruit. This combo provides sustained energy throughout the morning. 🍳";
    }

    if (query.includes("snack") || query.includes("hungry")) {
      return "Healthy snacks keep energy stable between meals. Try nuts, Greek yogurt, fruit with nut butter, veggies with hummus, or cheese with whole grain crackers. Aim for 150-200 calories per snack. 🥜";
    }

    if (query.includes("fat") || query.includes("oil")) {
      return "Not all fats are bad! Healthy fats from avocados, nuts, olive oil, and fatty fish are essential for brain health. Limit saturated fats and avoid trans fats. About 20-35% of calories should come from healthy fats. 🥑";
    }

    if (query.includes("carb") || query.includes("bread") || query.includes("pasta")) {
      return "Carbs aren't the enemy! Choose complex carbs like whole grains, quinoa, sweet potatoes, and oats. They provide sustained energy and fiber. Simple carbs (white bread, sugary snacks) cause energy spikes and crashes. 🍠";
    }

    if (query.includes("vegetarian") || query.includes("vegan") || query.includes("plant")) {
      return "Plant-based diets can be very healthy! Ensure you get enough protein from legumes, tofu, tempeh, and quinoa. Don't forget B12 supplements and iron-rich foods like spinach and lentils. 🌱";
    }

    if (query.includes("exercise") || query.includes("workout") || query.includes("gym")) {
      return "Nutrition and exercise go hand in hand! Eat protein after workouts for muscle recovery. Time your carbs around exercise for energy. Stay hydrated and don't skip meals on workout days. 🏋️";
    }

    if (query.includes("alcohol") || query.includes("drink")) {
      return "Alcohol contains empty calories (7 cal/gram) with no nutritional value. Moderate intake is key: up to 1 drink/day for women, 2 for men. Alternate alcoholic drinks with water to stay hydrated. 🍷";
    }

    // Default responses
    const defaultResponses = [
      "That's a great question about nutrition! To give you the best advice, could you be more specific? For example, ask about calories, protein, vitamins, or healthy eating tips. 🤔",
      "I'm here to help with your nutrition questions! Try asking about specific nutrients (like protein or fiber), meal planning, or healthy food choices. 💚",
      "Let me help you make healthier food choices! Ask me about sugar content, portion sizes, meal prep ideas, or any nutrition topic you're curious about. 🥗",
    ];

    const base = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    const prefsNote = buildPrefsNote(prefs);
    return `${base} ${prefsNote}`;
  };

  const buildPrefsNote = (prefs) => {
    if (!prefs) return "";
    const diet = prefs.diet && prefs.diet !== "None" ? `Diet: ${prefs.diet}.` : "";
    const filters = prefs.filters
      ? Object.keys(prefs.filters)
          .filter((k) => prefs.filters[k])
          .map((k) => k.replace(/([A-Z])/g, " $1").toLowerCase())
      : [];
    const allergens = prefs.allergens?.length ? `Allergens: ${prefs.allergens.join(", ")}.` : "";
    const filtersText = filters.length ? `Filters: ${filters.join(", ")}.` : "";
    const combined = [diet, filtersText, allergens].filter(Boolean).join(" ");
    return combined ? `Keeping in mind your prefs: ${combined}` : "";
  };

  const cleanAndSplit = (text) =>
    text
      ? text
          .split(/\n+|(?<=\.)\s+/)
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

  // Clear chat history
  const clearChat = async () => {
    const initialMsg = {
      id: "1",
      from: "bot",
      text: "Hey 👋 I'm your SnacKompare nutrition assistant. Ask me anything about healthy eating, nutrition, or food choices! ✨",
    };
    setMessages([initialMsg]);
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  };

  // Memoized message component with slide-in animation
const MessageItem = React.memo(({ item }) => {
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    if (item.from === "loading") {
      return (
        <Animated.View
          style={[
            styles.messageContainer,
            styles.botMessage,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ActivityIndicator color={palette.accent} />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          item.from === "user" ? styles.userMessage : styles.botMessage,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </Animated.View>
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.innerContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={Keyboard.dismiss}>
        <View style={styles.prefsBanner}>
          <PrefBadge label={`Diet: ${userPrefs.diet || "None"}`} />
          <PrefBadge
            label={
              "Filters: " +
              (userPrefs.filters
                ? Object.keys(userPrefs.filters)
                    .filter((k) => userPrefs.filters[k])
                    .join(", ") || "None"
                : "None")
            }
          />
          <PrefBadge
            label={
              "Allergens: " +
              (userPrefs.allergens?.length ? userPrefs.allergens.join(", ") : "None")
            }
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Nutrition Assistant</Text>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={22} color={palette.muted} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={scrollViewRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageItem item={item} />}
          style={styles.scrollView}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          bounces={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />

        <View style={styles.bottomContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Ask about nutrition..."
              placeholderTextColor={palette.muted}
              value={input}
              onChangeText={setInput}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
              multiline={false}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={loading}
              style={[styles.sendButton, loading && { opacity: 0.5 }]}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  prefBadge: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  prefText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "600",
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

const PrefBadge = ({ label }) => (
  <View style={styles.prefBadge}>
    <Text style={styles.prefText}>{label}</Text>
  </View>
);

export default AssistantScreen;
