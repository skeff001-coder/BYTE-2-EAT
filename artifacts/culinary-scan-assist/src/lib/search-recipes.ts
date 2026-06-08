import type { Recipe } from "./recipes";

export async function searchRecipesAI(query: string, goalMode?: string): Promise<Recipe[]> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/search-recipes`, {
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
