import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Heart, Loader2, Plus, RefreshCw, Sparkles, Clock, X, AlertTriangle, ShoppingCart, CalendarDays, UtensilsCrossed, Gift } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { analyzeFridge } from "@/lib/analyze-fridge";
import type { AnalysisResult } from "@/lib/analyze-fridge";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useScanCredits } from "@/lib/use-scan-credits";
import { PRODUCT_SCAN1, PRODUCT_SCAN10, type PurchasedProduct } from "@/lib/use-iap";
import { useGoalMode } from "@/lib/use-goal-mode";
import { useSavingsTracker } from "@/lib/use-savings-tracker";
import { PaywallModal } from "@/components/paywall-modal";
import { MealPlanView } from "@/components/meal-plan-view";
import { ShoppingListView } from "@/components/shopping-list-view";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
});

type ResultTab = "recipes" | "mealplan" | "shopping";

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
          <circle cx="50" cy="50" r={radius} fill="none" stroke={hue} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`} style={{ transition: "stroke-dasharray 600ms ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground leading-none">{pct}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <BrandLogo size="sm" /> Health Score
          </h3>
        </div>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {tip && <p className="mt-2 text-sm text-foreground">{tip}</p>}
      </div>
    </section>
  );
}

const TABS: { id: ResultTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "recipes",   label: "Recipes",    icon: UtensilsCrossed },
  { id: "mealplan",  label: "Meal Plan",  icon: CalendarDays },
  { id: "shopping",  label: "Shopping",   icon: ShoppingCart },
];

function ScanPage() {
  const router = useRouter();
  const { isFavorite, toggle, isAuthed } = useFavorites();
  const { user, loading: authLoading } = useAuth();
  const { credits, canScan, hasExpiry, consumeCredit, purchasePlan, unlockPremiumCredits } = useScanCredits();
  const { goalMode } = useGoalMode();
  const { addSavings } = useSavingsTracker();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallVariant, setPaywallVariant] = useState<"default" | "post-trial">("default");
  const [activeTab, setActiveTab] = useState<ResultTab>("recipes");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<"camera" | "preview" | "loading" | "ingredients" | "result">("camera");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [expiringIngredients, setExpiringIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (stage !== "camera" || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      } catch (err) {
        setCameraError(err instanceof Error ? "Camera unavailable. You can upload a photo instead." : "Camera unavailable.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [stage, user]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 960;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    setImageDataUrl(canvas.toDataURL("image/jpeg", 0.8));
    setStage("preview");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImageDataUrl(reader.result as string); setStage("preview"); };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!imageDataUrl) return;
    if (!canScan) { setPaywallVariant("default"); setShowPaywall(true); return; }
    // Was this the very last credit, and was it the free trial credit (no expiry = not a purchased pack)?
    const willUseLastFreeTrialScan = credits === 1 && !hasExpiry;
    setStage("loading");
    // Credit is NOT consumed here — only consumed after a successful scan.
    // This ensures users never lose a credit due to a network or server error.
    try {
      const res = await analyzeFridge(imageDataUrl, goalMode);
      if (res.error) {
        // Server returned an error in the response — do NOT consume the credit
        setResult(res);
        setStage("result");
        return;
      }
      // Success — now consume the credit
      consumeCredit();
      setResult(res);
      setIngredients(res.ingredients ?? []);
      setExpiringIngredients(res.expiringIngredients ?? []);
      if (res.estimatedSavings > 0) addSavings(res.estimatedSavings);
      if (user && (res.ingredients?.length ?? 0) > 0) {
        supabase.from("scans").insert({
          user_id: user.id, ingredients: res.ingredients,
          health_score: res.healthScore, health_tip: res.healthTip, recipes: res.recipes,
        }).then(({ error }) => { if (error) console.error("save scan", error); });
      }
      if ((res.ingredients?.length ?? 0) === 0) setStage("result");
      else setStage("ingredients");
      // They just used their free trial scan — this is the moment to convert them.
      if (willUseLastFreeTrialScan) {
        setPaywallVariant("post-trial");
        setShowPaywall(true);
      }
    } catch {
      // Network / connection failure — credit NOT consumed, user keeps their scan
      setResult({
        error: "Couldn't connect to the server. Your scan credit has NOT been used — please try again.",
        ingredients: [], expiringIngredients: [], healthScore: null, healthTip: null,
        recipes: [], mealPlan: [], shoppingList: [], estimatedSavings: 0,
      });
      setStage("result");
    }
  };

  const reset = () => {
    setImageDataUrl(null); setResult(null);
    setIngredients([]); setExpiringIngredients([]);
    setNewIngredient(""); setStage("camera"); setActiveTab("recipes");
  };

  const removeIngredient = (name: string) => setIngredients((prev) => prev.filter((i) => i !== name));
  const addIngredient = () => {
    const v = newIngredient.trim();
    if (!v) return;
    setIngredients((prev) => prev.some((i) => i.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]);
    setNewIngredient("");
  };

  const creditLabel = credits === 1 ? "1 scan left" : credits === 0 ? "No scans left" : `${credits} scans left`;

  // Gate: must be signed in with an email account before touching the camera at all.
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-background">
        <header className="flex items-center gap-3 px-5 pt-6 pb-4">
          <button onClick={() => router.navigate({ to: "/" })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Scan My Fridge</h1>
        </header>
        <div className="px-6 pt-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl text-primary-foreground mb-4" style={{ background: "var(--gradient-primary)" }}>
            <Gift className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Your first scan is free</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Create a free account with your email to unlock it — takes 10 seconds, no card needed.
          </p>
          <button
            onClick={() => router.navigate({ to: "/auth", search: { redirect: "/scan" } })}
            className="mt-6 w-full max-w-xs rounded-2xl py-4 text-sm font-bold text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
          >
            Create free account
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {showPaywall && (
        <PaywallModal
          variant={paywallVariant}
          onClose={() => setShowPaywall(false)}
          onUnlock={(productId: PurchasedProduct) => {
            if (productId === PRODUCT_SCAN10) {
              unlockPremiumCredits();
            } else {
              purchasePlan("scan1");
            }
            setShowPaywall(false);
          }}
        />
      )}

      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          
