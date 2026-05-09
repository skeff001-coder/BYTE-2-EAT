export type AnalysisResult = {
  error: string | null;
  ingredients: string[];
  healthScore: number | null;
  healthTip: string | null;
  recipes: { title: string; time: string; description: string; steps: string[] }[];
};

export async function analyzeFridge(imageDataUrl: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze-fridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return {
      error: (err as { error?: string }).error ?? "Failed to analyze image",
      ingredients: [],
      healthScore: null,
      healthTip: null,
      recipes: [],
    };
  }

  return response.json() as Promise<AnalysisResult>;
}
