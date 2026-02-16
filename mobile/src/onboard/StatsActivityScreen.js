import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";


const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "Not Very Active", desc: "Mostly sitting (e.g., desk job)" },
  { key: "light", label: "Lightly Active", desc: "Some walking (e.g., teacher, retail)" },
  { key: "moderate", label: "Active", desc: "Regular movement / exercise" },
  { key: "very", label: "Very Active", desc: "Intense activity most days" },
];

function clampNumber(val, { min, max }) {
  if (val === "" || val == null) return "";
  const n = Number(val);
  if (Number.isNaN(n)) return "";
  return String(Math.min(max, Math.max(min, n)));
}

export default function StatsActivityScreen({ navigation, route }) {
  const existing = route?.params?.onboarding ?? {};

  const [activity, setActivity] = useState(existing.activityLevel ?? "light"); // default
  const [age, setAge] = useState(existing.age != null ? String(existing.age) : "");
  const [heightCm, setHeightCm] = useState(existing.heightCm != null ? String(existing.heightCm) : "");
  const [weightKg, setWeightKg] = useState(existing.weightKg != null ? String(existing.weightKg) : "");

  function buildPayload() {
    return {
      ...existing,
      activityLevel: activity,
      age: age === "" ? null : Number(age),
      heightCm: heightCm === "" ? null : Number(heightCm),
      weightKg: weightKg === "" ? null : Number(weightKg),
    };
  }

  /*
  function handleSkip() {
    navigation.replace("Home");
  } */

  function handleNext() {
    const payload = buildPayload();
    navigation.navigate("OnboardingDiet", { onboarding: payload });
  }

  function handleBack() {
    navigation.goBack();
  }

  return (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
  >

    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How active are you?</Text>

        {ACTIVITY_LEVELS.map((a) => {
          const active = activity === a.key;
          return (
            <Pressable
              key={a.key}
              onPress={() => setActivity(a.key)}
              style={[styles.activityCard, active && styles.activityCardActive]}
            >
              <Text style={[styles.activityTitle, active && styles.activityTitleActive]}>
                {a.label}
              </Text>
              <Text style={styles.activityDesc}>{a.desc}</Text>
            </Pressable>
          );
        })}

        <Text style={[styles.helper, { marginTop: 10 }]}>
          Used to estimate your daily calories. You can change this later.
        </Text>

        <View style={{ height: 18 }} />

        <Text style={styles.sectionTitle}>Your stats (optional)</Text>

        <Text style={styles.label}>Age</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={age}
            onChangeText={(v) => {
              const digitsOnly = v.replace(/\D/g, "");
              setAge(clampNumber(digitsOnly, { min: 0, max: 120 }));
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="Prefer not to say"
            placeholderTextColor={palette.muted}
            style={styles.input}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        <Text style={[styles.label, { marginTop: 10 }]}>Height (cm)</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={heightCm}
            onChangeText={(v) => {
              const digitsOnly = v.replace(/\D/g, "");
              setHeightCm(clampNumber(digitsOnly, { min: 0, max: 250 }));
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="Prefer not to say"
            placeholderTextColor={palette.muted}
            style={styles.input}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        <Text style={[styles.label, { marginTop: 10 }]}>Weight (kg)</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={weightKg}
            onChangeText={(v) => {
              const digitsOnly = v.replace(/\D/g, "");
              setWeightKg(clampNumber(digitsOnly, { min: 0, max: 300 }));
            }}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
            inputMode="numeric"
            placeholder="Prefer not to say"
            placeholderTextColor={palette.muted}
            style={styles.input}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        <Text style={[styles.helper, { marginTop: 8 }]}>
          It's ok to estimate — you can update this later.
        </Text>
      </View>

      {/* spacer so content doesn't hide behind bottom button */}
      <View style={{ height: 90 }} />
    </ScrollView>

    <View style={styles.bottomBar}>
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          const payload = buildPayload();
          navigation.navigate("OnboardingDiet", { onboarding: payload });
        }}
        style={styles.nextBtn}
      >
        <Text style={styles.nextBtnText}>Next page</Text>
        <Ionicons name="arrow-forward" size={18} color={palette.bg} />
      </Pressable>
    </View>
  </KeyboardAvoidingView>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  
  content: {
  padding: 16,
  alignItems: "center",
  },

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
  progressFill: { height: 3, borderRadius: 999, backgroundColor: palette.accent },

  section: {
  width: "100%",
  maxWidth: 480,
  backgroundColor: palette.card,
  borderRadius: 18,
  padding: 16,
  borderWidth: 0,
  },

  sectionTitle: { paddingTop: 20, fontSize: 20, fontWeight: "900", color: palette.text, marginBottom: 10 },
  label: { color: palette.muted, fontWeight: "800", fontSize: 13, marginBottom: 6 },
  helper: { color: palette.muted, marginTop: 6, fontSize: 12.5, lineHeight: 17 },

  activityCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: 10,
  },
  activityCardActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent },
  activityTitle: { color: palette.text, fontWeight: "900", marginBottom: 4 },
  activityTitleActive: { color: palette.text },
  activityDesc: { color: palette.muted, fontSize: 12.5, lineHeight: 16 },

  inputRow: {
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { color: palette.text, fontSize: 15 },

  bottomBar: {
  paddingHorizontal: 16,
  paddingBottom: Platform.OS === "ios" ? 22 : 14,
  paddingTop: 10,
  backgroundColor: palette.bg,
  borderTopWidth: 1,
  borderTopColor: palette.border,
  },

  nextBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  nextBtnText: {
    color: palette.bg,
    fontWeight: "900",
    fontSize: 16,
  },

});
