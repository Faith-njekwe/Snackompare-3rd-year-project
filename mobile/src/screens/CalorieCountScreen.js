import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Progress from "react-native-progress";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { useCalorieTotal } from "../context/CalorieTotalContext";
import { getCalorieLog, saveCalorieLog } from "../services/storage";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export default function CalorieTrackerScreen() {
  const [goalText, setGoalText] = useState("2000");
  const { extraCalories, pendingFoodItems, consumePendingItems } = useCalorieTotal();

  const [items, setItems] = useState([
    { id: makeId(), food: "", caloriesText: "" },
  ]);

  const [loaded, setLoaded] = useState(false);

  // Load saved calorie log on mount
  useEffect(() => {
    getCalorieLog().then((saved) => {
      if (saved) {
        setGoalText(saved.goalText ?? "2000");
        if (saved.items.length > 0) {
          setItems(saved.items);
        }
      }
      setLoaded(true);
    });
  }, []);

  // Persist calorie log on changes (debounced)
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      saveCalorieLog(goalText, items);
    }, 500);
    return () => clearTimeout(timer);
  }, [goalText, items, loaded]);

  const prevPendingLen = useRef(0);

  useEffect(() => {
    if (pendingFoodItems.length === 0 || pendingFoodItems.length === prevPendingLen.current) return;
    prevPendingLen.current = pendingFoodItems.length;

    const consumed = consumePendingItems();
    if (consumed.length === 0) return;

    const newRows = consumed.map((fi) => ({
      id: makeId(),
      food: fi.name,
      caloriesText: String(fi.calories),
    }));

    setItems((prev) => {
      const isDefaultEmpty =
        prev.length === 1 && prev[0].food === "" && prev[0].caloriesText === "";
      return isDefaultEmpty ? newRows : [...prev, ...newRows];
    });
  }, [pendingFoodItems, consumePendingItems]);

  //const totalCalories = useMemo(() => {
   // return items.reduce((sum, item) => {
     // const cals = Number(item.caloriesText);
     // return sum + (Number.isFinite(cals) ? cals : 0);
   // }, 0);
  //}, [items]);

  const manualTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const cals = Number(item.caloriesText);
      return sum + (Number.isFinite(cals) ? cals : 0);
    }, 0);
  }, [items]);

  const totalCalories = manualTotal;


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
    const cleaned = text.replace(/[^\d]/g, ""); // numbers only
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caloriesText: cleaned } : item))
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },

  title: { fontSize: 28, fontWeight: "800", color: palette.text, marginBottom: 12 },

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
});
