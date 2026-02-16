import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getProfile, saveProfile } from "../services/storage";

const GOAL_OPTIONS = [
  { key: "lose", label: "Lose Weight" },
  { key: "maintain", label: "Maintain Weight" },
  { key: "gain", label: "Gain Weight" },
];

const ACTIVITY_OPTIONS = [
  { key: "sedentary", label: "Not Very Active" },
  { key: "light", label: "Lightly Active" },
  { key: "moderate", label: "Active" },
  { key: "very", label: "Very Active" },
];

const DIET_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Dairy-free"];
const ALLERGEN_OPTIONS = ["Nuts", "Dairy", "Eggs", "Gluten", "Shellfish", "Soy"];
const HEALTH_CONDITION_OPTIONS = [
  "N/A",
  "Diabetes",
  "Coeliac disease",
  "IBS",
  "High cholesterol",
  "High blood pressure",
  "Kidney disease",
  "GERD / Acid reflux",
  "Gout",
];

function clampDigitsToRange(raw, min, max) {
  const digitsOnly = (raw ?? "").replace(/\D/g, "");
  if (!digitsOnly) return "";
  const n = Number(digitsOnly);
  if (Number.isNaN(n)) return "";
  return String(Math.min(max, Math.max(min, n)));
}

export default function SettingsScreen() {
  const { user, loading: authLoading, signOut, deleteAccount } = useAuth();

  // Profile state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [goal, setGoal] = useState("maintain");
  const [activityLevel, setActivityLevel] = useState("light");

  const [dietPrefs, setDietPrefs] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [healthConditions, setHealthConditions] = useState(["N/A"]);
  const [targetChangeKg6mo, setTargetChangeKg6mo] = useState("");

  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getProfile();
    if (!data) return;

    //fields for account info
    setName(data.name || "");
    setAge(data.age != null ? String(data.age) : "");
    setHeightCm(data.heightCm != null ? String(data.heightCm) : "");
    setWeightKg(data.weightKg != null ? String(data.weightKg) : "");
    setGoal(data.goal || "maintain");
    setActivityLevel(data.activityLevel || "light");
    setTargetChangeKg6mo(
      data.targetChangeKg6mo != null ? String(data.targetChangeKg6mo) : ""
    );

    // backward compatibility for old single-value diet
    if (Array.isArray(data.dietPrefs)) {
      setDietPrefs(data.dietPrefs);
    } else if (typeof data.diet === "string" && data.diet !== "None") {
      setDietPrefs([data.diet]);
    } else {
      setDietPrefs([]);
    }

    setAllergens(Array.isArray(data.allergens) ? data.allergens : []);

    if (Array.isArray(data.healthConditions) && data.healthConditions.length) {
      setHealthConditions(data.healthConditions);
    } else {
      setHealthConditions(["N/A"]);
    }
  };

  const handleSaveProfile = async () => {
    const normalizedTargetChangeKg6mo =
      goal === "maintain"
        ? 0
        : targetChangeKg6mo === ""
        ? 0
        : Number(targetChangeKg6mo);

    const payload = {
      name,
      age: age === "" ? null : Number(age),
      heightCm: heightCm === "" ? null : Number(heightCm),
      weightKg: weightKg === "" ? null : Number(weightKg),
      goal,
      activityLevel,
      targetChangeKg6mo: normalizedTargetChangeKg6mo,
      dietPrefs,
      allergens,
      healthConditions,
    };

    const ok = await saveProfile(payload);
    setSavedNote(ok ? "Preferences saved" : "Save failed");
    setTimeout(() => setSavedNote(""), 2000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      Alert.alert("Error", "Could not sign out");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This will permanently delete your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (e) {
              Alert.prompt(
                "Confirm Password",
                "Please enter your password to delete your account.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async (password) => {
                      if (!password) return;
                      try {
                        await deleteAccount(password);
                      } catch (err) {
                        Alert.alert("Error", "Incorrect password or could not delete account.");
                      }
                    },
                  },
                ],
                "secure-text"
              );
            }
          },
        },
      ]
    );
  };

  const toggleMultiSelect = (current, setter, value) => {
    if (current.includes(value)) {
      setter(current.filter((x) => x !== value));
    } else {
      setter([...current, value]);
    }
  };

  const toggleHealthCondition = (value) => {
    setHealthConditions((prev) => {
      const has = prev.includes(value);

      if (value === "N/A") return ["N/A"];

      const withoutNA = prev.filter((x) => x !== "N/A");

      if (has) {
        const next = withoutNA.filter((x) => x !== value);
        return next.length ? next : ["N/A"];
      }

      return [...withoutNA, value];
    });
  };

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={{ gap: 12 }}>
            <View style={styles.emailRow}>
              <Ionicons name="person-circle-outline" size={22} color={palette.accent} />
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={styles.outlineButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color={palette.text} />
              <Text style={styles.outlineButtonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineButton, styles.dangerButton]} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={18} color={palette.danger} />
              <Text style={[styles.outlineButtonText, { color: palette.danger }]}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={palette.muted}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={age}
              onChangeText={(v) => setAge(clampDigitsToRange(v, 0, 120))}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              inputMode="numeric"
              placeholder="Prefer not to say"
              placeholderTextColor={palette.muted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Height (cm)</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={heightCm}
              onChangeText={(v) => setHeightCm(clampDigitsToRange(v, 0, 250))}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              inputMode="numeric"
              placeholder="Prefer not to say"
              placeholderTextColor={palette.muted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weight (kg)</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={weightKg}
              onChangeText={(v) => setWeightKg(clampDigitsToRange(v, 0, 300))}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              inputMode="numeric"
              placeholder="Prefer not to say"
              placeholderTextColor={palette.muted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goal</Text>
          <View style={styles.chipRow}>
            {GOAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, goal === opt.key && styles.chipActive]}
                onPress={() => {
                  setGoal(opt.key);
                  if (opt.key === "maintain") setTargetChangeKg6mo("0");
                  if (opt.key === "lose" && !targetChangeKg6mo) setTargetChangeKg6mo("5");
                  if (opt.key === "gain" && !targetChangeKg6mo) setTargetChangeKg6mo("3");
                }}
              >
                <Text style={goal === opt.key ? styles.chipTextActive : styles.chipText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6-month target change (kg)</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={targetChangeKg6mo}
              onChangeText={(v) => setTargetChangeKg6mo(clampDigitsToRange(v, 0, 25))}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              inputMode="numeric"
              placeholder={goal === "maintain" ? "0" : "e.g. 5"}
              placeholderTextColor={palette.muted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          {goal === "maintain" ? (
            <Text style={styles.helper}>Maintain goal sets this to 0kg.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity level</Text>
          <View style={styles.chipRow}>
            {ACTIVITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, activityLevel === opt.key && styles.chipActive]}
                onPress={() => setActivityLevel(opt.key)}
              >
                <Text style={activityLevel === opt.key ? styles.chipTextActive : styles.chipText}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary preferences</Text>
          <View style={styles.chipRow}>
            {DIET_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, dietPrefs.includes(opt) && styles.chipActive]}
                onPress={() => toggleMultiSelect(dietPrefs, setDietPrefs, opt)}
              >
                <Text style={dietPrefs.includes(opt) ? styles.chipTextActive : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens</Text>
          <View style={styles.chipRow}>
            {ALLERGEN_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, allergens.includes(opt) && styles.chipActive]}
                onPress={() => toggleMultiSelect(allergens, setAllergens, opt)}
              >
                <Text style={allergens.includes(opt) ? styles.chipTextActive : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health conditions</Text>
          <View style={styles.chipRow}>
            {HEALTH_CONDITION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, healthConditions.includes(opt) && styles.chipActive]}
                onPress={() => toggleHealthCondition(opt)}
              >
                <Text style={healthConditions.includes(opt) ? styles.chipTextActive : styles.chipText}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {savedNote ? <Text style={styles.savedNote}>{savedNote}</Text> : null}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.saveText}>Save preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: palette.card,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  helper: {
  color: palette.muted,
  marginTop: 8,
  fontSize: 12.5,
  lineHeight: 17,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipActive: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accent,
  },
  chipText: { color: palette.muted, fontWeight: "600" },
  chipTextActive: { color: palette.text, fontWeight: "700" },
  inputRow: {
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    color: palette.text,
    fontSize: 15,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emailText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "600",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.text,
  },
  dangerButton: {
    borderColor: palette.danger,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    backgroundColor: palette.accent,
    borderRadius: 12,
    gap: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  savedNote: {
    textAlign: "center",
    color: palette.muted,
    marginBottom: 10,
  },
});
