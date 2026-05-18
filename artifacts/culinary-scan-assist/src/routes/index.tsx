import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Clock, Flame, Heart, Search, PiggyBank, Settings } from "lucide-react";
import { useState } from "react";
import { trendingRecipes, type Recipe } from "@/lib/recipes";
import { useFavorites } from "@/lib/favorites";
import { useAuth, signOut } from "@/lib/use-auth";
import { useScanCredits } from "@/lib/use-scan-credits";
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
  const navigate = useNavigate();
  const { isFavorite, toggle, isAuthed } = useFavorites();
  const { user } = useAuth();
  const { credits, canScan, purchasePlan } = useScanCredits();
  const { goalMode, setGoalMode } = useGoalMode();
  const { monthly } = useSavingsTracker();

  const q = query.trim().toLowerCase();
  const filtered = q
    ? trendingRecipes.filter(
        (r) => r.title.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q),
      )
    : trendingRecipes;

  const handleScanPress = () => {
    if (canScan) {
      navigate({ to: "/scan" });
    } else {
      setShowPaywall(true);
    }
  };

  const creditLabel =
    credits === -1 ? "Unlimited scans" :
    credits === 1  ? "1 free scan remaining" :
    credits === 0  ? "No scans left" :
                     `${credits} scans remaining`;

  return (
    <main className="min-h-screen bg-background pb-12">
      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onUnlock={() => { purchasePlan("yearly"); setShowPaywall(false); }}
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
          <span style={{ fontSize: "1.2rem" }}>🍳</span>
          <p
            style={{
              fontFamily: "'Righteous', cursive",
              fontSize: "clamp(0.72rem, 2.6vw, 1rem)",
              letterSpacing: "clamp(0.06em, 0.5vw, 0.18em)",
              textTransform: "uppercase",
              background: "linear-gradient(90deg, #16a34a 0%, #0d9488 50%, #15803d 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 1px 8px rgba(21,128,61,0.45))",
              margin: 0,
              lineHeight: 1.4,
              fontWeight: 700,
            }}
          >
            Where AI Meets the Frying Pan
          </p>
          <span style={{ fontSize: "1.2rem" }}>✨</span>
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

      <section className="px-6">
        <button
          onClick={handleScanPress}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-3xl p-6 text-primary-foreground transition-transform active:scale-[0.98]"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
        >
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">📸 Point. Snap. Cook.</div>
            <div className="mt-1.5 text-2xl font-extrabold leading-tight">
              Scan Your Fridge<br />
              <span className="text-yellow-300">Get Instant Recipes</span>
            </div>
            <div className="mt-1.5 text-sm opacity-90 leading-snug">
              AI reads your ingredients &amp; builds<br />a personalised meal plan in seconds
            </div>
            <div className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${credits === 0 ? "bg-red-500/40" : "bg-white/25"}`}>
              {credits === 0 ? "⛔ " : "⚡ "}{creditLabel}
            </div>
          </div>
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
            <Camera className="h-8 w-8" />
          </div>
        </button>
      </section>

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
