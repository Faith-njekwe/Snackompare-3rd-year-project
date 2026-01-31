import React, { createContext, useContext, useMemo, useState } from "react";

//global container all screens can access
const CalorieTotalContext = createContext(null);

export function CalorieTotalProvider({ children }) {
  const [extraCalories, setExtraCalories] = useState(0); // calories added from a photo

  const api = useMemo(() => {   //use memo to avoid new object every render
    const addCalories = (amount) => {
      const n = Number(amount);
      if (!Number.isFinite(n)) return;
      setExtraCalories((prev) => prev + Math.max(0, Math.round(n)));
    };

    const resetCalories = () => setExtraCalories(0);   //sets it back to 0

    return { extraCalories, addCalories, resetCalories };
  }, [extraCalories]);

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

