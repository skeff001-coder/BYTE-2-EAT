import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Heart, Loader2, Plus, RefreshCw, Sparkles, Clock, X } from "lucide-react";
import { analyzeFridge } from "@/lib/analyze-fridge";
import type { AnalysisResult } from "@/lib/analyze-fridge";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
});

function HealthScore({ score, tip }: { score: number; tip: string | null }) {
  const pct = Math.max(0, Math.min(100, score));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const hue = pct >= 75 ? "var(--color-primary)" : pct >= 45 ? "oklch(0.78 0.15 85)" : "oklch(0.6 0.2 20)";
  const label = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Fair" : "Needs work";
  return (
    <section className="mt-5 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
      <div className="relative h-24 w-24 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-muted)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={hue}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 600ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground leading-none">{pct}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Bite Health Score</h3>
        </div>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {tip && <p className="mt-2 text-sm text-foreground">{tip}</p>}
      </div>
    </section>
  );
}

function ScanPage() {
  const router = useRouter();
  const { isFavorite, toggle, isAuthed } = useFavorites();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<
    "camera" | "preview" | "loading" | "ingredients" | "result"
  >("camera");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (stage !== "camera") return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        setCameraError(
          err instanceof Error
            ? "Camera unavailable. You can upload a photo instead."
            : "Camera unavailable."
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [stage]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 960;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const data = canvas.toDataURL("image/jpeg", 0.8);
    setImageDataUrl(data);
    setStage("preview");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setStage("preview");
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!imageDataUrl) return;
    setStage("loading");
    try {
      const res = await analyzeFridge(imageDataUrl);
      setResult(res);
      setIngredients(res.ingredients ?? []);
      if (user && !res.error && (res.ingredients?.length ?? 0) > 0) {
        supabase
          .from("scans")
          .insert({
            user_id: user.id,
            ingredients: res.ingredients,
            health_score: res.healthScore,
            health_tip: res.healthTip,
            recipes: res.recipes,
          })
          .then(({ error }) => {
            if (error) console.error("save scan", error);
          });
      }
      if (res.error || (res.ingredients?.length ?? 0) === 0) {
        setStage("result");
      } else {
        setStage("ingredients");
      }
    } catch {
      setResult({ error: "Something went wrong. Please try again.", ingredients: [], healthScore: null, healthTip: null, recipes: [] });
      setStage("result");
    }
  };

  const reset = () => {
    setImageDataUrl(null);
    setResult(null);
    setIngredients([]);
    setNewIngredient("");
    setStage("camera");
  };

  const removeIngredient = (name: string) =>
    setIngredients((prev) => prev.filter((i) => i !== name));

  const addIngredient = () => {
    const v = newIngredient.trim();
    if (!v) return;
    setIngredients((prev) => (prev.some((i) => i.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]));
    setNewIngredient("");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={() => router.navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Scan My Fridge</h1>
      </header>

      {stage === "camera" && (
        <div className="px-5">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-black ring-1 ring-border">
            {cameraError ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
                <Camera className="h-10 w-10 opacity-80" />
                <p className="text-sm opacity-90">{cameraError}</p>
              </div>
            ) : (
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            )}
            <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-dashed border-white/40" />
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={capture}
              disabled={!!cameraError}
              className="flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground shadow-lg ring-4 ring-primary/20 transition-transform active:scale-95 disabled:opacity-40"
              style={{ background: "var(--gradient-primary)" }}
              aria-label="Take photo"
            >
              <Camera className="h-8 w-8" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Or upload a photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFile}
            />
          </div>
        </div>
      )}

      {stage === "preview" && imageDataUrl && (
        <div className="px-5">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-black ring-1 ring-border">
            <img src={imageDataUrl} alt="Fridge preview" className="h-full w-full object-cover" />
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary py-4 text-sm font-semibold text-secondary-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Retake
            </button>
            <button
              onClick={submit}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-4 w-4" /> Analyse
            </button>
          </div>
        </div>
      )}

      {stage === "loading" && (
        <div className="flex flex-col items-center justify-center gap-4 px-5 py-24">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
          <p className="text-base font-semibold text-foreground">Analysing your fridge…</p>
          <p className="text-center text-sm text-muted-foreground">AI is identifying ingredients and crafting recipes.</p>
        </div>
      )}

      {stage === "ingredients" && (
        <div className="px-5 pb-10">
          <h2 className="text-base font-bold text-foreground">Detected ingredients</h2>
          <p className="mt-1 text-sm text-muted-foreground">Remove anything that's wrong, then tap Continue.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {ingredients.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
              >
                {name}
                <button
                  onClick={() => removeIngredient(name)}
                  aria-label={`Remove ${name}`}
                  className="ml-0.5 rounded-full text-accent-foreground/60 hover:text-accent-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIngredient()}
              placeholder="Add ingredient…"
              className="flex-1 rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addIngredient}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
              aria-label="Add ingredient"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={() => setStage("result")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            <Sparkles className="h-4 w-4" /> Get recipes
          </button>
        </div>
      )}

      {stage === "result" && result && (
        <div className="px-5 pb-10">
          {result.error && (
            <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{result.error}</div>
          )}

          {result.healthScore != null && (
            <HealthScore score={result.healthScore} tip={result.healthTip ?? null} />
          )}

          {result.recipes.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold text-foreground">Recipes for you</h2>
              <ul className="mt-3 space-y-4">
                {result.recipes.map((recipe, i) => (
                  <li key={i} className="rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">{recipe.title}</h3>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {recipe.time}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{recipe.description}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!isAuthed) {
                            router.navigate({ to: "/auth" });
                            return;
                          }
                          await toggle({ key: `scan:${recipe.title}`, title: recipe.title, time: recipe.time, description: recipe.description, steps: recipe.steps });
                        }}
                        aria-label={isFavorite(`scan:${recipe.title}`) ? `Remove ${recipe.title} from favourites` : `Save ${recipe.title} to favourites`}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
                      >
                        <Heart className={`h-5 w-5 ${isFavorite(`scan:${recipe.title}`) ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    {recipe.steps.length > 0 && (
                      <ol className="mt-3 space-y-1.5 border-t border-border pt-3">
                        {recipe.steps.map((step, j) => (
                          <li key={j} className="flex gap-2 text-sm text-foreground">
                            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {j + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button
            onClick={reset}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-4 text-sm font-semibold text-secondary-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Scan again
          </button>
        </div>
      )}
    </main>
  );
}
