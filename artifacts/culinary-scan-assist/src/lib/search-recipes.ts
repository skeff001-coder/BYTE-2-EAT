import type { Recipe } from "./recipes";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function searchRecipesAI(query: string, goalMode?: string): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/api/search-recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, goalMode }),
  });

  if (!res.ok) {
    throw new Error("Failed to search recipes");
  }

  const data = await res.json() as { error: string | null; recipes: Recipe[] };
  if (data.error) throw new Error(data.error);
  return data.recipes ?? [];
}
