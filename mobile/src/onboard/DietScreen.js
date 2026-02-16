import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { saveProfile, setOnboardingCompleteInCloud } from "../services/storage";

const DIET_PREFS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Dairy-free"];
const ALLERGENS = ["Nuts", "Dairy", "Eggs", "Gluten", "Shellfish", "Soy"];
const HEALTH_CONDITIONS = [
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

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}


export default function DietScreen({ navigation, route, onComplete }) {
  const existing = route?.params?.onboarding ?? {};

  const [dietPrefs, setDietPrefs] = useState(existing.dietPrefs ?? []);
  const [allergens, setAllergens] = useState(existing.allergens ?? []);
  const [healthConditions, setHealthConditions] = useState(
    existing.healthConditions?.length ? existing.healthConditions : ["N/A"]
  );

  // Select/deselect health conditions; default falls back to N/A if none selected
  function toggleCondition(label) {
    setHealthConditions((prev) => {
      const has = prev.includes(label);

      if (label === "N/A") return ["N/A"];

      const withoutNA = prev.filter((x) => x !== "N/A");

      if (has) {
        const next = withoutNA.filter((x) => x !== label);
        return next.length ? next : ["N/A"];
      }

      return [...withoutNA, label];
    });
  }


  function handleBack() {
    navigation.goBack();
  }

  async function handleFinish() {
  // Build profile in the same shape as SettingScreen
  const profilePayload = {
    name: existing.firstName ?? "",
    gender: existing.gender ?? "prefer_not",
    goal: existing.goal ?? "maintain",
    activityLevel: existing.activityLevel ?? "light",
    age: existing.age ?? null,
    heightCm: existing.heightCm ?? null,
    weightKg: existing.weightKg ?? null,
    targetChangeKg6mo: existing.targetChangeKg6mo ?? 0,

    dietPrefs,
    allergens,
    healthConditions,
  };

  // 1) Save profile first (AsyncStorage + Firestore when signed in)
  const saved = await saveProfile(profilePayload);
  if (!saved) {
    Alert.alert("Error", "Could not save onboarding profile. Please try again.");
    return;
  }

  // 2) Then mark onboarding complete in Firestore
  const ok = await setOnboardingCompleteInCloud(true);
  if (!ok) {
    Alert.alert("Error", "Could not complete onboarding. Please try again.");
    return;
  }

  onComplete?.();
}



  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary preferences</Text>
          <View style={styles.chipRow}>
            {DIET_PREFS.map((d) => {
              const active = dietPrefs.includes(d);
              return (
                <Chip
                  key={d}
                  label={d}
                  active={active}
                  onPress={() =>
                    setDietPrefs((prev) => (active ? prev.filter((x) => x !== d) : [...prev, d]))
                  }
                />
              );
            })}
          </View>

          <View style={{ height: 18 }} />

          <Text style={styles.sectionTitle}>Allergens</Text>
          <View style={styles.chipRow}>
            {ALLERGENS.map((a) => {
              const active = allergens.includes(a);
              return (
                <Chip
                  key={a}
                  label={a}
                  active={active}
                  onPress={() =>
                    setAllergens((prev) => (active ? prev.filter((x) => x !== a) : [...prev, a]))
                  }
                />
              );
            })}
          </View>

          <View style={{ height: 18 }} />
          <Text style={styles.sectionTitle}>Health conditions</Text>
          <View style={styles.chipRow}>
            {HEALTH_CONDITIONS.map((c) => {
              const active = healthConditions.includes(c);
              return (
                <Chip
                  key={c}
                  label={c}
                  active={active}
                  onPress={() => toggleCondition(c)}
                />
              );
            })}
          </View>         

          <Text style={[styles.helper, { marginTop: 12 }]}>
            This helps tailor chatbot suggestions and food recommendations.
          </Text>

          <Pressable onPress={handleFinish} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Finish</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, paddingBottom: 28 },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topTitle: { color: palette.text, fontSize: 16, fontWeight: "800" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  skipText: { color: palette.muted, fontWeight: "800", fontSize: 13 },
  progressTrack: {
    marginTop: 10,
    height: 3,
    borderRadius: 999,
    backgroundColor: palette.border,
    overflow: "hidden",
  },

  section: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0,
  },
  sectionTitle: { paddingTop: 30, fontSize: 26, fontWeight: "900", color: palette.text, marginBottom: 10 },
  helper: { color: palette.muted, marginTop: 6, fontSize: 12.5, lineHeight: 17 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent },
  chipText: { color: palette.muted, fontWeight: "700" },
  chipTextActive: { color: palette.text, fontWeight: "900" },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: palette.bg, fontWeight: "900", fontSize: 15 },
});
