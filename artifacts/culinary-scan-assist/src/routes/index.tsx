import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, Flame, Heart, Search, PiggyBank } from "lucide-react";
import { useState } from "react";
import { trendingRecipes } from "@/lib/recipes";
import { useFavorites } from "@/lib/favorites";
import { useAuth, signOut } from "@/lib/use-auth";
import { useGoalMode } from "@/lib/use-goal-mode";
import { useSavingsTracker } from "@/lib/use-savings-tracker";
import { GoalModeSelector } from "@/components/goal-mode-selector";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { isFavorite, toggle, isAuthed } = useFavorites();
  const { user } = useAuth();
  const { goalMode, setGoalMode } = useGoalMode();
  const { monthly } = useSavingsTracker();

  const q = query.trim().toLowerCase();
  const filtered = q
    ? trendingRecipes.filter(
        (r) => r.title.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q),
      )
    : trendingRecipes;

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="px-6 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1" style={{ width: "50%" }}>
            <BrandLogo size="2xl" variant="primary" shadow3d />
            <p
              style={{
                fontFamily: "'Righteous', cursive",
                fontSize: "0.78rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                background: "linear-gradient(90deg, #4ade80 0%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 8px rgba(74,222,128,0.35))",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Where AI Meets the Frying Pan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/favorites"
              aria-label="Favourites"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary ring-1 ring-border"
            >
              <Heart className="h-5 w-5" />
            </Link>
            {user ? (
              <button
                onClick={() => signOut()}
                className="rounded-full bg-card px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-border"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="rounded-full px-3 py-2 text-xs font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                Sign in
              </Link>
            )}
          </div>
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

      <section className="mt-6 px-6">
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
              className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
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
    </main>
  );
}
