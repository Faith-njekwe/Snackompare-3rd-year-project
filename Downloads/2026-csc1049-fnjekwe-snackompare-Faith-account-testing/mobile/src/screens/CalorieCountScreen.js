import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Progress from "react-native-progress";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { palette } from "../theme";
import { useCalorieTotal } from "../context/CalorieTotalContext";
import { loadUserData, saveUserData } from "../services/userData";

const ITEMS_KEY = "@snackompare_calorie_items";
const GOAL_KEY = "@snackompare_calorie_goal";
const DEFAULT_ITEM = { id: "seed", food: "", caloriesText: "" };
const LOG_TAG = "[CalorieTracker]";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function CalorieTrackerScreen({ navigation, route }) {
  const [goalText, setGoalText] = useState("2000");
  const { extraCalories } = useCalorieTotal();
  const [items, setItems] = useState([DEFAULT_ITEM]);
  const [loaded, setLoaded] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const saveTimer = useRef(null);
  const hydratedOnce = useRef(false);

  // Helper to append a product to the list and persist immediately
  const appendProduct = useCallback((product) => {
    if (!product) return;
    setItems((prev) => {
      const cleaned = prev.filter(
        (p) => !(p.id === DEFAULT_ITEM.id && !p.food && !p.caloriesText)
      );
      const next = [
        ...cleaned,
        {
          id: makeId(),
          food: product.name,
          caloriesText: String(Math.round(product.calories || 0)),
        },
      ];
      console.log(`${LOG_TAG} append product`, product, "next count", next.length);
      // Persist immediately to avoid loss on remount
      saveUserData(ITEMS_KEY, next);
      return next;
    });
  }, []);

  // Load persisted items and goal on mount
  useEffect(() => {
    (async () => {
      try {
        const [storedItems, storedGoal] = await Promise.all([
          loadUserData(ITEMS_KEY, null),
          loadUserData(GOAL_KEY, null),
        ]);

        setItems((prev) => {
          const base = Array.isArray(storedItems) && storedItems.length ? storedItems : prev;
          console.log(`${LOG_TAG} hydrate items`, { count: base.length });
          hydratedOnce.current = true;
          return base;
        });

        if (storedGoal) setGoalText(String(storedGoal));
      } catch (err) {
        console.log(`${LOG_TAG} hydrate error`, err?.message);
      }
      setLoaded(true);
    })();
  }, []);

  // Debounced save on change
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserData(ITEMS_KEY, items);
      saveUserData(GOAL_KEY, goalText);
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [items, goalText, loaded]);

  // Capture incoming product params; wait for hydration to finish, then append once
  useEffect(() => {
    if (!route.params?.product) return;
    setPendingProduct(route.params.product);
    // Clear param so it doesn't re-fire
    navigation.setParams({ product: undefined });
  }, [route.params?.product, navigation]);

  useEffect(() => {
    if (!loaded || !pendingProduct) return;
    appendProduct(pendingProduct);
    setPendingProduct(null);
  }, [loaded, pendingProduct, appendProduct]);

  // Prevent late hydration from overwriting newly added items:
  useEffect(() => {
    if (!loaded) return;
    // Once loaded and we have more than placeholder, lock hydration flag
    if (items.length > 0 && !(items.length === 1 && items[0].id === DEFAULT_ITEM.id)) {
      hydratedOnce.current = true;
    }
  }, [items, loaded]);

  // Debug log whenever items change (during dev)
  useEffect(() => {
    console.log(`${LOG_TAG} items`, items);
  }, [items]);

  const manualTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const cals = Number(item.caloriesText);
      return sum + (Number.isFinite(cals) ? cals : 0);
    }, 0);
  }, [items]);

  const totalCalories = manualTotal + (Number(extraCalories) || 0);

  const goal = Number(goalText) || 0;
  const percentage_goal = goal > 0 ? totalCalories / goal : 0;
  const progress = goal > 0 ? Math.min(totalCalories / goal, 1) : 0;
  const remaining = Math.max(goal - totalCalories, 0);
  const isOverGoal = percentage_goal > 1;

  const addItem = () => {
    setItems((prev) => [...prev, { id: makeId(), food: "", caloriesText: "" }]);
  };

  const updateFood = (id, food) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, food } : item)));
  };

  const updateCalories = (id, text) => {
    const cleaned = text.replace(/[^\d]/g, "");
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caloriesText: cleaned } : item))
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Progress Card */}
        <View style={styles.card}>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Progress.Circle
              size={120}
              thickness={10}
              progress={progress}
              showsText
              formatText={() => `${Math.round(progress * 100)}%`}
              color={isOverGoal ? "#E53935" : palette.accent}
              unfilledColor={palette.border}
              borderWidth={0}
            />
            <Text style={styles.ringLabel}>Goal progress</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.bigNumber}>{Math.round(totalCalories)} kcal</Text>
            <Text style={styles.muted}>Consumed today</Text>

            {extraCalories > 0 && (
              <Text style={[styles.muted, { marginTop: 4 }]}>
                + Photo meals: {Math.round(extraCalories)} kcal
              </Text>
            )}

            <View style={{ height: 10 }} />

            <Text style={styles.rowText}>
              Goal: <Text style={styles.rowStrong}>{goal || 0} kcal</Text>
            </Text>
            <Text style={styles.rowText}>
              Left: <Text style={styles.rowStrong}>{Math.round(remaining)} kcal</Text>
            </Text>
          </View>
        </View>

        <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>Daily goal</Text>

            <View style={styles.goalRight}>
                <View style={[styles.boxInput, styles.goalBox]}>
                <TextInput
                    value={goalText}
                    onChangeText={(t) => setGoalText(t.replace(/[^\d]/g, ""))}
                    keyboardType="number-pad"
                    style={styles.boxTextInput}
                    placeholder="2000"
                    placeholderTextColor={palette.muted}
                />
                <Text style={styles.boxUnit}>kcal</Text>
                </View>
            </View>
        </View>


        <View style={{ height: 30 }} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Foods eaten</Text>

          <TouchableOpacity onPress={addItem} style={styles.addBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productBtnRow}>
          <TouchableOpacity
            style={styles.productBtn}
            onPress={() => navigation.navigate("CalorieSearch", { fromCalorieTracker: true })}
          >
            <Ionicons name="search-outline" size={18} color={palette.accent} />
            <Text style={styles.productBtnText}>Search Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.productBtn}
            onPress={() => navigation.navigate("CalorieScan", { fromCalorieTracker: true })}
          >
            <Ionicons name="barcode-outline" size={18} color={palette.accent} />
            <Text style={styles.productBtnText}>Scan Barcode</Text>
          </TouchableOpacity>
        </View>

        {/* Rows */}
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            {/* Food input */}
            <View style={[styles.boxInput, styles.foodBox]}>
              <TextInput
                value={item.food}
                onChangeText={(t) => updateFood(item.id, t)}
                placeholder="Food (e.g. Banana)"
                placeholderTextColor={palette.muted}
                style={[styles.boxTextInput, { textAlign: "left" }]}
              />
            </View>

            {/* Calories input (number) */}
            <View style={[styles.boxInput, styles.calBox]}>
              <TextInput
                value={item.caloriesText}
                onChangeText={(t) => updateCalories(item.id, t)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={palette.muted}
                style={styles.boxTextInput}
              />
              <Text style={styles.boxUnit}>kcal</Text>
            </View>

            {/* Remove food item */}
            <TouchableOpacity
              onPress={() => removeItem(item.id)}
              disabled={items.length === 1}
              style={[styles.removeBtn, items.length === 1 && { opacity: 0.35 }]}
            >
              <Ionicons name="trash-outline" size={18} color={palette.text} />
            </TouchableOpacity>
          </View>
        ))}

        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },

  title: { fontSize: 28, fontWeight: "800", color: palette.text, marginBottom: 12 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  backText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
    alignItems: "center",
  },

  ringLabel: { marginTop: 8, color: palette.muted, fontSize: 12 },

  bigNumber: { fontSize: 22, fontWeight: "800", color: palette.text },
  muted: { color: palette.muted, marginTop: 2 },

  rowText: { color: palette.text, marginTop: 4 },
  rowStrong: { fontWeight: "800" },

  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  goalRight: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  goalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalLabel: { color: palette.muted, fontWeight: "600" },

  boxInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: palette.surface,
  },
  boxTextInput: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.text,
    textAlign: "right",
    minWidth: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
    flex: 1,
  },
  boxUnit: { fontSize: 13, color: palette.muted, marginLeft: 6 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: palette.text },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },

  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },

   goalBox: {
    width: 140,
    backgroundColor: palette.surface,
  },

  foodBox: { flex: 1, backgroundColor: palette.card },
  calBox: { width: 104, backgroundColor: palette.card },

  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: "center",
    justifyContent: "center",
  },

  totalBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  totalCalories: { fontSize: 20, fontWeight: "800", color: palette.text },

  productBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  productBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.accent,
    backgroundColor: palette.card,
  },
  productBtnText: {
    color: palette.accent,
    fontWeight: "600",
    fontSize: 13,
  },
});
