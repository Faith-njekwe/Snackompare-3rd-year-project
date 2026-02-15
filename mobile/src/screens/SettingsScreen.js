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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { useAuth } from "../context/AuthContext";
import { getProfile, saveProfile } from "../services/storage";

const dietOptions = ["None", "Vegan", "Vegetarian", "Pescatarian", "Keto", "Low-carb"];
const exerciseOptions = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];
const sugarOptions = ["Any", "Low", "Very Low"];
const saltOptions = ["Any", "Low", "Very Low"];
const proteinOptions = ["Standard", "High", "Very High"];
const filterOptions = [
  { key: "lowSugar", label: "Low sugar" },
  { key: "lowSalt", label: "Low salt" },
  { key: "highProtein", label: "High protein" },
];
const allergenOptions = ["Gluten", "Dairy", "Peanuts", "Tree nuts", "Soy", "Egg", "Shellfish"];

export default function SettingsScreen() {
  const { user, loading: authLoading, signOut, deleteAccount } = useAuth();

  // Profile state
  const [name, setName] = useState("");
  const [diet, setDiet] = useState("None");
  const [exerciseLevel, setExerciseLevel] = useState("Sedentary");
  const [sugarTolerance, setSugarTolerance] = useState("Any");
  const [saltTolerance, setSaltTolerance] = useState("Any");
  const [proteinTarget, setProteinTarget] = useState("Standard");
  const [filters, setFilters] = useState({ lowSugar: false, lowSalt: false, highProtein: false });
  const [allergens, setAllergens] = useState([]);
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getProfile();
    if (data) {
      setName(data.name || "");
      setDiet(data.diet || "None");
      setExerciseLevel(data.exerciseLevel || "Sedentary");
      setSugarTolerance(data.sugarTolerance || "Any");
      setSaltTolerance(data.saltTolerance || "Any");
      setProteinTarget(data.proteinTarget || "Standard");
      setFilters(data.filters || { lowSugar: false, lowSalt: false, highProtein: false });
      setAllergens(data.allergens || []);
    }
  };

  const handleSaveProfile = async () => {
    const payload = {
      name,
      diet,
      exerciseLevel,
      sugarTolerance,
      saltTolerance,
      proteinTarget,
      filters,
      allergens,
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
              // Firebase requires recent login — ask for password to re-authenticate
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

  const toggleFilter = (key) => setFilters({ ...filters, [key]: !filters[key] });

  const toggleAllergen = (item) => {
    if (allergens.includes(item)) {
      setAllergens(allergens.filter((a) => a !== item));
    } else {
      setAllergens([...allergens, item]);
    }
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
      <ScrollView contentContainerStyle={styles.content}>
        {/* ---- Account Section ---- */}
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

        {/* ---- Profile Section ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={palette.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary preference</Text>
          <View style={styles.chipRow}>
            {dietOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, diet === opt && styles.chipActive]}
                onPress={() => setDiet(opt)}
              >
                <Text style={diet === opt ? styles.chipTextActive : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise level</Text>
          <View style={styles.chipRow}>
            {exerciseOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, exerciseLevel === opt && styles.chipActive]}
                onPress={() => setExerciseLevel(opt)}
              >
                <Text style={exerciseLevel === opt ? styles.chipTextActive : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sugar tolerance</Text>
          <View style={styles.chipRow}>
            {sugarOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, sugarTolerance === opt && styles.chipActive]}
                onPress={() => setSugarTolerance(opt)}
              >
                <Text style={sugarTolerance === opt ? styles.chipTextActive : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salt tolerance</Text>
          <View style={styles.chipRow}>
            {saltOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, saltTolerance === opt && styles.chipActive]}
                onPress={() => setSaltTolerance(opt)}
              >
                <Text style={saltTolerance === opt ? styles.chipTextActive : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protein target</Text>
          <View style={styles.chipRow}>
            {proteinOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, proteinTarget === opt && styles.chipActive]}
                onPress={() => setProteinTarget(opt)}
              >
                <Text style={proteinTarget === opt ? styles.chipTextActive : styles.chipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health filters</Text>
          <View style={styles.chipRow}>
            {filterOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, filters[opt.key] && styles.chipActive]}
                onPress={() => toggleFilter(opt.key)}
              >
                <Text style={filters[opt.key] ? styles.chipTextActive : styles.chipText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens</Text>
          <View style={styles.chipRow}>
            {allergenOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, allergens.includes(opt) && styles.chipActive]}
                onPress={() => toggleAllergen(opt)}
              >
                <Text style={allergens.includes(opt) ? styles.chipTextActive : styles.chipText}>{opt}</Text>
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
  authButtons: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
  errorText: {
    color: palette.danger,
    fontSize: 13,
    textAlign: "center",
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
