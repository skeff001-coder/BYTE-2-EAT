import { useState, useCallback } from "react";

const KEY = "bite_goal_mode";

export type GoalMode =
  | "balanced"
  | "high-protein"
  | "calorie-deficit"
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "family"
  | "under-20"
  | "fakeaway"
  | "budget";

export const GOAL_MODES: { id: GoalMode; label: string; emoji: string; description: string }[] = [
  { id: "balanced",       label: "Balanced",      emoji: "🥗", description: "Nutritious, varied meals" },
  { id: "high-protein",   label: "High Protein",  emoji: "💪", description: "Gym & muscle-focused, 40g+ protein" },
  { id: "calorie-deficit",label: "Calorie Deficit",emoji: "🎯", description: "Low-cal, filling meals under 500 kcal" },
  { id: "vegetarian",     label: "Vegetarian",    emoji: "🥦", description: "No meat, plenty of protein alternatives" },
  { id: "vegan",          label: "Vegan",         emoji: "🌱", description: "100% plant-based meals" },
  { id: "gluten-free",    label: "Gluten Free",   emoji: "🌾", description: "No gluten-containing ingredients" },
  { id: "family",         label: "Family",        emoji: "👨‍👩‍👧", description: "Kid-friendly portions & flavours" },
  { id: "under-20",       label: "Under 20 Mins", emoji: "⚡", description: "Quick meals ready in under 20 minutes" },
  { id: "fakeaway",       label: "Fakeaway",      emoji: "🍔", description: "Takeaway-style meals made at home" },
  { id: "budget",         label: "Budget",        emoji: "💰", description: "Stretch every ingredient, cut costs" },
];

export function useGoalMode() {
  const [goalMode, setGoalModeState] = useState<GoalMode>(
    () => (localStorage.getItem(KEY) as GoalMode | null) ?? "balanced"
  );

  const setGoalMode = useCallback((mode: GoalMode) => {
    localStorage.setItem(KEY, mode);
    setGoalModeState(mode);
  }, []);

  return { goalMode, setGoalMode };
}
