import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";

const GOALS = [
  { key: "lose", label: "Lose Weight" },
  { key: "maintain", label: "Maintain Weight" },
  { key: "gain", label: "Gain Weight" },
];

const GENDERS = [
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
  { key: "other", label: "Other" },
  { key: "prefer_not", label: "Prefer not to say" },
];

function clampNumber(val, { min, max }) {
  if (val === "" || val == null) return "";
  const n = Number(val);
  if (Number.isNaN(n)) return "";
  return String(Math.min(max, Math.max(min, n)));
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function GoalScreen({ navigation, route }) {
  const existing = route?.params?.onboarding ?? {};

  const [firstName, setFirstName] = useState(existing.firstName ?? "");
  const [gender, setGender] = useState(existing.gender ?? "prefer_not");
  const [goal, setGoal] = useState(existing.goal ?? "maintain");
  const [targetChangeKg, setTargetChangeKg] = useState(
    existing.targetChangeKg6mo != null ? String(existing.targetChangeKg6mo) : "0"
  );

  function buildPayload() {
    return {
      firstName: firstName.trim(),
      gender,
      goal,
      targetChangeKg6mo: goal === "maintain" ? 0 : Number(targetChangeKg || 0),
    };
  }

  function handleNext() {
    Keyboard.dismiss();
    const payload = buildPayload();
    navigation.navigate("OnboardingStatsActivity", { onboarding: payload });
  }

  const showKgInput = goal === "lose" || goal === "gain";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is your goal?</Text>

          <Text style={styles.label}>First name (optional)</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="e.g., Aoife"
              placeholderTextColor={palette.muted}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Gender (optional)</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => (
              <Chip
                key={g.key}
                label={g.label}
                active={gender === g.key}
                onPress={() => setGender(g.key)}
              />
            ))}
          </View>

          <View style={{ height: 14 }} />

          {GOALS.map((g) => {
            const active = goal === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => {
                  setGoal(g.key);
                  if (g.key === "maintain") setTargetChangeKg("0");
                  if (g.key === "lose" && targetChangeKg === "0") setTargetChangeKg("5");
                  if (g.key === "gain" && targetChangeKg === "0") setTargetChangeKg("3");
                }}
                style={[styles.choiceBtn, active && styles.choiceBtnActive]}
              >
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                  {g.label}
                </Text>
              </Pressable>
            );
          })}

          {showKgInput && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.label}>
                How many kg do you want to {goal === "lose" ? "lose" : "gain"} in 6 months?
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  value={targetChangeKg}
                  onChangeText={(v) => {
                    // digits-only (no decimals, no commas, no symbols)
                    const digitsOnly = v.replace(/\D/g, "");
                    setTargetChangeKg(clampNumber(digitsOnly, { min: 0, max: 25 }));
                  }}
                  keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                  inputMode="numeric"
                  placeholder="e.g., 5"
                  placeholderTextColor={palette.muted}
                  style={styles.input}
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <Text style={styles.helper}>You can change this later. (kg)</Text>
            </View>
          )}

          {goal === "maintain" && (
            <Text style={[styles.helper, { marginTop: 10 }]}>
              Maintain sets your 6-month target to 0kg.
            </Text>
          )}
        </View>

        {/* spacer so the bottom button doesn't overlap with content */}
        <View style={{ height: 40}} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>Next page</Text>
          <Ionicons name="arrow-forward" size={18} color={palette.bg} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },

  // centers the card
  scrollContent: {
    padding: 16,
    alignItems: "center",
  },

  section: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0,
  },

  sectionTitle: {
    paddingTop: 30,
    fontSize: 26,
    fontWeight: "900",
    color: palette.text,
    marginBottom: 12,
  },

  label: { color: palette.muted, fontWeight: "800", fontSize: 13, marginBottom: 6 },
  helper: { color: palette.muted, marginTop: 6, fontSize: 12.5, lineHeight: 17 },

  inputRow: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { color: palette.text, fontSize: 15 },

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

  choiceBtn: {
    marginTop: 10,
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  choiceBtnActive: { backgroundColor: palette.accentSoft, borderColor: palette.accent },
  choiceText: { color: palette.text, fontWeight: "800", textAlign: "center" },
  choiceTextActive: { color: palette.text },

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
