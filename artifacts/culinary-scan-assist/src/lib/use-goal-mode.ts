import { useState, useCallback } from "react";

const KEY = "bite_goal_mode";

export type GoalMode = "balanced" | "high-protein" | "family" | "budget" | "weight-loss";

export const GOAL_MODES: { id: GoalMode; label: string; emoji: string; description: string }[] = [
  { id: "balanced",     label: "Balanced",     emoji: "🥗", description: "Nutritious, varied meals" },
  { id: "high-protein", label: "High Protein",  emoji: "💪", description: "Gym & muscle-focused" },
  { id: "family",       label: "Family",        emoji: "👨‍👩‍👧", description: "Kid-friendly portions" },
  { id: "budget",       label: "Budget",        emoji: "💰", description: "Stretch every ingredient" },
  { id: "weight-loss",  label: "Weight Loss",   emoji: "🎯", description: "Under 500 cal meals" },
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
