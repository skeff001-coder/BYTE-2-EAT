import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

router.post("/analyze-fridge", async (req, res) => {
  const { imageDataUrl } = req.body as { imageDataUrl?: string };

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

  const client = new OpenAI({ baseURL, apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content:
            'You are a friendly chef and nutrition assistant. Look at the photo of the user\'s fridge or ingredients. Return ONLY valid minified JSON, no markdown fences, in the shape: {"ingredients":string[],"healthScore":number,"healthTip":string,"recipes":[{"title":string,"time":string,"description":string,"steps":string[]}]}. healthScore is an integer 1-100 rating overall nutritional quality of the visible ingredients (more whole foods, vegetables, lean protein, fiber = higher; processed/sugary/fatty = lower). healthTip is ONE short, specific actionable tip to raise the score. Suggest 3 recipes using mostly what you can see.',
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What's in my fridge and what can I cook?" },
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
      healthScore?: number;
      healthTip?: string;
      recipes?: { title: string; time: string; description: string; steps: string[] }[];
    };

    res.json({
      error: null,
      ingredients: (parsed.ingredients ?? []) as string[],
      healthScore:
        typeof parsed.healthScore === "number"
          ? Math.max(1, Math.min(100, Math.round(parsed.healthScore)))
          : null,
      healthTip: typeof parsed.healthTip === "string" ? parsed.healthTip : null,
      recipes: (parsed.recipes ?? []) as { title: string; time: string; description: string; steps: string[] }[],
    });
  } catch (err) {
    req.log.error({ err }, "analyzeFridge error");
    res.json({
      error: err instanceof Error ? err.message : "Failed to analyze image",
      ingredients: [],
      healthScore: null,
      healthTip: null,
      recipes: [],
    });
  }
});

export default router;
