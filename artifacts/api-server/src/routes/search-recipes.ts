import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

// Same Pexels lookup used by analyze-fridge.ts — searches a real photo
// matching each recipe title. This endpoint's AI prompt never asked for an
// image field at all, which is why every search result previously fell
// back to the same single placeholder image regardless of the recipe.
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
    return null;
  }
}

router.post("/search-recipes", async (req, res) => {
  const { query, goalMode } = req.body as {
    query?: string;
    goalMode?: string;
  };

  if (!query || typeof query !== "string" || query.trim().length < 2) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseURL || !apiKey) {
    res.status(503).json({ error: "AI integration is not configured." });
    return;
  }

  const GOAL_CONTEXT: Record<string, string> = {
    "balanced":        "Balanced, nutritious meals with a variety of food groups.",
    "high-protein":    "High-protein, gym-focused meals with 40g+ protein per meal.",
    "calorie-deficit": "Low-calorie, high-volume, filling meals under 500 calories.",
    "vegetarian":      "Vegetarian meals — no meat or fish.",
    "vegan":           "Fully vegan meals — no animal products.",
    "gluten-free":     "Strictly gluten-free meals.",
    "family":          "Family-friendly meals kids will enjoy.",
    "under-20":        "All recipes ready in under 20 minutes.",
    "fakeaway":        "Takeaway-style meals made healthily at home.",
    "budget":          "Budget-friendly meals using simple ingredients.",
  };

  const goalDesc = (goalMode && GOAL_CONTEXT[goalMode]) ? GOAL_CONTEXT[goalMode] : GOAL_CONTEXT["balanced"];

  const client = new OpenAI({ baseURL, apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a world-class chef AI. The user's goal mode is: ${goalDesc}

Return ONLY valid minified JSON with this exact shape (no markdown fences, no extra text):
{"recipes":[{"id":"","title":"","time":"","difficulty":"","tag":"","calories":0,"servings":0,"description":"","ingredients":[],"steps":[]}]}

Rules:
- Return exactly 4 to 6 recipes
- Each recipe MUST use the user's search ingredients as a main component
- id: unique string (e.g. "ai-1", "ai-2")
- title: appetising recipe name
- time: e.g. "25 min"
- difficulty: "Easy", "Medium", or "Hard"
- tag: one of "Trending", "Quick", "Healthy", "Protein", "Vegan", "Viral", "Family", "Budget"
- calories: integer calories per serving
- servings: integer number of servings
- description: one enticing sentence about the dish
- ingredients: array of strings with quantities (e.g. "400g beef mince")
- steps: array of 4-7 clear cooking steps
- Make the recipes genuinely delicious and varied (different cooking styles, cuisines)`,
        },
        {
          role: "user",
          content: `Give me the best recipes using: ${query.trim()}`,
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
      recipes?: {
        id: string;
        title: string;
        time: string;
        difficulty: string;
        tag: string;
        calories: number;
        servings: number;
        description: string;
        ingredients: string[];
        steps: string[];
      }[];
    };

    const rawRecipes = parsed.recipes ?? [];

    // Fetch all recipe images in parallel rather than one-by-one, so this
    // doesn't add up to several seconds of sequential wait time.
    const images = await Promise.all(
      rawRecipes.map((r) => fetchRecipeImage(r.title)),
    );
    const recipes = rawRecipes.map((r, i) => ({ ...r, image: images[i] }));

    res.json({ error: null, recipes });
  } catch (err) {
    req.log.error({ err }, "searchRecipes error");
    res.status(500).json({ error: "Failed to generate recipes. Please try again." });
  }
});

export default router;
