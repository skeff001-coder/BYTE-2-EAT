import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Clock, Flame, Heart, Search, PiggyBank, Settings, ShoppingBag, TriangleAlert, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { getTrendingRecipes, type Recipe } from "@/lib/recipes";
import { useFavorites } from "@/lib/favorites";
import { useAuth, signOut } from "@/lib/use-auth";
import { useScanCredits, getDaysUntilExpiry } from "@/lib/use-scan-credits";
import { PRODUCT_SCAN1, PRODUCT_SCAN10, type PurchasedProduct } from "@/lib/use-iap";
import { EFFORTLESS_BURN_NAME, EFFORTLESS_BURN_APP_STORE_URL } from "@/lib/app-info";
import { useGoalMode } from "@/lib/use-goal-mode";
import { useSavingsTracker } from "@/lib/use-savings-tracker";
import { PaywallModal } from "@/components/paywall-modal";
import { GoalModeSelector } from "@/components/goal-mode-selector";
import { BrandLogo } from "@/components/brand-logo";
import { RecipeModal } from "@/components/recipe-modal";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipes] = useState<Recipe[]>(() => getTrendingRecipes(4));
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
  const filtered = q
    ? recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tag.toLowerCase().includes(q) ||
          r.difficulty.toLowerCase().includes(q) ||
          r.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          r.steps.some((step) => step.toLowerCase().includes(q)),
      )
    : recipes;

  const handleScanPress = () => {
    if (canScan) {
      navigate({ to: "/scan" });
    } else {
      setShowPaywall(true);
    }
  };

  const creditLabel =
    credits === 1 ? "1 scan remaining" :
    credits === 0 ? "No scans left" :
                    `${credits} scans remaining`;

  const TAGLINES = [
    "Get Instant Recipes",
    "Zero Waste. Maximum Taste.",
    "Know What's in Your Fridge",
  ];
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineFading, setTaglineFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTaglineFading(true);
      setTimeout(() => {
        setTaglineIdx((i) => (i + 1) % TAGLINES.length);
        setTaglineFading(false);
      }, 380);
    }, 2600);
    return () => clearInterval(id);
  }, []);

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

      <header className="px-5 pt-8 pb-4">
        {/* Icon row — sits above the logo so the logo gets full width */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-primary ring-1 ring-border"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <Link
            to="/favorites"
            aria-label="Favourites"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-primary ring-1 ring-border"
          >
            <Heart className="h-4 w-4" />
          </Link>
          {user ? (
            <button
              onClick={() => signOut()}
              className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Logo — full width, never competes with buttons */}
        <BrandLogo size="2xl" variant="primary" shadow3d />
        <div className="mt-3 flex items-center gap-2">
          <span style={{ fontSize: "1.7rem" }}>🍳</span>
          <p
            style={{
              fontFamily: "'Righteous', cursive",
              fontSize: "clamp(0.9rem, 3.4vw, 1.2rem)",
              letterSpacing: "clamp(0.06em, 0.5vw, 0.16em)",
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #4ade80 0%, #22d3ee 50%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 10px rgba(74,222,128,0.5))",
              margin: 0,
              lineHeight: 1.4,
              fontWeight: 700,
            }}
          >
            Where AI Meets the Frying Pan
          </p>
          <span style={{ fontSize: "1.7rem" }}>✨</span>
        </div>

        {monthly > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <PiggyBank className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800">Money Saved This Month</p>
              <p className="text-lg font-extrabold text-emerald-700">~£{monthly.toFixed(0)}</p>
            </div>
            <p className="ml-auto text-[10px] text-emerald-600 text-right leading-tight max-w-[100px]">
              by using food already in your fridge
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-border shadow-sm focus-within:ring-2 focus-within:ring-primary">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredients or recipes…"
            aria-label="Search ingredients or recipes"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <GoalModeSelector selected={goalMode} onChange={setGoalMode} />
      </header>

      {showLowScanBanner && (
        <button
          onClick={() => setShowPaywall(true)}
          className="mx-5 mt-3 mb-1 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-left ring-1 ring-violet-300 active:scale-[0.98] transition-transform"
          aria-label="Top up scans — only 1 remaining"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <ShoppingBag className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-violet-800">Only 1 scan left — top up now</p>
            <p className="text-[11px] text-violet-700 leading-snug mt-0.5">
              Don't run out mid-cook. Tap to grab another pack.
            </p>
          </div>
          <button
            onClick={dismissLowScanBanner}
            aria-label="Dismiss"
            className="flex-shrink-0 text-violet-400 hover:text-violet-600 text-lg leading-none px-1"
          >
            ×
          </button>
        </button>
      )}

      {showExpiryBanner && (
        <button
          onClick={dismissExpiryBanner}
          className="mx-5 mt-3 mb-1 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-left ring-1 ring-amber-300 active:scale-[0.98] transition-transform"
          aria-label="Dismiss scan credit expiry warning"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <TriangleAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800">
              {expiryDays === 1 ? "Your scans expire tomorrow!" : `Your scans expire in ${expiryDays} days`}
            </p>
            <p className="text-[11px] text-amber-700 leading-snug mt-0.5">
              Use your remaining {credits === 1 ? "scan" : `${credits} scans`} before they're gone. Tap to dismiss.
            </p>
          </div>
        </button>
      )}

      <section className="px-6">
        <style>{`
          @keyframes cameraFlicker {
            0%, 82%, 100% { opacity: 1; transform: scale(1); filter: brightness(1); }
            85% { opacity: 0.35; transform: scale(0.90); filter: brightness(3); }
            88% { opacity: 1; transform: scale(1.08); filter: brightness(1.6); }
            91% { opacity: 0.55; transform: scale(0.95); filter: brightness(2.2); }
            95% { opacity: 1; transform: scale(1.02); filter: brightness(1.1); }
          }
          .hero-camera-flicker { animation: cameraFlicker 2.6s ease-in-out infinite; }
        `}</style>
        <button
          onClick={handleScanPress}
          className="group relative flex w-full flex-col overflow-hidden rounded-3xl p-6 text-primary-foreground transition-transform active:scale-[0.98]"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-75">📸 Point. Snap. Cook.</div>
              <div className="mt-2 text-[1.75rem] font-black leading-none tracking-tight uppercase">
                SCAN YOUR<br />FRIDGE
              </div>
              <div
                style={{
                  minHeight: "1.75rem",
                  transition: "opacity 0.38s ease, transform 0.38s ease",
                  opacity: taglineFading ? 0 : 1,
                  transform: taglineFading ? "translateY(-5px)" : "translateY(0)",
                }}
                className="mt-2 text-base font-extrabold text-yellow-300 leading-tight"
              >
                {TAGLINES[taglineIdx]}
              </div>
              <div className="mt-1.5 text-[0.8rem] opacity-80 leading-snug">
                AI builds your personalised meal plan in seconds
              </div>
              <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${credits === 0 ? "bg-red-500/40" : "bg-white/25"}`}>
                {credits === 0 ? "⛔ " : "⚡ "}{creditLabel}
              </div>
            </div>
            <div className="hero-camera-flicker flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
              <Camera className="h-8 w-8" />
            </div>
          </div>
        </button>
      </section>

      {!sisterDismissed && (
        <a
          href={EFFORTLESS_BURN_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-6 mt-6 flex items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200 active:scale-[0.98] transition-transform"
          onClick={(e) => {
            if (Capacitor.isNativePlatform()) {
              e.preventDefault();
              window.open(EFFORTLESS_BURN_APP_STORE_URL, '_system');
            }
          }}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
            <span className="text-lg">✨</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-rose-800">Love cooking? Burn it off.</p>
            <p className="text-[11px] text-rose-700 leading-snug mt-0.5">
              Try {EFFORTLESS_BURN_NAME} — our sister app for calorie tracking &amp; exercise.
            </p>
          </div>
          <ExternalLink className="h-4 w-4 flex-shrink-0 text-rose-400" />
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissSister(); }}
            aria-label="Dismiss"
            className="flex-shrink-0 text-rose-400 hover:text-rose-600 text-lg leading-none px-1"
          >
            ×
          </button>
        </a>
      )}

      <section className="mt-10 px-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Flame className="h-5 w-5 text-primary" />
            Trending Recipes
          </h2>
          <span className="text-xs font-medium text-muted-foreground">This week</span>
        </div>

        <ul className="mt-4 space-y-3">
          {filtered.length === 0 && (
            <li className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground ring-1 ring-border">
              No recipes match "{query}". Try scanning your fridge instead.
            </li>
          )}
          {filtered.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md active:scale-[0.98]"
            >
              <button
                onClick={() => setSelectedRecipe(r)}
                className="flex flex-1 items-center gap-4 min-w-0 text-left"
                aria-label={`View ${r.title} recipe`}
              >
                <img
                  src={r.image}
                  alt={r.title}
                  width={768}
                  height={512}
                  loading="lazy"
                  className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                    {r.tag}
                  </div>
                  <h3 className="mt-1 truncate text-base font-semibold text-foreground">{r.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time}</span>
                    <span>{r.difficulty}</span>
                  </div>
                </div>
              </button>
              <button
                onClick={async () => {
                  if (!isAuthed) { navigate({ to: "/auth" }); return; }
                  await toggle({ key: `trending:${r.id}`, title: r.title, time: r.time, image: r.image, tag: r.tag });
                }}
                aria-label={isFavorite(`trending:${r.id}`) ? `Remove ${r.title} from favourites` : `Save ${r.title} to favourites`}
                aria-pressed={isFavorite(`trending:${r.id}`)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-colors hover:bg-primary/10"
              >
                <Heart className={`h-5 w-5 ${isFavorite(`trending:${r.id}`) ? "fill-current" : ""}`} />
              </button>
            </li>
          ))}
        </ul>
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
