import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const GOAL_CONTEXT: Record<string, string> = {
  balanced: "Balanced, nutritious meals for general health.",
  "high-protein": "High-protein, gym-focused meals with 40g+ protein per meal. Prioritise chicken, eggs, fish, legumes.",
  family: "Family-friendly portions, simple recipes kids will enjoy, no strong spices.",
  budget: "Budget-friendly meals, use everything in the fridge, minimise waste and cost.",
  "weight-loss": "Low-calorie, high-volume, filling meals under 500 calories. Prioritise vegetables, lean protein.",
};

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
- expiringIngredients: items that appear near expiry (wilting veg, nearly empty, close-dated) — empty array if none obvious
- healthScore: integer 1-100 nutritional quality of visible ingredients
- healthTip: ONE short actionable tip to improve the score
- recipes: 3-5 recipes using mostly visible ingredients, tailored to the goal mode
- mealPlan: exactly 5 days Mon-Fri, each with breakfast/lunch/dinner tailored to goal mode, using fridge ingredients plus common staples
- shoppingList: 4-8 items needed to complete the meal plan not visible in the fridge, each with estimated GBP cost (number) and supermarket aisle (e.g. "Dairy", "Produce", "Meat", "Bakery")
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

    res.json({
      error: null,
      ingredients: (parsed.ingredients ?? []) as string[],
      expiringIngredients: (parsed.expiringIngredients ?? []) as string[],
      healthScore: typeof parsed.healthScore === "number"
        ? Math.max(1, Math.min(100, Math.round(parsed.healthScore)))
        : null,
      healthTip: typeof parsed.healthTip === "string" ? parsed.healthTip : null,
      recipes: (parsed.recipes ?? []) as { title: string; time: string; description: string; steps: string[] }[],
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
