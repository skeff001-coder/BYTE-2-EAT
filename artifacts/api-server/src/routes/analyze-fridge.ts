import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const GOAL_CONTEXT: Record<string, string> = {
  "balanced":        "Balanced, nutritious meals with a variety of food groups for general health.",
  "high-protein":    "High-protein, gym-focused meals with 40g+ protein per meal. Prioritise chicken, eggs, fish, legumes, Greek yoghurt.",
  "calorie-deficit": "Low-calorie, high-volume, filling meals under 500 calories. Prioritise vegetables, lean protein, avoid calorie-dense ingredients.",
  "vegetarian":      "Vegetarian meals — no meat or fish. Use eggs, dairy, legumes, tofu, cheese for protein.",
  "vegan":           "Fully vegan meals — no animal products at all. Use legumes, tofu, tempeh, nuts, seeds, plant-based alternatives.",
  "gluten-free":     "Strictly gluten-free meals — no wheat, barley, rye, or regular oats. Use rice, potatoes, gluten-free grains.",
  "family":          "Family-friendly meals with simple flavours kids will enjoy. Generous portions, avoid strong spices, keep it fun.",
  "under-20":        "All recipes and meals must be ready in under 20 minutes. Prioritise quick cooking methods — stir-fry, wraps, salads, pasta.",
  "fakeaway":        "Takeaway-style meals made healthily at home — e.g. burgers, wraps, curries, pizza, noodles, fried rice. Comfort food vibes.",
  "budget":          "Budget-friendly meals — use everything in the fridge, minimise waste, avoid expensive ingredients. Stretch every item.",
};

// Looks up one real food photo per recipe title via Pexels' free image search
// API. Recipes previously had no image field at all (not a broken URL — no
// URL was ever generated), which is why every card fell back to the same
// placeholder and the detail screen showed nothing. This fills that gap
// with an actual photo matching the dish, without the ongoing per-image
// cost of an AI image-generation call.
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

async function fetchRecipeImage(title: string): Promise<string | null> {
  if (!PEXELS_API_KEY || !title) return null;
  try {
    const query = encodeURIComponent(`${title} food dish`);
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=square`,
      { headers: { Authorization: PEXELS_API_KEY } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      photos?: { src?: { medium?: string; large?: string } }[];
    };
    return data.photos?.[0]?.src?.large ?? data.photos?.[0]?.src?.medium ?? null;
  } catch {
    // A single failed image lookup should never break the whole recipe —
    // the frontend's existing placeholder fallback still covers this case.
    return null;
  }
}

router.post("/analyze-fridge", async (req, res) => {
  const { imageDataUrl, goalMode } = req.body as {
    imageDataUrl?: string;
    goalMode?: string;
  };

  if (!imageDataUrl || typeof imageDataUrl !== "string" || imageDataUrl.length < 20) {
    res.status(400).json({ error: "imageDataUrl is required" });
    return;
  }

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseURL || !apiKey) {
    res.status(503).json({ error: "AI integration is not configured." });
    return;
  }

  const goal = goalMode && GOAL_CONTEXT[goalMode] ? goalMode : "balanced";
  const goalDesc = GOAL_CONTEXT[goal];

  const client = new OpenAI({ baseURL, apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2500,
      messages: [
        {
          role: "system",
          content: `You are a chef and nutrition AI. Analyse the fridge photo. The user's goal mode is: ${goalDesc}

Return ONLY valid minified JSON with this exact shape (no markdown fences):
{"ingredients":[],"expiringIngredients":[],"healthScore":0,"healthTip":"","recipes":[{"title":"","time":"","description":"","steps":[]}],"mealPlan":[{"day":"","breakfast":{"title":"","time":""},"lunch":{"title":"","time":""},"dinner":{"title":"","time":""}}],"shoppingList":[{"item":"","cost":0.00,"aisle":""}],"estimatedSavings":0}

Rules:
- ingredients: all visible food items
- expiringIngredients: items that appear near expiry (wilting veg, nearly empty, close-dated) — empty array if none obvious. Include natural-language expiry hints like "your spinach expires tomorrow" or "use your chicken tonight"
- healthScore: integer 1-100 nutritional quality of visible ingredients
- healthTip: ONE short actionable tip to improve the score
- recipes: 3-5 recipes using mostly visible ingredients, strictly tailored to the goal mode (e.g. if vegan, no meat/dairy; if under-20, all under 20 mins; if fakeaway, takeaway-style)
- mealPlan: exactly 5 days Mon-Fri, each with breakfast/lunch/dinner tailored to the goal mode, using fridge ingredients plus common staples
- shoppingList: 4-8 items needed to complete the meal plan not visible in the fridge, each with estimated GBP cost (number) and supermarket aisle (e.g. "Dairy", "Produce", "Meat", "Bakery", "Frozen", "Pantry")
- estimatedSavings: estimated GBP value of meals that can be made from existing fridge contents (food waste saved), integer`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyse my fridge and create my meal plan." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "");

    const parsed = JSON.parse(cleaned) as {
      ingredients?: string[];
      expiringIngredients?: string[];
      healthScore?: number;
      healthTip?: string;
      recipes?: { title: string; time: string; description: string; steps: string[] }[];
      mealPlan?: { day: string; breakfast: { title: string; time: string }; lunch: { title: string; time: string }; dinner: { title: string; time: string } }[];
      shoppingList?: { item: string; cost: number; aisle: string }[];
      estimatedSavings?: number;
    };

    const rawRecipes = parsed.recipes ?? [];

    // Fetch all recipe images in parallel rather than one-by-one, so this
    // doesn't add up to several seconds of sequential wait time.
    const images = await Promise.all(
      rawRecipes.map((r) => fetchRecipeImage(r.title)),
    );
    const recipes = rawRecipes.map((r, i) => ({ ...r, image: images[i] }));

    res.json({
      error: null,
      ingredients: (parsed.ingredients ?? []) as string[],
      expiringIngredients: (parsed.expiringIngredients ?? []) as string[],
      healthScore: typeof parsed.healthScore === "number"
        ? Math.max(1, Math.min(100, Math.round(parsed.healthScore)))
        : null,
      healthTip: typeof parsed.healthTip === "string" ? parsed.healthTip : null,
      recipes,
      mealPlan: (parsed.mealPlan ?? []) as { day: string; breakfast: { title: string; time: string }; lunch: { title: string; time: string }; dinner: { title: string; time: string } }[],
      shoppingList: (parsed.shoppingList ?? []) as { item: string; cost: number; aisle: string }[],
      estimatedSavings: typeof parsed.estimatedSavings === "number" ? Math.round(parsed.estimatedSavings) : 0,
    });
  } catch (err) {
    req.log.error({ err }, "analyzeFridge error");
    res.json({
      error: err instanceof Error ? err.message : "Failed to analyze image",
      ingredients: [],
      expiringIngredients: [],
      healthScore: null,
      healthTip: null,
      recipes: [],
      mealPlan: [],
      shoppingList: [],
      estimatedSavings: 0,
    });
  }
});

export default router;
