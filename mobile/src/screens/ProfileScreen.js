import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palette } from "../theme";

export default function ProfileScreen() {
  const dietOptions = ["None", "Vegan", "Vegetarian", "Pescatarian", "Keto", "Low-carb"];
  const filterOptions = [
    { key: "lowSugar", label: "Low sugar" },
    { key: "lowSalt", label: "Low salt" },
    { key: "highProtein", label: "High protein" },
  ];
  const allergenOptions = ["Gluten", "Dairy", "Peanuts", "Tree nuts", "Soy", "Egg", "Shellfish"];

  const [name, setName] = useState("Taylor");
  const [diet, setDiet] = useState("None");
  const [filters, setFilters] = useState({ lowSugar: false, lowSalt: false, highProtein: false });
  const [allergens, setAllergens] = useState([]);
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const stored = await AsyncStorage.getItem("profilePrefs");
      if (stored) {
        const parsed = JSON.parse(stored);
        setName(parsed.name || "Taylor");
        setDiet(parsed.diet || "None");
        setFilters(parsed.filters || filters);
        setAllergens(parsed.allergens || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const savePrefs = async () => {
    const payload = { name, diet, filters, allergens };
    try {
      await AsyncStorage.setItem("profilePrefs", JSON.stringify(payload));
      setSavedNote("Preferences saved");
      setTimeout(() => setSavedNote(""), 2000);
    } catch (e) {
      setSavedNote("Save failed");
    }
  };

  const toggleFilter = (key) => {
    const next = { ...filters, [key]: !filters[key] };
    setFilters(next);
  };

  const toggleAllergen = (item) => {
    if (allergens.includes(item)) {
      setAllergens(allergens.filter((a) => a !== item));
    } else {
      setAllergens([...allergens, item]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={palette.accent} />
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userGoal}>Lean & Balanced</Text>
          <View style={styles.summaryBadges}>
            <Text style={styles.badge}>Diet: {diet}</Text>
            <Text style={styles.badge}>
              Filters:{" "}
              {Object.keys(filters)
                .filter((k) => filters[k])
                .map((k) => filterOptions.find((f) => f.key === k)?.label || k)
                .join(", ") || "None"}
            </Text>
            <Text style={styles.badge}>
              Allergens: {allergens.length ? allergens.join(", ") : "None"}
            </Text>
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

        <TouchableOpacity style={styles.saveButton} onPress={savePrefs}>
          <Ionicons name="save-outline" size={20} color={palette.text} />
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
  },
  profileCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.text,
    marginBottom: 4,
  },
  userGoal: {
    fontSize: 16,
    color: palette.muted,
  },
  summaryBadges: {
    marginTop: 12,
    gap: 6,
    width: "100%",
  },
  badge: {
    textAlign: "center",
    color: palette.text,
    backgroundColor: palette.accentSoft,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: palette.border,
    fontSize: 13,
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
  saveButton: {
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
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
  },
  savedNote: {
    textAlign: "center",
    color: palette.muted,
    marginBottom: 10,
  },
});
