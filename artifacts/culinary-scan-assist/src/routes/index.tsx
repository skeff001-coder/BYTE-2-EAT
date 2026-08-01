import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Clock, Flame, Heart, Search, PiggyBank, Settings, ShoppingBag, TriangleAlert, ExternalLink, Sparkles, Loader2, SlidersHorizontal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { getTrendingRecipes, type Recipe } from "@/lib/recipes";
import { searchRecipesAI } from "@/lib/search-recipes";
import { useFavorites } from "@/lib/favorites";
import { useAuth, signOut } from "@/lib/use-auth";
import { useScanCredits, getDaysUntilExpiry } from "@/lib/use-scan-credits";
import { PRODUCT_SCAN1, PRODUCT_SCAN10, type PurchasedProduct } from "@/lib/use-iap";
import { EFFORTLESS_BURN_NAME, EFFORTLESS_BURN_APP_STORE_URL } from "@/lib/app-info";
import { useGoalMode, GOAL_MODES } from "@/lib/use-goal-mode";
import { useSavingsTracker } from "@/lib/use-savings-tracker";
import { PaywallModal } from "@/components/paywall-modal";
import { RecipeModal } from "@/components/recipe-modal";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipes] = useState<Recipe[]>(() => getTrendingRecipes(4));
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const { isFavorite, toggle, isAuthed } = useFavorites();
  const { user } = useAuth();
  const { credits, canScan, purchasePlan, unlockPremiumCredits } = useScanCredits();
  const { goalMode, setGoalMode } = useGoalMode();
  const { monthly } = useSavingsTracker();
  const [sisterDismissed, setSisterDismissed] = useState(() =>
    localStorage.getItem("bite_sister_banner_dismissed") === "1"
  );
  const dismissSister = () => {
    localStorage.setItem("bite_sister_banner_dismissed", "1");
    setSisterDismissed(true);
  };

  const [expiryDays, setExpiryDays] = useState<number | null>(() => getDaysUntilExpiry());
  const [expiryBannerDismissed, setExpiryBannerDismissed] = useState<boolean>(() => {
    const expiry = localStorage.getItem("bite_scan_expiry");
    if (!expiry) return false;
    return localStorage.getItem(`bite_expiry_dismissed_${expiry}`) === "1";
  });
  const [lowScanDismissed, setLowScanDismissed] = useState<boolean>(() => {
    const expiry = localStorage.getItem("bite_scan_expiry");
    if (!expiry) return false;
    return localStorage.getItem(`bite_low_scan_dismissed_${expiry}`) === "1";
  });

  useEffect(() => {
    setExpiryDays(getDaysUntilExpiry());
    const expiry = localStorage.getItem("bite_scan_expiry");
    const dismissed = expiry
      ? localStorage.getItem(`bite_low_scan_dismissed_${expiry}`) === "1"
      : false;
    setLowScanDismissed(dismissed);
  }, [credits]);

  const showExpiryBanner =
    !expiryBannerDismissed &&
    credits > 0 &&
    expiryDays !== null &&
    expiryDays <= 7;

  const dismissExpiryBanner = () => {
    const expiry = localStorage.getItem("bite_scan_expiry");
    if (expiry) {
      localStorage.setItem(`bite_expiry_dismissed_${expiry}`, "1");
    }
    setExpiryBannerDismissed(true);
  };

  const isPaidCredit = localStorage.getItem("bite_scan_expiry") !== null;
  const showLowScanBanner = !lowScanDismissed && credits === 1 && isPaidCredit;

  const dismissLowScanBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    const expiry = localStorage.getItem("bite_scan_expiry");
    if (expiry) {
      localStorage.setItem(`bite_low_scan_dismissed_${expiry}`, "1");
    }
    setLowScanDismissed(true);
  };

  const q = query.trim().toLowerCase();
  const localFiltered = q
    ? recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tag.toLowerCase().includes(q) ||
          r.difficulty.toLowerCase().includes(q) ||
          r.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          r.steps.some((step) => step.toLowerCase().includes(q)),
      )
    : recipes;

  const isSearching = q.length >= 2;
  const filtered = isSearching ? (aiRecipes.length > 0 ? aiRecipes : localFiltered) : recipes;

  useEffect(() => {
    if (q.length < 2) {
      setAiRecipes([]);
      setAiError(null);
      setAiLoading(false);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiRecipes([]);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchRecipesAI(q, goalMode);
        setAiRecipes(results);
      } catch {
        setAiError("Couldn't load recipes right now. Try again.");
      } finally {
        setAiLoading(false);
      }
    }, 600);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [q, goalMode]);

      const handleScanPress = () => {
    navigate({ to: "/scan" });
  };

  const creditLabel =
    credits === 1 ? "1 scan remaining" :
    credits === 0 ? "No scans left" :
                    `${credits} scans remaining`;

  return (
    <main className="min-h-screen bg-background pb-12">
      {showPaywall && (
        <PaywallModal
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
      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}

      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 style={{ fontFamily: "var(--app-font-serif)" }} className="text-4xl font-medium tracking-tight text-foreground">
              Byte <span className="text-primary">2</span> Eat
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI meets your ingredients 🔍
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/favorites"
              aria-label="Favourites"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground ring-1 ring-border"
            >
              <Heart className="h-4 w-4" />
            </Link>
            <Link
              to="/settings"
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground ring-1 ring-border"
            >
              <Settings className="h-4 w-4" />
            </Link>
            {user ? (
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
              >
                {(user.email ?? "?").charAt(0).toUpperCase()}
              </button>
            ) : (
              <Link
                to="/auth"
                aria-label="Sign in"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background"
              >
                <span className="text-xs font-bold">In</span>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-full bg-card px-4 py-3 ring-1 ring-border shadow-sm focus-within:ring-2 focus-within:ring-primary">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredients or recipes…"
            aria-label="Search ingredients or recipes"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </header>

      {showLowScanBanner && (
        <button
          onClick={() => setShowPaywall(true)}
          className="mx-5 mt-1 mb-1 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-border shadow-sm active:scale-[0.98] transition-transform"
          aria-label="Top up scans — only 1 remaining"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">Only 1 scan left — top up now</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
              Don't run out mid-cook. Tap to grab another pack.
            </p>
          </div>
          <button
            onClick={dismissLowScanBanner}
            aria-label="Dismiss"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground text-lg leading-none px-1"
          >
            ×
          </button>
        </button>
      )}

      {showExpiryBanner && (
        <button
          onClick={dismissExpiryBanner}
          className="mx-5 mt-1 mb-1 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-border shadow-sm active:scale-[0.98] transition-transform"
          aria-label="Dismiss scan credit expiry warning"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <TriangleAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">
              {expiryDays === 1 ? "Your scans expire tomorrow!" : `Your scans expire in ${expiryDays} days`}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
              Use your remaining {credits === 1 ? "scan" : `${credits} scans`} before they're gone. Tap to dismiss.
            </p>
          </div>
        </button>
      )}

      {/* Hero */}
      <section className="px-5 mt-3">
        <div className="relative overflow-hidden rounded-3xl bg-accent" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="p-6 sm:p-7">
              <h2
                style={{ fontFamily: "var(--app-font-serif)", lineHeight: 1.05 }}
                className="text-[2rem] font-medium tracking-tight text-foreground"
              >
                See what<br />you can make
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Scan your fridge and get personalised meal ideas in seconds.
              </p>
              <button
                onClick={handleScanPress}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition-transform active:scale-[0.97]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/90">
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </span>
                Scan your fridge
              </button>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Zero waste. Maximum taste.</span>
              </div>
              <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${credits === 0 ? "bg-red-100 text-red-700" : "bg-white text-foreground ring-1 ring-border"}`}>
                {credits === 0 ? "⛔ " : "⚡ "}{creditLabel}
              </div>
            </div>
            <div className="relative h-48 sm:h-auto">
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop&auto=format"
                alt="Fresh ingredients ready to be scanned"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {!sisterDismissed && (
        <a
          href={EFFORTLESS_BURN_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-border shadow-sm active:scale-[0.98] transition-transform"
          onClick={(e) => {
            if (Capacitor.isNativePlatform()) {
              e.preventDefault();
              window.open(EFFORTLESS_BURN_APP_STORE_URL, '_system');
            }
          }}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">Love cooking? Burn it off.</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
              Try {EFFORTLESS_BURN_NAME} — our sister app for calorie tracking &amp; exercise.
            </p>
          </div>
          <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissSister(); }}
            aria-label="Dismiss"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground text-lg leading-none px-1"
          >
            ×
          </button>
        </a>
      )}

      {/* Goals */}
      <section className="mt-8 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Your goals</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {GOAL_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setGoalMode(m.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-2xl px-4 py-3 min-w-[84px] text-center transition-all ${
                goalMode === m.id
                  ? "bg-accent ring-2 ring-primary/40"
                  : "bg-card ring-1 ring-border"
              }`}
              title={m.description}
            >
              <span className="text-xl leading-none">{m.emoji}</span>
              <span className="text-[11px] font-semibold leading-tight text-foreground whitespace-nowrap">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* This month stats */}
      {monthly > 0 && (
        <section className="mt-6 px-5">
          <div className="rounded-2xl bg-card ring-1 ring-border p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">This month</p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent">
                <PiggyBank className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">£{monthly.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">saved vs takeaways</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recipes */}
      <section className="mt-8 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            {isSearching ? "AI Recipes" : "For you"}
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            {isSearching ? `for "${query}"` : "This week"}
          </span>
        </div>

        {aiLoading && (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-card p-6 ring-1 ring-border">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Finding the best recipes for "{query}"…</span>
          </div>
        )}
        {!aiLoading && aiError && (
          <div className="rounded-2xl bg-card p-4 text-center text-sm text-red-500 ring-1 ring-border">
            {aiError}
          </div>
        )}
        {!aiLoading && !aiError && filtered.length === 0 && (
          <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground ring-1 ring-border">
            No recipes found. Try scanning your fridge instead.
          </div>
        )}

        {!aiLoading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRecipe(r)}
                className="text-left rounded-2xl overflow-hidden bg-card ring-1 ring-border shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="relative h-28 w-full">
                  <img
                    src={r.image || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop&auto=format`}
                    alt={r.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    <Clock className="h-3 w-3" /> {r.time}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!isAuthed) { navigate({ to: "/auth" }); return; }
                      await toggle({ key: `trending:${r.id}`, title: r.title, time: r.time, image: r.image, tag: r.tag });
                    }}
                    aria-label={isFavorite(`trending:${r.id}`) ? `Remove ${r.title} from favourites` : `Save ${r.title} to favourites`}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95"
                  >
                    <Heart className={`h-3.5 w-3.5 text-primary ${isFavorite(`trending:${r.id}`) ? "fill-current" : ""}`} />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{r.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                      {r.tag}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {r.difficulty}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-10 px-5 pb-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link to="/legal" search={{ tab: "privacy" }} className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <span className="opacity-30">·</span>
          <Link to="/legal" search={{ tab: "terms" }} className="hover:text-foreground transition-colors">
            Medical Disclaimer &amp; Terms
          </Link>
        </div>
        <p className="text-[10px] text-muted-foreground opacity-50 text-center leading-relaxed max-w-xs">
          For informational purposes only. Not medical advice. Always consult a healthcare professional.
        </p>
      </footer>
    </main>
  );
}
