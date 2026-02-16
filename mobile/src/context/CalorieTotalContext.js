import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

//global container all screens can access
const CalorieTotalContext = createContext(null);

export function CalorieTotalProvider({ children }) {
  const [extraCalories, setExtraCalories] = useState(0); // calories added from a photo
  const [pendingFoodItems, setPendingFoodItems] = useState([]); // items queued from favourites

  const addCalories = useCallback((amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return;
    setExtraCalories((prev) => prev + Math.max(0, Math.round(n)));
  }, []);

  const resetCalories = useCallback(() => setExtraCalories(0), []);

  const addFoodItem = useCallback((name, calories) => {
    setPendingFoodItems((prev) => [...prev, { name, calories: Math.round(Number(calories) || 0) }]);
  }, []);

  const consumePendingItems = useCallback(() => {
    const items = pendingFoodItems;
    setPendingFoodItems([]);
    return items;
  }, [pendingFoodItems]);

  const api = useMemo(() => ({
    extraCalories,
    addCalories,
    resetCalories,
    pendingFoodItems,
    addFoodItem,
    consumePendingItems,
  }), [extraCalories, addCalories, resetCalories, pendingFoodItems, addFoodItem, consumePendingItems]);

  return (
    <CalorieTotalContext.Provider value={api}>
      {children}
    </CalorieTotalContext.Provider>
  );
}

export function useCalorieTotal() {
  const ctx = useContext(CalorieTotalContext);
  if (!ctx) throw new Error("useCalorieTotal must be used inside CalorieTotalProvider");
  return ctx;
}

