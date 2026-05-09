export type Recipe = { title: string; time: string; description: string; steps: string[] };
export type MealSlot = { title: string; time: string };
export type MealDay = { day: string; breakfast: MealSlot; lunch: MealSlot; dinner: MealSlot };
export type ShoppingItem = { item: string; cost: number; aisle: string };

export type AnalysisResult = {
  error: string | null;
  ingredients: string[];
  expiringIngredients: string[];
  healthScore: number | null;
  healthTip: string | null;
  recipes: Recipe[];
  mealPlan: MealDay[];
  shoppingList: ShoppingItem[];
  estimatedSavings: number;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function analyzeFridge(
  imageDataUrl: string,
  goalMode: string = "balanced"
): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE}/api/analyze-fridge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl, goalMode }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return {
      error: (err as { error?: string }).error ?? "Failed to analyze image",
      ingredients: [],
      expiringIngredients: [],
      healthScore: null,
      healthTip: null,
      recipes: [],
      mealPlan: [],
      shoppingList: [],
      estimatedSavings: 0,
    };
  }

  return response.json() as Promise<AnalysisResult>;
}
