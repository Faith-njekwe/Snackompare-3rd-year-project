import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut, deleteUser } from "firebase/auth";
import { deleteDoc, doc, getDocs, collection } from "firebase/firestore";
import { auth, API_BASE_URL, db } from "../config";
import { loadUserData, saveUserData, deleteAllUserData } from "../services/userData";
import { palette, shadows } from "../theme";

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
  const toastAnim = useRef(new Animated.Value(-60)).current;

  const userEmail = auth.currentUser?.email || "Guest user";

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const stored = await loadUserData("profilePrefs", null);
      if (stored) {
        setName(stored.name || "Taylor");
        setDiet(stored.diet || "None");
        setFilters(stored.filters || filters);
        setAllergens(stored.allergens || []);
      }
    } catch (e) {}
  };

  const showToast = () => {
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 12, useNativeDriver: true, damping: 15 }),
      Animated.delay(1800),
      Animated.timing(toastAnim, { toValue: -60, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const savePrefs = async () => {
    const payload = { name, diet, filters, allergens };
    try {
      await saveUserData("profilePrefs", payload);
      showToast();

      // Sync to backend
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          await fetch(`${API_BASE_URL}/api/profile/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, ...payload }),
          });
        } catch (e) {}
      }
    } catch (e) {
      Alert.alert("Save failed", "Could not save your preferences.");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut(auth) },
    ]);
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      "Delete account",
      "This will remove your account, favourites, and profile data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove favourites subcollection and profile doc (best-effort)
              try {
                const favSnap = await getDocs(collection(db, "users", user.uid, "favorites"));
                await Promise.all(favSnap.docs.map((d) => deleteDoc(d.ref)));
              } catch (_) {}

              await deleteAllUserData(user.uid);

              await deleteDoc(doc(db, "users", user.uid)).catch(() => {});

              // Delete auth user
              await deleteUser(user);
            } catch (e) {
              Alert.alert("Delete failed", e?.message || "Could not delete account.");
            }
          },
        },
      ]
    );
  };

  const toggleFilter = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleAllergen = (item) => {
    setAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast notification */}
      <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        <Text style={styles.toastText}>Preferences saved!</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={palette.accent} />
            </View>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
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

        {/* Name section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <Text style={styles.sectionSubtitle}>How should we address you?</Text>
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

        {/* Diet section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary preference</Text>
          <Text style={styles.sectionSubtitle}>Select your primary diet type</Text>
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

        {/* Filters section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health filters</Text>
          <Text style={styles.sectionSubtitle}>Highlight products that match these criteria</Text>
          <View style={styles.chipRow}>
            {filterOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.chip, filters[opt.key] && styles.chipActive]}
                onPress={() => toggleFilter(opt.key)}
              >
                <Text style={filters[opt.key] ? styles.chipTextActive : styles.chipText}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergens section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens</Text>
          <Text style={styles.sectionSubtitle}>Flag products containing these allergens</Text>
          <View style={styles.chipRow}>
            {allergenOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, allergens.includes(opt) && styles.chipActive]}
                onPress={() => toggleAllergen(opt)}
              >
                <Text style={allergens.includes(opt) ? styles.chipTextActive : styles.chipText}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveButton} onPress={savePrefs}>
          <Ionicons name="save-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveText}>Save preferences</Text>
        </TouchableOpacity>

        {/* Sign out button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={palette.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
  toast: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 100,
    ...shadows.elevated,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  profileCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows.card,
  },
  avatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: 4,
  },
  userGoal: {
    fontSize: 14,
    color: palette.accent,
    fontWeight: "600",
  },
  summaryBadges: {
    marginTop: 16,
    gap: 6,
    width: "100%",
  },
  badge: {
    textAlign: "center",
    color: palette.text,
    backgroundColor: palette.accentSoft,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: palette.border,
    fontSize: 13,
  },
  section: {
    backgroundColor: palette.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.muted,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipText: { color: palette.muted, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "700" },
  inputRow: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    color: palette.text,
    fontSize: 15,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: palette.accent,
    borderRadius: 16,
    gap: 10,
    ...shadows.card,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: palette.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.danger,
    gap: 10,
    marginTop: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.danger,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: palette.danger,
    borderRadius: 16,
    gap: 10,
    marginTop: 12,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
